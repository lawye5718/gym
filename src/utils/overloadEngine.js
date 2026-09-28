/**
 * 渐进超负荷雷达 + Day 5 85% 自动配重引擎
 */

/** 按健身房器械最小步进取整（默认 2.5kg，小器械 1kg） */
export function roundToGymStep(weight, step = 2.5) {
  if (!weight || weight <= 0) return 0
  return Math.round(weight / step) * step
}

/** 挂片机专属：拆解单边标准杠铃片组合 */
export function calculatePlatesPerSide(weightPerSide) {
  const plates = [20, 15, 10, 5, 2.5, 1.25]
  let remaining = weightPerSide
  const result = []
  for (const p of plates) {
    const count = Math.floor((remaining + 0.01) / p)
    if (count > 0) {
      result.push(`${p}kg×${count}`)
      remaining = Number((remaining - count * p).toFixed(2))
    }
  }
  return result.length ? `单边挂片: ${result.join(' + ')}` : '空杆/待配重'
}

function findLastLogForExercise(exerciseId, allLogs) {
  for (const log of allLogs) {
    const found = log.exercises?.find((e) => e.exerciseId === exerciseId)
    if (found && found.sets?.length > 0) return { ...found, date: log.date }
  }
  return null
}

function findLastDay5LogForSource(sourceId, allLogs) {
  for (const log of allLogs) {
    if (log.day === 5) {
      const found = log.exercises?.find((e) => e.day5SourceId === sourceId)
      if (found) return found
    }
  }
  return null
}

/**
 * 获取今日某动作的「默认预填数据」与「渐进超负荷升级提醒」
 */
export function getSmartPrescription(exercisePlan, allLogs) {
  const { id, category, prescription, day } = exercisePlan
  const [minReps, maxReps] = prescription.repRange
  const lastExerciseLog = findLastLogForExercise(id, allLogs)

  // Day 5：按主日 85% 自动折算
  if (day === 5 && prescription.day5SourceId) {
    const mainDayLog = findLastLogForExercise(prescription.day5SourceId, allLogs)
    if (mainDayLog && mainDayLog.sets.length > 0) {
      const mainWeight = mainDayLog.sets[0].weight
      const ratio = category === 'compound' ? 0.85 : 1.0
      const step = mainWeight >= 20 ? 2.5 : 1
      const targetWeight = roundToGymStep(mainWeight * ratio, step)
      return {
        prefillSets: Array.from({ length: prescription.sets }, (_, i) => ({
          setNo: i + 1,
          weight: targetWeight,
          reps: lastExerciseLog?.sets[i]?.reps || (category === 'compound' ? 14 : 15),
          completed: false,
        })),
        overloadBanner:
          category === 'compound'
            ? {
                type: 'day5_rep_push',
                level: 'gold',
                title: `⚡ 85% 扩次模式（主日 ${mainWeight}kg → 今日 ${targetWeight}kg）`,
                message: `无需纠结 RIR！用 ${targetWeight}kg 每一组努力往上加次数，直到向心速度变慢即停（目标冲击 ${minReps}–${maxReps}+ 次）。`,
              }
            : {
                type: 'day5_iso',
                level: 'blue',
                title: `🎯 原重量巩固（${targetWeight}kg × ${prescription.sets} 组）`,
                message: '孤立动作不减重，照常推到速度变慢即停。',
              },
      }
    }
  }

  // 无历史：空白模板
  if (!lastExerciseLog || !lastExerciseLog.sets.length) {
    return {
      prefillSets: Array.from({ length: prescription.sets }, (_, i) => ({
        setNo: i + 1,
        weight: 0,
        reps: minReps,
        completed: false,
      })),
      overloadBanner: null,
    }
  }

  // 常规主日：100% 继承上次
  const prefillSets = Array.from({ length: prescription.sets }, (_, i) => {
    const prevSet = lastExerciseLog.sets[i] || lastExerciseLog.sets[lastExerciseLog.sets.length - 1]
    return { setNo: i + 1, weight: prevSet.weight, reps: prevSet.reps, completed: false }
  })

  const completedSets = lastExerciseLog.sets.filter((s) => s.completed !== false)
  const topWeight = completedSets[0]?.weight || 0
  const allHitMax =
    completedSets.length >= Math.min(3, prescription.sets) &&
    completedSets.slice(0, 3).every((s) => s.reps >= maxReps)
  const avgReps =
    completedSets.reduce((sum, s) => sum + Number(s.reps), 0) / (completedSets.length || 1)

  const lastDay5Log = findLastDay5LogForSource(id, allLogs)
  const day5Exploded = lastDay5Log && lastDay5Log.sets.some((s) => s.reps >= 16)

  let overloadBanner = null

  if (category === 'compound') {
    if (allHitMax || day5Exploded) {
      const nextWeight = roundToGymStep(topWeight * 1.05, topWeight >= 40 ? 2.5 : 1)
      overloadBanner = {
        type: 'upgrade_ready',
        level: 'gold',
        title: `🚀 触发加重法则！建议今日升至 ${nextWeight}kg`,
        message: allHitMax
          ? `上次前 3 组已满 ${maxReps} 次上限！今日果断加重量 2.5–5%，次数退回 ${minReps} 次重新往上推。`
          : `上次 Day 5（85% 重量）已突破 16 次！证明神经与肌力已超量恢复，今日主项可尝试加重至 ${nextWeight}kg。`,
      }
    } else if (avgReps >= maxReps - 1) {
      overloadBanner = {
        type: 'near_upgrade',
        level: 'emerald',
        title: '🔥 距离升级仅差临门一脚！',
        message: `上次完成度极高（均次 ${avgReps.toFixed(1)} 次）。今日死守 ${topWeight}kg，争取前 3 组全部推满 ${maxReps} 次即可解锁下一档重量！`,
      }
    }
  } else if (category === 'isolation') {
    if (allHitMax) {
      overloadBanner = {
        type: 'upgrade_ready',
        level: 'gold',
        title: `🏆 已磨满 ${maxReps} 次大关！可进阶下一档配重`,
        message: `小肌群已完全适应 ${topWeight}kg × ${maxReps} 次。今日可下调一格插销（或 +1kg），次数退回 ${minReps} 次并严防耸肩代偿。`,
      }
    } else {
      const targetNextRep = Math.min(maxReps, Math.round(avgReps) + 1)
      overloadBanner = {
        type: 'rep_progression',
        level: 'blue',
        title: `🎯 孤立扩次法则：保持 ${topWeight}kg，今日目标每组 ${targetNextRep} 次`,
        message: '小肌群不轻易跳重！比上次多做 1 次（或多停顿半秒）就是最完美的渐进超负荷。',
      }
    }
  }

  return { prefillSets, overloadBanner, lastDate: lastExerciseLog.date }
}
