/**
 * V2.5 本地存储层
 * 场馆复合键隔离存储 + 附随设置持久化 + ACSM 周容量统计
 *
 * 升级兼容：首次加载若 V2.5 新键为空，自动从 V1.x 旧键（wava8day.state.v1）
 * 迁移历史训练记录、机位记忆与周期信息，避免训练数据丢失。
 */
import { getVenueExerciseKey } from './overloadEngine.js'

const STORAGE_KEYS = {
  LOGS: 'acsm2026_workout_logs_v25',
  SEAT_MEMORY: 'acsm2026_seat_memory_v25',
  CUSTOM_CONFIGS: 'acsm2026_custom_configs_v25',
  CYCLE_META: 'acsm2026_cycle_meta_v25',
  // V2.6 新增
  AVATARS: 'acsm2026_custom_avatars_v26',
  CUSTOM_PLAN: 'acsm2026_custom_plan_v26',
  UPGRADE_ACK: 'acsm2026_upgrade_ack_v26',
  // V3.0 (V6) 新增：红黄绿灯状态机 / 自由器械等效 / 功能性指标 / 热身与恢复打卡
  V6_STATE: 'acsm2026_v6_state_v30',
}

/** V1.x 旧存储键（仅用于一次性迁移） */
const LEGACY_KEY = 'wava8day.state.v1'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 存储写满时静默失败，不影响训练 */
  }
}

const defaultCycleMeta = { cycleNumber: 1, extraRestDayInserted: false }

/** V3.0 (V6) 状态默认值与读取键 */
export function defaultV6DayState() {
  return {
    statusLight: 'green',
    equiv: {}, // exerciseId -> 'free' | 'machine'
    warmupChecked: false,
    restWalkChecked: false,
    recovery: { walk: false, stretch: false },
    recoverySaved: null,
  }
}

export function defaultV6State() {
  return { metrics: { grip: '', balanceSec: '' }, days: {} }
}

export function v6DayKey(dateStr, user) {
  return `${dateStr}_${user}`
}

export function loadAllState() {
  const state = {
    logs: readJSON(STORAGE_KEYS.LOGS, []),
    seatMemory: readJSON(STORAGE_KEYS.SEAT_MEMORY, {}),
    customConfigs: readJSON(STORAGE_KEYS.CUSTOM_CONFIGS, {}),
    cycleMeta: { ...defaultCycleMeta, ...readJSON(STORAGE_KEYS.CYCLE_META, {}) },
    // V2.6：自定义头像（256×256 压缩 DataURL）、自定义训练计划、升级确认指纹锁
    customAvatars: readJSON(STORAGE_KEYS.AVATARS, {}),
    customPlan: readJSON(STORAGE_KEYS.CUSTOM_PLAN, null),
    upgradeAckMap: readJSON(STORAGE_KEYS.UPGRADE_ACK, {}),
    // V3.0 (V6)：{ metrics:{grip,balanceSec}, days:{ 'yyyy-mm-dd_user': {...} } }
    v6State: readJSON(STORAGE_KEYS.V6_STATE, null) || defaultV6State(),
  }

  // 升级迁移：新键无数据且存在旧键时，从 V1.x 迁移
  if (!state.logs.length && !localStorage.getItem(STORAGE_KEYS.LOGS)) {
    const legacy = readJSON(LEGACY_KEY, null)
    if (legacy) {
      const migrated = migrateLegacy(legacy)
      writeJSON(STORAGE_KEYS.LOGS, migrated.logs)
      writeJSON(STORAGE_KEYS.SEAT_MEMORY, migrated.seatMemory)
      writeJSON(STORAGE_KEYS.CYCLE_META, migrated.cycleMeta)
      return migrated
    }
  }
  return state
}

/** 将 V1.x 整包 state 映射为 V2.5 结构 */
function migrateLegacy(legacy) {
  const logs = (legacy.workoutLogs || []).map((log) => {
    const venue = log.venueMode || 'newGym'
    return {
      logId: `${log.date}_${log.user}_d${log.day}_${venue}`,
      date: log.date,
      updatedAt: Date.parse(log.date) || Date.now(),
      user: log.user,
      day: log.day,
      venueMode: venue,
      cycleNumber: Number(log.cycleNumber) || 1,
      exercises: (log.exercises || []).map((ex) => ({
        ...ex,
        scopedId: ex.scopedId || getVenueExerciseKey(ex.exerciseId, venue),
      })),
    }
  })

  const seatMemory = {}
  for (const [key, val] of Object.entries(legacy.equipmentSettings || {})) {
    seatMemory[key] = typeof val === 'string' ? val : val?.text || ''
  }

  const cycleOffset = legacy.cycleOffset || {}
  const restInserted = legacy.restDaysInserted || {}
  const cycleMeta = {
    cycleNumber: Math.max(Number(cycleOffset.leo || 0), Number(cycleOffset.linda || 0)) + 1,
    extraRestDayInserted: Number(restInserted.leo || 0) > 0 || Number(restInserted.linda || 0) > 0,
  }

  return {
    logs,
    seatMemory,
    customConfigs: {},
    cycleMeta,
    customAvatars: {},
    customPlan: null,
    upgradeAckMap: {},
  }
}

/** 写入 / 更新某动作的组次打卡数据 */
export function saveExerciseSessionLog({
  user,
  day,
  venueMode,
  cycleNumber,
  exerciseId,
  sets,
  quickTags,
}) {
  const state = loadAllState()
  const today = new Date().toISOString().slice(0, 10)
  const logId = `${today}_${user}_d${day}_${venueMode}`
  const scopedId = getVenueExerciseKey(exerciseId, venueMode)

  let dayLog = state.logs.find((l) => l.logId === logId)
  if (!dayLog) {
    dayLog = {
      logId,
      date: today,
      updatedAt: Date.now(),
      user,
      day,
      venueMode,
      cycleNumber,
      exercises: [],
    }
    state.logs.unshift(dayLog)
  } else {
    dayLog.updatedAt = Date.now()
  }

  const exIdx = dayLog.exercises.findIndex((e) => e.scopedId === scopedId || e.exerciseId === exerciseId)
  const payload = { exerciseId, scopedId, sets, quickTags, updatedAt: Date.now() }

  if (exIdx >= 0) {
    dayLog.exercises[exIdx] = payload
  } else {
    dayLog.exercises.push(payload)
  }

  writeJSON(STORAGE_KEYS.LOGS, state.logs)
  return state.logs
}

/** 保存附随设置卡（器械默认重量 / 组数 / 每组默认次数 / 休息秒 / 机位记忆） */
export function saveCustomExerciseConfig(exerciseId, venueMode, configObj) {
  const state = loadAllState()
  const key = getVenueExerciseKey(exerciseId, venueMode)
  state.customConfigs[key] = { ...configObj, updatedAt: Date.now() }
  writeJSON(STORAGE_KEYS.CUSTOM_CONFIGS, state.customConfigs)
  return state.customConfigs
}

/** 一键重置为 ACSM 八天计划标准 */
export function resetCustomExerciseConfig(exerciseId, venueMode) {
  const state = loadAllState()
  const key = getVenueExerciseKey(exerciseId, venueMode)
  delete state.customConfigs[key]
  writeJSON(STORAGE_KEYS.CUSTOM_CONFIGS, state.customConfigs)
  return state.customConfigs
}

/** 机位记忆持久化 */
export function saveSeatMemory(exerciseId, venueMode, text) {
  const state = loadAllState()
  const next = { ...state.seatMemory, [getVenueExerciseKey(exerciseId, venueMode)]: text }
  writeJSON(STORAGE_KEYS.SEAT_MEMORY, next)
  return next
}

/** 周期元信息（当前第几个 8 天循环 / 是否已插入弹性静息日） */
export function saveCycleMeta(meta) {
  writeJSON(STORAGE_KEYS.CYCLE_META, meta)
  return meta
}

/**
 * 统计当前 8 天微循环各重点肌群已完成有效组数
 * 对标 ACSM 2026：每个重点肌群 11–12 组 / 8 天周期
 */
export function calculateACSMCycleVolume(logs, allPlanItems, user, cycleNumber) {
  const groups = {
    quads: { key: 'quads', label: '股四头肌 (前链)', sets: 0, target: 11 },
    glutes_hams: { key: 'glutes_hams', label: '臀大肌与腘绳后链', sets: 0, target: 11 },
    chest: { key: 'chest', label: '胸大肌', sets: 0, target: 11 },
    back: { key: 'back', label: '背阔肌与上背', sets: 0, target: 12 },
    shoulders: { key: 'shoulders', label: '三角肌 (直角肩)', sets: 0, target: 11 },
    arms: { key: 'arms', label: '二头/三头 (含协同)', sets: 0, target: 10 },
    calves: { key: 'calves', label: '小腿 / 提踵', sets: 0, target: 8 },
  }

  const userCycleLogs = logs.filter(
    (l) => l.user === user && (l.cycleNumber === cycleNumber || !cycleNumber)
  )

  for (const log of userCycleLogs) {
    for (const ex of log.exercises || []) {
      let plan = allPlanItems.find((p) => p.id === ex.exerciseId)
      if (!plan) {
        for (const item of allPlanItems) {
          if (item.type === 'superset' && Array.isArray(item.subExercises)) {
            const sub = item.subExercises.find((s) => s.id === ex.exerciseId)
            if (sub) {
              plan = sub
              break
            }
          }
        }
      }
      // 爆发力热身与肩袖热身不计入有效容量
      if (!plan || plan.category === 'power' || plan.category === 'warmup') continue
      const doneCount = (ex.sets || []).filter((s) => s.completed).length
      if (groups[plan.muscleGroup]) {
        groups[plan.muscleGroup].sets += doneCount
      }
      // 复合推拉动作对二头/三头计 0.5 倍协同有效组
      if (
        plan.category === 'compound' &&
        (plan.muscleGroup === 'chest' || plan.muscleGroup === 'back')
      ) {
        groups.arms.sets = Number((groups.arms.sets + doneCount * 0.5).toFixed(1))
      }
    }
  }

  return Object.values(groups)
}

/** 历史战报检索（按用户 / 关键字 / 场馆） */
export function queryWorkoutLogs(logs, filters = {}) {
  const { user, keyword, venueMode } = filters
  return logs.filter((log) => {
    if (user && log.user !== user) return false
    if (venueMode && log.venueMode !== venueMode) return false
    if (keyword) {
      const kw = keyword.toLowerCase()
      const hit = (log.exercises || []).some(
        (ex) =>
          (ex.exerciseId || '').toLowerCase().includes(kw) ||
          (ex.quickTags || []).some((t) => t.toLowerCase().includes(kw))
      )
      if (!hit) return false
    }
    return true
  })
}

/**
 * 保存 Day 2 (Zone 2)、Day 6 (4x4 HIIT) 或 Day 7/8 (静息恢复) 打卡记录
 * 结果写入当日 log 的 cardioSummary 字段，供历史战报展示
 * @param {Object} payload { user, day, venueMode, cycleNumber, cardioData }
 * cardioData 示例:
 *  - Day 2:  { type: 'zone2', durationMinutes: 35, avgHeartRate: 122, tags: ['👃全程鼻呼吸轻松'] }
 *  - Day 6:  { type: 'hiit_4x4', roundsCompleted: 4, peakHeartRate: 168, recoveryHeartRate: 115, tags: ['⚡双腿轻盈正常'] }
 *  - Day 7/8:{ type: 'rest', cnsStatus: '中枢神经满电', tags: [], advanceCycle: true }
 */
export function saveCardioOrRestLog({ user, day, venueMode, cycleNumber, cardioData }) {
  const state = loadAllState()
  const today = new Date().toISOString().slice(0, 10)
  const logId = `${today}_${user}_d${day}_${venueMode}`

  let dayLog = state.logs.find((l) => l.logId === logId)
  if (!dayLog) {
    dayLog = {
      logId,
      date: today,
      updatedAt: Date.now(),
      user,
      day,
      venueMode,
      cycleNumber,
      exercises: [],
      cardioSummary: null,
    }
    state.logs.unshift(dayLog)
  } else {
    dayLog.updatedAt = Date.now()
  }

  dayLog.cardioSummary = {
    ...cardioData,
    completed: true,
    savedAt: new Date().toTimeString().slice(0, 5),
  }

  // Day 8 勾选「开启下一轮微循环」→ 周期 +1 并重置弹性休息日开关
  if (cardioData.advanceCycle) {
    state.cycleMeta.cycleNumber = (Number(state.cycleMeta.cycleNumber) || 1) + 1
    state.cycleMeta.extraRestDayInserted = false
    writeJSON(STORAGE_KEYS.CYCLE_META, state.cycleMeta)
  }

  writeJSON(STORAGE_KEYS.LOGS, state.logs)
  return { logs: state.logs, cycleMeta: state.cycleMeta }
}

/** 主项力量 / 容量趋势（e1RM 与单次总吨位） */
export function buildTrendSeries(logs, user, exerciseId) {
  const series = []
  const sorted = [...logs]
    .filter((l) => l.user === user)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  for (const log of sorted) {
    const ex = (log.exercises || []).find((e) => e.exerciseId === exerciseId)
    if (!ex || !ex.sets?.length) continue
    const done = ex.sets.filter((s) => s.completed && Number(s.reps) > 0)
    if (!done.length) continue
    const best = done.reduce((m, s) => (Number(s.weight) > m.weight ? s : m), done[0])
    const e1rm = Number((Number(best.weight) * (1 + Number(best.reps) / 30)).toFixed(1))
    const volume = done.reduce((sum, s) => sum + Number(s.weight) * Number(s.reps), 0)
    series.push({
      date: log.date,
      weight: Number(best.weight),
      reps: Number(best.reps),
      e1rm,
      volume: Math.round(volume),
    })
  }
  return series
}

/** 备份导出 */
export function exportBackup() {
  const state = loadAllState()
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gym-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** 清空全部本地数据 */
export function resetAllState() {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k))
  return loadAllState()
}

/* ---------- V2.6 自定义头像 ---------- */

/** 保存自定义头像（已由 Canvas 压缩为 256×256 JPEG DataURL，约 20–35KB） */
export function saveCustomAvatar(userKey, dataUrl) {
  const state = loadAllState()
  const next = { ...(state.customAvatars || {}), [userKey]: dataUrl }
  writeJSON(STORAGE_KEYS.AVATARS, next)
  return next
}

/** 恢复默认头像 */
export function resetCustomAvatar(userKey) {
  const state = loadAllState()
  const next = { ...(state.customAvatars || {}) }
  delete next[userKey]
  writeJSON(STORAGE_KEYS.AVATARS, next)
  return next
}

/* ---------- V2.6 自定义训练计划 ---------- */

/**
 * 导入 AI 生成的训练计划 JSON
 * - mode=full：全量替换
 * - mode=patch：仅替换 targetUsers + targetDays 命中的动作，其余天数保留内置计划
 * @returns {{updatedCount: number, plan: Array}}
 */
export function importCustomPlan(parsed) {
  const state = loadAllState()
  const incoming = Array.isArray(parsed?.exercises) ? parsed.exercises : []
  let nextPlan

  if (parsed?.mode === 'full') {
    nextPlan = incoming
  } else {
    const users = Array.isArray(parsed?.targetUsers) ? parsed.targetUsers : []
    const days = Array.isArray(parsed?.targetDays) ? parsed.targetDays : []
    const base = Array.isArray(state.customPlan) ? state.customPlan : []
    // 剔除将被覆盖的 user+day 旧条目，再合并新条目（customPlan 只保存「被自定义覆盖的动作」）
    const kept = base.filter((item) => {
      const userMatch = users.length === 0 || users.includes(item.user)
      const dayMatch = days.length === 0 || days.includes(Number(item.day))
      return !(userMatch && dayMatch)
    })
    nextPlan = [...kept, ...incoming]
  }

  writeJSON(STORAGE_KEYS.CUSTOM_PLAN, nextPlan)
  return { updatedCount: incoming.length, plan: nextPlan }
}

/** 恢复内置 ACSM 2026 默认计划 */
export function resetCustomPlan() {
  writeJSON(STORAGE_KEYS.CUSTOM_PLAN, null)
  return null
}

/* ---------- V2.6 升级确认指纹锁 ---------- */

/**
 * 记录升级提醒的处理结果，避免同一达标记录反复弹窗打扰
 * @param {string} ackKey `${exerciseId}__${venueMode}__${lastLogDate}__${lastTopWeight}`
 * @param {'accepted'|'dismissed'} decision
 */
export function saveUpgradeAck(ackKey, decision) {
  const state = loadAllState()
  const next = { ...(state.upgradeAckMap || {}), [ackKey]: decision }
  writeJSON(STORAGE_KEYS.UPGRADE_ACK, next)
  return next
}

/* ---------- V3.0 (V6) 状态：红黄绿灯 / 等效选择 / 热身与恢复打卡 / 功能指标 ---------- */

/** 读取全量 V6 状态 */
export function loadV6State() {
  const state = loadAllState()
  const base = state.v6State || defaultV6State()
  return { metrics: { grip: '', balanceSec: '', ...(base.metrics || {}) }, days: { ...(base.days || {}) } }
}

/** 读取某天某用户的 V6 当日状态（缺省返回默认值） */
export function getV6DayState(dateStr, user) {
  const v6 = loadV6State()
  return { ...defaultV6DayState(), ...(v6.days[v6DayKey(dateStr, user)] || {}) }
}

/** 写入某天某用户的 V6 当日状态（浅合并 patch） */
export function saveV6DayState(dateStr, user, patch) {
  const v6 = loadV6State()
  const key = v6DayKey(dateStr, user)
  const merged = { ...defaultV6DayState(), ...(v6.days[key] || {}), ...patch }
  v6.days[key] = merged
  writeJSON(STORAGE_KEYS.V6_STATE, v6)
  return v6
}

/** 写入功能性防衰指标（全局，跨天保留） */
export function saveV6Metrics(patch) {
  const v6 = loadV6State()
  v6.metrics = { ...v6.metrics, ...patch }
  writeJSON(STORAGE_KEYS.V6_STATE, v6)
  return v6
}
