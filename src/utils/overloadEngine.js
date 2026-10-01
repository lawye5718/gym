/**
 * V2.8 预填与渐进超负荷引擎
 * 支持「场馆独立默认重量 / 组数 / 每组默认次数」，彻底消灭初始 0kg 空白状态。
 * 取值优先级：
 *   1. 用户在 ⚙️附随设置卡的自定义值（customConfig）
 *   2. seedPlanData 中为 Leo / Linda 针对该场馆预设的 defaultWeight / sets / defaultRepsList
 *   3. 动作自身的 prescription 兜底
 */

/** 按健身房器械最小步进取整 */
export function roundToGymStep(weight, step = 2.5) {
  if (!weight || weight <= 0) return 0
  return Math.round(weight / step) * step
}

/**
 * V2.9.1 用户画像增重步进策略
 * 修复：原逻辑对 ≥20kg 一律 +2.5kg，用在女性上肢孤立动作（侧平举/飞鸟/三头下压/后束）
 *      单次跳跃可达 25%~50%，直接导致动作变形与手腕代偿。
 *
 * Leo（男性高阶）：复合动作 ≥20kg → 2.5kg；肩臂孤立 → 1kg；其余 → 1kg
 * Linda（女性）：下肢复合 → 2.5kg；胸背复合 → 1.25kg；肩臂孤立 → 0.5kg；其余 → 1kg
 */
export function getOverloadStep({ user = 'leo', category, muscleGroup, weight = 0 } = {}) {
  const isLinda = String(user).toLowerCase() === 'linda'
  const lowerBody = ['quads', 'glutes_hams', 'calves', 'legs'].includes(muscleGroup)
  const shoulderArm = ['delts', 'delts_side', 'delts_rear', 'arms', 'biceps', 'triceps'].includes(
    muscleGroup
  )
  const isCompound = category === 'compound' || category === 'power'

  if (isLinda) {
    if (lowerBody && isCompound) return 2.5
    if (shoulderArm) return 0.5 // 匹配小飞鸟插销微调片 / 挂扣配重片
    if (isCompound) return 1.25 // 胸背复合
    return 1
  }

  if (isCompound && Number(weight) >= 20) return 2.5
  if (shoulderArm) return 1
  return 1
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
  return result.length ? result.join('+') : ''
}

/** 场馆隔离的唯一动作存储键 */
export function getVenueExerciseKey(exerciseId, venueMode) {
  return `${exerciseId}__${venueMode}`
}

export function getSmartPrescription(
  exercise,
  venueMode,
  allLogs,
  customConfig = null,
  upgradeAckMap = null
) {
  const { id, category, prescription, day } = exercise
  const activeVariant = exercise.variants?.[venueMode] || exercise.variants?.newGym || {}
  const [minReps, maxReps] = activeVariant.repRange || prescription.repRange || [10, 12]
  const scopedId = `${id}__${venueMode}`

  // 组数：自定义 > 场馆预设 > 计划默认
  const targetSetsCount = customConfig?.sets || activeVariant.sets || prescription.sets || 3

  // 默认重量：自定义 > 场馆预设 > 计划默认（不再出现 0kg）
  const baseDefaultWeight =
    customConfig?.defaultWeight !== undefined
      ? Number(customConfig.defaultWeight)
      : Number(activeVariant.defaultWeight ?? prescription.defaultWeight ?? 20)

  // 每组默认次数阶梯：自定义 > 场馆预设 > 计划默认
  const presetRepsList =
    customConfig?.defaultRepsList?.length
      ? customConfig.defaultRepsList
      : activeVariant.defaultRepsList || prescription.defaultRepsList || []

  const lastExerciseLog = findLastLog(scopedId, id, venueMode, allLogs)

  const useCustomOverride =
    customConfig?.updatedAt &&
    (!lastExerciseLog?.updatedAt || customConfig.updatedAt > lastExerciseLog.updatedAt)

  // ── Day 5（85% 扩次）：同源主项回退查找链 ──
  // V2.9.1 修复：动作拆卡后（如 d1_e2 拆成 d1_e2a 哈克 / d1_e2b 腿举），
  // 若用户只做了其中一个子动作，旧逻辑会因索引不到主源而直接掉到底线默认重量，
  // 造成 85% 负荷失真。现按 day5SourceId（支持数组）顺序检索主源 → 并列回退源。
  if (day === 5 && prescription.day5SourceId && !useCustomOverride) {
    const targetSourceIds = Array.isArray(prescription.day5SourceId)
      ? prescription.day5SourceId
      : [prescription.day5SourceId]

    let rawMainWeight = 0
    let sourceLogDate = null

    // 顺序查找主源及回退并列源
    for (const srcId of targetSourceIds) {
      const scopedSourceId = `${srcId}__${venueMode}`
      const mainDayLog =
        findLastLog(scopedSourceId, srcId, venueMode, allLogs) ||
        findLastLogAnyVenue(srcId, allLogs)
      if (mainDayLog?.sets?.length) {
        const validCompleted = mainDayLog.sets.filter((s) => s.completed !== false)
        rawMainWeight = Number(validCompleted[0]?.weight || mainDayLog.sets[0]?.weight) || 0
        sourceLogDate = mainDayLog.date
        if (rawMainWeight > 0) break
      }
    }

    const step = getOverloadStep({
      user: exercise.user,
      category,
      muscleGroup: exercise.muscleGroup,
      weight: rawMainWeight,
    })
    const targetDay5Weight =
      rawMainWeight > 0
        ? roundToGymStep(rawMainWeight * (category === 'compound' ? 0.85 : 1.0), step)
        : baseDefaultWeight

    const prefillSets = Array.from({ length: targetSetsCount }, (_, i) => {
      const prevSet = lastExerciseLog?.sets?.[i]
      return {
        setNo: i + 1,
        weight: targetDay5Weight,
        reps: prevSet?.reps ? Number(prevSet.reps) : presetRepsList[i] ?? maxReps,
        completed: false,
      }
    })

    return {
      prefillSets,
      lastWeight: targetDay5Weight,
      overloadBanner: {
        type: 'day5_rep_push',
        level: 'info',
        title:
          category === 'compound'
            ? `⚡ 85% 扩次模式（今日建议 ${targetDay5Weight}kg）`
            : `🎯 原重巩固模式（今日建议 ${targetDay5Weight}kg）`,
        message: '专注离心 2 秒制动，向心变慢即停！',
      },
      lastDate: sourceLogDate || lastExerciseLog?.date || null,
    }
  }

  // ── 首次训练 / 刚改设置：直接填入为 Leo、Linda 量身定制的默认重量与每组次数 ──
  if (!lastExerciseLog || !lastExerciseLog.sets?.length || useCustomOverride) {
    return {
      prefillSets: Array.from({ length: targetSetsCount }, (_, i) => ({
        setNo: i + 1,
        weight: baseDefaultWeight,
        reps: presetRepsList[i] ?? presetRepsList[presetRepsList.length - 1] ?? minReps,
        completed: false,
      })),
      lastWeight: baseDefaultWeight,
      overloadBanner: null,
      lastDate: null,
    }
  }

  // ── 常规训练：一对一继承同场馆上次每组真实重量与递减次数 ──
  const prefillSets = Array.from({ length: targetSetsCount }, (_, i) => {
    const sourceSet =
      lastExerciseLog.sets[i] || lastExerciseLog.sets[lastExerciseLog.sets.length - 1]
    return {
      setNo: i + 1,
      weight: Number(sourceSet?.weight) || baseDefaultWeight,
      reps: Number(sourceSet?.reps) || presetRepsList[i] || minReps,
      completed: false,
    }
  })

  // ── 升级提醒（带 ackKey 防重复打扰） ──
  const completedSets = lastExerciseLog.sets.filter((s) => s.completed !== false)
  const topWeight = Number(completedSets[0]?.weight) || baseDefaultWeight
  const ackKey = `${id}__${venueMode}__${lastExerciseLog.date}__${topWeight}`
  const isAcked = Boolean(upgradeAckMap?.[ackKey])

  let overloadBanner = null
  if (!isAcked && completedSets.length >= Math.min(3, targetSetsCount)) {
    const allHitMax = completedSets
      .slice(0, Math.min(3, targetSetsCount))
      .every((s) => Number(s.reps) >= maxReps)
    // V2.9.1：改用用户画像步进，避免女性上肢孤立动作一次 +2.5kg 导致动作变形
    const step = getOverloadStep({
      user: exercise.user,
      category,
      muscleGroup: exercise.muscleGroup,
      weight: topWeight,
    })
    const recommendedWeight = roundToGymStep(topWeight + step, step)

    if (allHitMax) {
      overloadBanner = {
        type: 'upgrade_ready',
        level: 'gold',
        ackKey,
        recommendedWeight,
        resetReps: minReps,
        title: `🚀 上次已推满 ${maxReps} 次！建议升至 ${recommendedWeight}kg`,
        message: '点「确认升重」应用新重量，或「暂不」忽略本次提醒。',
      }
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
