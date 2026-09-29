/**
 * 三级预填与渐进超负荷引擎（V2.5）
 * 融合：附随设置卡(customConfig) + 逐组真实递减次数继承 + 升级重算 + Day5 85% 折算 + 挂片计算
 */

/** 按健身房器械最小步进取整 */
export function roundToGymStep(weight, step = 2.5) {
  if (!weight || weight <= 0) return 0
  return Math.round(weight / step) * step
}

/** 挂片机专属：拆解单边标准杠铃片组合 */
export function calculatePlatesPerSide(weightPerSide) {
  const plates = [20, 15, 10, 5, 2.5, 1.25]
  let remaining = Number(weightPerSide) || 0
  const result = []
  for (const p of plates) {
    const count = Math.floor((remaining + 0.01) / p)
    if (count > 0) {
      result.push(`${p}×${count}`)
      remaining = Number((remaining - count * p).toFixed(2))
    }
  }
  return result.length ? `单边: ${result.join('+')}` : ''
}

/** 场馆隔离的唯一动作存储键，防止三馆配重互相污染 */
export function getVenueExerciseKey(exerciseId, venueMode) {
  return `${exerciseId}__${venueMode}`
}

/**
 * 智能处方生成器
 * 数据带入优先级：
 * 1. 附随设置卡锁定覆盖 或 无历史打卡 → 使用设置卡的重量与每组默认次数；
 * 2. 有同场馆历史 → 逐组一对一精准带入上次真实重量与真实递减次数（如 22→15→12）；
 * 3. Day 5（85% 扩次日）→ 取同场馆主日重量 85%，并继承上次 Day5 各组次数；
 * 4. 达到/接近升级次数 → 生成升级提醒与「按新重量算」重置参数。
 */
export function getSmartPrescription(exercise, venueMode, allLogs, customConfig = null) {
  const { id, category, prescription, day } = exercise
  const [minReps, maxReps] = prescription.repRange
  const scopedId = getVenueExerciseKey(id, venueMode)

  // 合并附随设置卡中的组数 / 重量 / 每组默认次数
  const targetSetsCount = customConfig?.sets || prescription.sets
  const baseDefaultWeight = customConfig?.defaultWeight ?? 0
  const baseDefaultRepsList = customConfig?.defaultRepsList || []

  const lastExerciseLog = findLastLog(scopedId, id, venueMode, allLogs)

  // 设置卡更新时间晚于最近打卡 → 优先使用设置卡
  const useCustomOverride =
    customConfig?.updatedAt &&
    (!lastExerciseLog?.updatedAt || customConfig.updatedAt > lastExerciseLog.updatedAt)

  // ── Day 5（第二遍扩次日）85% 自动折算 ──
  if (day === 5 && prescription.day5SourceId && !useCustomOverride) {
    const scopedSourceId = getVenueExerciseKey(prescription.day5SourceId, venueMode)
    const mainDayLog =
      findLastLog(scopedSourceId, prescription.day5SourceId, venueMode, allLogs) ||
      findLastLogAnyVenue(prescription.day5SourceId, allLogs)

    const mainWeight = Number(mainDayLog?.sets?.[0]?.weight) || baseDefaultWeight || 0
    const ratio = category === 'compound' ? 0.85 : 1.0
    const step = mainWeight >= 20 ? 2.5 : 1
    const targetDay5Weight = roundToGymStep(mainWeight * ratio, step)

    const prefillSets = Array.from({ length: targetSetsCount }, (_, i) => {
      const prevDay5Set = lastExerciseLog?.sets?.[i]
      const weightChanged = prevDay5Set && Math.abs(Number(prevDay5Set.weight) - targetDay5Weight) >= 0.5
      return {
        setNo: i + 1,
        weight: targetDay5Weight || Number(prevDay5Set?.weight) || baseDefaultWeight,
        reps:
          !weightChanged && prevDay5Set?.reps
            ? Number(prevDay5Set.reps)
            : baseDefaultRepsList[i] || (category === 'compound' ? Math.max(12, 15 - i) : Math.max(15, 18 - i)),
        completed: false,
      }
    })

    return {
      prefillSets,
      lastWeight: Number(lastExerciseLog?.sets?.[0]?.weight) || targetDay5Weight,
      overloadBanner: {
        type: 'day5_rep_push',
        level: 'info',
        title:
          category === 'compound'
            ? `⚡ 85% 扩次模式（主日 ${mainWeight}kg → 今日 ${targetDay5Weight}kg）`
            : `🎯 孤立原重巩固（${targetDay5Weight}kg × ${targetSetsCount}组）`,
        message: '已带入各组目标次数，推到向心速度变慢即停！',
      },
      lastDate: lastExerciseLog?.date || mainDayLog?.date || null,
    }
  }

  // ── 无历史 或 设置卡刚更新 ──
  if (!lastExerciseLog || !lastExerciseLog.sets?.length || useCustomOverride) {
    return {
      prefillSets: Array.from({ length: targetSetsCount }, (_, i) => ({
        setNo: i + 1,
        weight: baseDefaultWeight,
        reps: baseDefaultRepsList[i] ?? minReps,
        completed: false,
      })),
      lastWeight: baseDefaultWeight,
      overloadBanner: useCustomOverride
        ? {
            type: 'custom_applied',
            level: 'emerald',
            title: `⚙️ 已应用附随设置卡预设（${baseDefaultWeight}kg）`,
            message: `各组默认次数：${Array.from(
              { length: targetSetsCount },
              (_, i) => baseDefaultRepsList[i] ?? minReps
            ).join(' / ')} 次`,
          }
        : null,
      lastDate: null,
    }
  }

  // ── 常规训练：逐组精准带入上次每组真实重量与递减次数 ──
  const prefillSets = Array.from({ length: targetSetsCount }, (_, i) => {
    const exactPrevSet = lastExerciseLog.sets[i]
    const fallbackPrevSet = lastExerciseLog.sets[lastExerciseLog.sets.length - 1]
    const sourceSet = exactPrevSet || fallbackPrevSet
    return {
      setNo: i + 1,
      weight: Number(sourceSet?.weight) ?? baseDefaultWeight,
      reps: Number(sourceSet?.reps) ?? baseDefaultRepsList[i] ?? minReps,
      completed: false,
    }
  })

  // ── 渐进超负荷升级判定 ──
  const completedSets = lastExerciseLog.sets.filter((s) => s.completed !== false)
  const topWeight = Number(completedSets[0]?.weight) || baseDefaultWeight
  const checkCount = Math.min(3, targetSetsCount)
  const allHitMax =
    completedSets.length >= checkCount &&
    completedSets.slice(0, checkCount).every((s) => Number(s.reps) >= maxReps)
  const firstSetReps = Number(completedSets[0]?.reps) || 0
  const step = topWeight >= 30 ? 2.5 : 1
  const recommendedWeight = roundToGymStep(topWeight + step, step)

  let overloadBanner = null
  if (allHitMax || firstSetReps >= maxReps + 2) {
    overloadBanner = {
      type: 'upgrade_ready',
      level: 'gold',
      recommendedWeight,
      resetReps: minReps,
      title: `🚀 达到升级标准！建议升至 ${recommendedWeight}kg`,
      message: `上次各组完成 [${completedSets.map((s) => s.reps).join(' / ')}] 次。点右侧「按新重量算」升重并将次数重置为 ${minReps} 次！`,
    }
  } else if (firstSetReps >= maxReps - 1) {
    overloadBanner = {
      type: 'near_upgrade',
      level: 'emerald',
      recommendedWeight,
      resetReps: minReps,
      title: `🔥 接近升级线（上次：${completedSets.map((s) => s.reps).join(' / ')} 次）`,
      message: `已原样带入上次各组次数，今日努力把后几组推满 ${maxReps} 次即可升级！`,
    }
  }

  return {
    prefillSets,
    lastWeight: topWeight,
    overloadBanner,
    lastDate: lastExerciseLog.date,
  }
}

/** 当前场馆下该动作最近一次打卡记录 */
function findLastLog(scopedId, rawId, venueMode, allLogs) {
  for (const log of allLogs) {
    if (log.venueMode && log.venueMode !== venueMode) continue
    const found = log.exercises?.find((e) => e.scopedId === scopedId || e.exerciseId === rawId)
    if (found && found.sets?.length > 0) {
      return { ...found, date: log.date, updatedAt: log.updatedAt || 0 }
    }
  }
  return null
}

/** 跨场馆兜底查找（Day5 主日重量无同场馆记录时使用） */
function findLastLogAnyVenue(rawId, allLogs) {
  for (const log of allLogs) {
    const found = log.exercises?.find((e) => e.exerciseId === rawId)
    if (found && found.sets?.length > 0) {
      return { ...found, date: log.date, updatedAt: log.updatedAt || 0 }
    }
  }
  return null
}
