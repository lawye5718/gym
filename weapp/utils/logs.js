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
