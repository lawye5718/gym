/**
 * logs.js —— 打卡与配置落库（替代 Web 版 storageSync）
 * 数据结构与 Web 版保持一致（acsm2026_logs 等），便于日后与 Web 版互通。
 */
import { get, set } from './store.js'

const todayStr = () => new Date().toISOString().slice(0, 10)

function upsertDayLog({ user, day, venueMode, cycleNumber = 1 }) {
  const logs = get('logs', [])
  const today = todayStr()
  let log = logs.find(
    (l) => l.date === today && l.user === user && l.day === day && l.venueMode === venueMode
  )
  if (!log) {
    log = {
      date: today,
      user,
      day,
      venueMode,
      cycleNumber,
      exercises: [],
      cardioSummary: null,
      updatedAt: Date.now(),
    }
    logs.push(log)
  }
  return { logs, log }
}

/** 保存某个动作的当次组数据 */
export function saveExerciseSessionLog({
  user,
  day,
  venueMode,
  cycleNumber = 1,
  exerciseId,
  sets,
  quickTags = [],
}) {
  const { logs, log } = upsertDayLog({ user, day, venueMode, cycleNumber })
  const rec = {
    exerciseId,
    scopedId: `${exerciseId}__${venueMode}`,
    sets: sets || [],
    quickTags,
    updatedAt: Date.now(),
  }
  const idx = log.exercises.findIndex((e) => e.exerciseId === exerciseId)
  if (idx >= 0) log.exercises[idx] = rec
  else log.exercises.push(rec)
  log.updatedAt = Date.now()
  set('logs', logs)
  return logs
}

/** 自定义动作配置（默认重量/组数/次数/休息） */
export function saveCustomConfig(exerciseId, venue, cfg) {
  const all = get('custom_configs', {})
  const key = `${exerciseId}__${venue}`
  all[key] = { ...(all[key] || {}), ...cfg, updatedAt: Date.now() }
  set('custom_configs', all)
  return all
}

/** 机位记忆 */
export function saveSeatMemory(key, text) {
  const all = get('seat_memory', {})
  all[key] = text
  set('seat_memory', all)
  return all
}

/** 升级提醒确认 */
export function saveUpgradeAck(ackKey, decision) {
  const all = get('upgrade_ack', {})
  all[ackKey] = decision
  set('upgrade_ack', all)
  return all
}

/** 有氧 / 静息日记录 */
export function saveCardioOrRest({ user, day, venueMode, cycleNumber = 1, cardioData }) {
  const { logs, log } = upsertDayLog({ user, day, venueMode, cycleNumber })
  log.cardioSummary = cardioData
  log.updatedAt = Date.now()
  set('logs', logs)
  return { logs, cycleMeta: get('cycle_meta', { cycleNumber: 1 }) }
}

/** 取当日 log */
export function getTodayLog({ user, day, venueMode }) {
  const logs = get('logs', [])
  const today = todayStr()
  return logs.find(
    (l) => l.date === today && l.user === user && l.day === day && l.venueMode === venueMode
  ) || null
}

/** 清除某个动作的自定义配置（回到 ACSM 计划标准） */
export function resetCustomConfig(exerciseId, venue) {
  const all = get('custom_configs', {})
  delete all[`${exerciseId}__${venue}`]
  set('custom_configs', all)
  return all
}

/** 自定义头像（base64 字符串） */
export function saveCustomAvatar(userKey, dataUrl) {
  const all = get('custom_avatars', {})
  all[userKey] = dataUrl
  set('custom_avatars', all)
  return all
}

export function resetCustomAvatar(userKey) {
  const all = get('custom_avatars', {})
  delete all[userKey]
  set('custom_avatars', all)
  return all
}

/**
 * 导入自定义训练计划（与 Web 版 storageSync.importCustomPlan 一致）
 * mode='full'  → 整体替换
 * mode='patch' → 按 targetUsers / targetDays 局部覆盖后合并
 */
export function importCustomPlan(parsed) {
  const incoming = Array.isArray(parsed?.exercises) ? parsed.exercises : []
  let nextPlan
  if (parsed?.mode === 'full') {
    nextPlan = incoming
  } else {
    const users = Array.isArray(parsed?.targetUsers) ? parsed.targetUsers : []
    const days = Array.isArray(parsed?.targetDays) ? parsed.targetDays : []
    const base = get('custom_plan', []) || []
    const kept = (base || []).filter((item) => {
      const userMatch = users.length === 0 || users.includes(item.user)
      const dayMatch = days.length === 0 || days.includes(Number(item.day))
      return !(userMatch && dayMatch)
    })
    nextPlan = [...kept, ...incoming]
  }
  set('custom_plan', nextPlan)
  return { updatedCount: incoming.length, plan: nextPlan }
}

/** 恢复内置 ACSM 2026 默认计划 */
export function resetCustomPlan() {
  set('custom_plan', null)
  return null
}

export function getCustomPlan() {
  return get('custom_plan', null)
}
