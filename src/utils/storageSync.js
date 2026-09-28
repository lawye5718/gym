/**
 * 本地优先（Local-First）存储层 + 云端同步预留 + 统计聚合
 * 云端接口：GET /api/sync  拉取全量；POST /api/sync 提交全量
 * 未配置 VITE_SYNC_API 时全部静默走本地，不影响离线使用。
 */

import { PLAN_LIBRARY } from '../data/seedPlanData'

const LS_KEY = 'wava8day.state.v1'
const SYNC_API = import.meta.env?.VITE_SYNC_API || ''

const emptyState = () => ({
  version: 1,
  equipmentSettings: {},
  workoutLogs: [],
  cycleOffset: { leo: 0, linda: 0 },
  restDaysInserted: { leo: 0, linda: 0 },
  updatedAt: null,
})

export function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw)
    return { ...emptyState(), ...parsed }
  } catch {
    return emptyState()
  }
}

export function saveState(state) {
  const next = { ...state, updatedAt: new Date().toISOString() }
  localStorage.setItem(LS_KEY, JSON.stringify(next))
  // 云端同步：失败静默，保证健身房弱网可用
  if (SYNC_API) pushToCloud(next)
  return next
}

export function resetState() {
  localStorage.removeItem(LS_KEY)
  return emptyState()
}

/** ---------- 云端同步（预留） ---------- */
export async function pullFromCloud() {
  if (!SYNC_API) return null
  try {
    const res = await fetch(`${SYNC_API}?t=${Date.now()}`, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function pushToCloud(state) {
  if (!SYNC_API) return false
  try {
    const res = await fetch(SYNC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })
    return res.ok
  } catch {
    return false
  }
}

/** ---------- 备份导出 / 导入 ---------- */
export function exportBackup(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `wava8day-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve({ ...emptyState(), ...JSON.parse(reader.result) })
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

/** ---------- 日志读写 ---------- */
export function upsertDayLog(state, log) {
  const logs = (state.workoutLogs || []).filter(
    (l) => !(l.user === log.user && l.day === log.day && l.date === log.date && l.cycleNumber === log.cycleNumber)
  )
  return { ...state, workoutLogs: [log, ...logs] }
}

export function saveEquipment(state, key, text) {
  return {
    ...state,
    equipmentSettings: {
      ...(state.equipmentSettings || {}),
      [key]: { text, updatedAt: new Date().toISOString().slice(0, 10) },
    },
  }
}

/** ---------- 检索与统计 ---------- */
export function queryWorkoutLogs(logs, filters = {}) {
  return logs.filter((log) => {
    if (filters.user && log.user !== filters.user) return false
    if (filters.day && log.day !== Number(filters.day)) return false
    if (filters.startDate && log.date < filters.startDate) return false
    if (filters.endDate && log.date > filters.endDate) return false
    if (filters.keyword || filters.tag) {
      const kw = (filters.keyword || '').toLowerCase()
      const matchExercise = log.exercises?.some((ex) => {
        const planName = PLAN_LIBRARY.find((p) => p.id === ex.exerciseId)?.variants?.newGym?.name || ''
        const nameMatch =
          !kw ||
          ex.exerciseId.toLowerCase().includes(kw) ||
          planName.toLowerCase().includes(kw) ||
          (ex.note || '').toLowerCase().includes(kw)
        const tagMatch = !filters.tag || ex.quickTags?.includes(filters.tag)
        return nameMatch && tagMatch
      })
      if (!matchExercise) return false
    }
    return true
  })
}

const TARGET_GROUPS = {
  quads: { label: '股四头/下肢前链', sets: 0, target: 10 },
  glutes_hams: { label: '臀大肌/腘绳后链', sets: 0, target: 10 },
  chest: { label: '胸大肌', sets: 0, target: 10 },
  back: { label: '背阔肌/上背', sets: 0, target: 12 },
  shoulders: { label: '三角肌(前/中/后)', sets: 0, target: 10 },
  arms: { label: '二头/三头肌', sets: 0, target: 8 },
  calves: { label: '小腿/提踵', sets: 0, target: 8 },
}

/** 当前微循环各肌群有效组数 vs ACSM 2026 基准 */
export function calculateCycleMuscleVolume(logs, planLibrary, user, cycleNumber) {
  const groups = JSON.parse(JSON.stringify(TARGET_GROUPS))
  const cycleLogs = logs.filter((l) => l.user === user && Number(l.cycleNumber || 1) === Number(cycleNumber))
  for (const log of cycleLogs) {
    for (const ex of log.exercises || []) {
      const planItem = planLibrary.find((p) => p.id === ex.exerciseId)
      if (!planItem || planItem.category === 'power' || planItem.category === 'warmup') continue
      const completedCount = (ex.sets || []).filter((s) => s.completed).length
      if (groups[planItem.muscleGroup]) groups[planItem.muscleGroup].sets += completedCount
    }
  }
  return Object.entries(groups).map(([key, v]) => ({ key, ...v }))
}

/** 主项力量/容量趋势（e1RM 与总吨位） */
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
