/**
 * deckFlattener.js —— V2.9 牌堆扁平化器
 *
 * 职责：把当日牌堆中的超级组（superset）安全展开为 A / B 两个互相独立的条目，
 *      统一供「🧾 当日清算卡」与「ACSM 周容量审计」消费，
 *      避免嵌套结构导致的漏统计、重复统计或运行时报错。
 *
 * 设计要点：
 *  ① 单动作卡原样输出，并附带当前场馆的 activeVariant 摘要（名称/机位/默认重量）
 *  ② 超级组按 A、B 顺序展开子动作，标记 parentSupersetId，保证：
 *     - 两者拥有彼此独立的历史记录与默认重量（互不干扰）
 *     - 清算卡可分别修改 A / B 的任意一组（重量与次数双向同步）
 *     - ACSM 周容量审计按子动作各自归属肌群分别计数
 *  ③ 对脏数据（空项 / 子动作缺失）做防御，绝不抛错
 */

/** 取当前场馆变体，并生成展示与统计所需的 activeVariant 摘要 */
export function normalizeExercise(item, venueMode = 'newGym') {
  const v = item?.variants?.[venueMode] || item?.variants?.newGym || {}
  return {
    ...item,
    activeVariant: {
      name: v.name || item?.order || item?.id || '未命名动作',
      machineCode: v.machineCode || '',
      isPlateLoaded: Boolean(v.isPlateLoaded),
      defaultSeatNote: v.defaultSeatNote || '标准机位',
      defaultWeight: v.defaultWeight,
      sets: v.sets,
      defaultRepsList: v.defaultRepsList,
    },
  }
}

/**
 * 将当日动作（含超级组）扁平化为「独立条目」数组
 * @param {Array} dayExercises buildDayExercises 产出的当日动作（可能含 superset）
 * @param {string} venueMode  当前场馆：newGym | oldGym | home
 * @returns {Array} 每条均为单动作，超级组被拆成两条（带 parentSupersetId）
 */
export function flattenDayExercises(dayExercises, venueMode = 'newGym') {
  const out = []
  for (const ex of dayExercises || []) {
    if (!ex) continue
    if (ex.type === 'superset' && Array.isArray(ex.subExercises)) {
      ex.subExercises.forEach((sub, i) => {
        if (!sub) return
        out.push({
          ...normalizeExercise(sub, venueMode),
          parentSupersetId: ex.id,
          supersetLabel: `${ex.id} · ${'AB'[i] || String(i + 1)}`,
        })
      })
    } else {
      out.push(normalizeExercise(ex, venueMode))
    }
  }
  return out
}

/**
 * 供 ACSM 周容量审计使用：把当日动作折算为审计条目
 * @returns {Array<{exerciseId,name,muscleGroup,plannedSets,parentSupersetId}>}
 */
export function toAuditEntries(dayExercises, venueMode = 'newGym') {
  return flattenDayExercises(dayExercises, venueMode).map((ex) => ({
    exerciseId: ex.id,
    name: ex.activeVariant?.name || ex.id,
    muscleGroup: ex.muscleGroup || 'unknown',
    plannedSets: Number(ex.activeVariant?.sets || ex.prescription?.sets || 0),
    parentSupersetId: ex.parentSupersetId || null,
  }))
}

export default flattenDayExercises
