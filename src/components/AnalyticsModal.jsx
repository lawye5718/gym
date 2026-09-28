import { useMemo, useState } from 'react'
import { X, Search, TrendingUp, Dumbbell, History } from 'lucide-react'
import { PLAN_LIBRARY, DAY_META } from '../data/seedPlanData'
import { queryWorkoutLogs, calculateCycleMuscleVolume, buildTrendSeries } from '../utils/storageSync'

const QUICK_TAGS = [
  '⚡1.5s减速停(RIR2)',
  '🛑底部停1秒极稳',
  '🔥末组双起单下',
  '🧤死手模式零抓握',
  '⚠️关节微紧',
]

const TAG_COLORS = ['bg-indigo-500/20 text-indigo-200', 'bg-emerald-500/20 text-emerald-200']

function nameOf(exerciseId) {
  const p = PLAN_LIBRARY.find((x) => x.id === exerciseId)
  if (!p) return exerciseId
  return p.variants?.newGym?.name || p.order || exerciseId
}

/** 轻量内联 SVG 趋势图（e1RM 折线 + 容量柱） */
function TrendChart({ series }) {
  if (!series || series.length < 2) {
    return <p className="text-slate-400 text-xs py-6 text-center">至少两次记录才能画出趋势线</p>
  }
  const W = 300
  const H = 140
  const pad = 18
  const e1 = series.map((s) => s.e1rm)
  const vol = series.map((s) => s.volume)
  const maxE1 = Math.max(...e1) * 1.1 || 1
  const maxVol = Math.max(...vol) * 1.1 || 1
  const n = series.length
  const xAt = (i) => pad + (i * (W - pad * 2)) / Math.max(1, n - 1)
  const yE1 = (v) => H - pad - (v / maxE1) * (H - pad * 2)
  const yVol = (v) => H - pad - (v / maxVol) * (H - pad * 2)
  const line = e1.map((v, i) => `${xAt(i)},${yE1(v)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {vol.map((v, i) => (
        <rect
          key={i}
          x={xAt(i) - 7}
          y={yVol(v)}
          width={14}
          height={H - pad - yVol(v)}
          className="fill-sky-500/30"
          rx={2}
        />
      ))}
      <polyline points={line} fill="none" className="stroke-emerald-400" strokeWidth={2.5} />
      {series.map((s, i) => (
        <text key={i} x={xAt(i)} y={H - 4} fontSize={8} textAnchor="middle" className="fill-slate-500">
          {s.date.slice(5)}
        </text>
      ))}
    </svg>
  )
}

function VolumeBars({ groups }) {
  return (
    <div className="space-y-2.5">
      {groups.map((g) => {
        const pct = Math.min(100, Math.round((g.sets / g.target) * 100))
        const hit = g.sets >= g.target
        return (
          <div key={g.key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">{g.label}</span>
              <span className={hit ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                {g.sets}/{g.target} 组 {hit ? '✓' : ''}
              </span>
            </div>
            <div className="h-2.5 bg-ink-900 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${hit ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AttendanceHeatmap({ logs, user, cycleNumber }) {
  const days = DAY_META.map((d) => d.day)
  const done = new Set(
    logs
      .filter((l) => l.user === user && l.cycleNumber === cycleNumber)
      .map((l) => l.day)
  )
  return (
    <div className="grid grid-cols-8 gap-1.5 mt-1">
      {days.map((d) => (
        <div
          key={d}
          className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold ${
            done.has(d) ? 'bg-emerald-500/70 text-ink-900' : 'bg-ink-700 text-slate-500'
          }`}
          title={`Day ${d}`}
        >
          {d}
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsModal({ state, user, onClose, onToast }) {
  const [tab, setTab] = useState('volume')
  const [filters, setFilters] = useState({ keyword: '', tag: '', day: '', start: '', end: '' })
  const [trendId, setTrendId] = useState('leo_d1_m1')

  const allLogs = state.workoutLogs || []
  const cycleNumber = useMemo(() => {
    const userLogs = allLogs.filter((l) => l.user === user)
    return userLogs.length ? Math.max(...userLogs.map((l) => Number(l.cycleNumber || 1))) : 1
  }, [allLogs, user])

  const filtered = useMemo(
    () =>
      queryWorkoutLogs(allLogs, {
        user,
        keyword: filters.keyword,
        tag: filters.tag,
        day: filters.day,
        startDate: filters.start,
        endDate: filters.end,
      }),
    [allLogs, user, filters]
  )

  const groups = useMemo(
    () => calculateCycleMuscleVolume(allLogs, PLAN_LIBRARY, user, cycleNumber),
    [allLogs, user, cycleNumber]
  )

  const trend = useMemo(() => buildTrendSeries(allLogs, user, trendId), [allLogs, user, trendId])

  // 可选的主项动作（复合/孤立，用于趋势图）
  const trendOptions = useMemo(
    () =>
      PLAN_LIBRARY.filter(
        (p) => p.user === user && (p.category === 'compound' || p.category === 'isolation')
      ),
    [user]
  )

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wava8day-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    onToast?.('已导出 JSON 备份 💾')
  }

  const TabBtn = ({ id, label, icon }) => (
    <button
      onClick={() => setTab(id)}
      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition ${
        tab === id ? 'bg-indigo-600 text-white' : 'text-slate-400'
      }`}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col" onClick={onClose}>
      <div
        className="flex-1 mt-8 bg-ink-900 rounded-t-3xl overflow-y-auto safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-ink-900/95 backdrop-blur z-10 flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h2 className="text-base font-extrabold text-white">📊 {user === 'leo' ? 'Leo' : 'Linda'} 数据中心</h2>
          <div className="flex items-center gap-2">
            <button onClick={exportJson} className="text-[11px] text-slate-300 px-2 py-1.5 rounded-lg bg-ink-700">
              导出备份
            </button>
            <button onClick={onClose} className="text-slate-400 p-1">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 p-3">
          <TabBtn id="volume" label="容量达标" icon={<Dumbbell size={14} />} />
          <TabBtn id="trend" label="力量趋势" icon={<TrendingUp size={14} />} />
          <TabBtn id="history" label="历史检索" icon={<History size={14} />} />
        </div>

        <div className="px-3 pb-8">
          {tab === 'volume' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-ink-800 border border-slate-700 p-4">
                <div className="text-sm font-bold text-white mb-3">
                  微循环 #{cycleNumber} · 各肌群有效组数 vs ACSM ≥10 组
                </div>
                <VolumeBars groups={groups} />
              </div>
              <div className="rounded-2xl bg-ink-800 border border-slate-700 p-4">
                <div className="text-xs font-bold text-slate-300 mb-2">出勤热力图（本周期 Day 1–8）</div>
                <AttendanceHeatmap logs={allLogs} user={user} cycleNumber={cycleNumber} />
              </div>
            </div>
          )}

          {tab === 'trend' && (
            <div className="rounded-2xl bg-ink-800 border border-slate-700 p-4 space-y-3">
              <select
                value={trendId}
                onChange={(e) => setTrendId(e.target.value)}
                className="w-full bg-ink-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              >
                {trendOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.variants?.newGym?.name || p.order}
                  </option>
                ))}
              </select>
              <div className="text-xs text-slate-400">e1RM 折线 + 单次总吨位柱（容量 = 重量 × 次数）</div>
              <TrendChart series={trend} />
              {trend.length > 0 && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-ink-900 rounded-lg py-2">
                    <div className="text-[10px] text-slate-400">最新 e1RM</div>
                    <div className="text-emerald-400 font-bold">{trend[trend.length - 1].e1rm}kg</div>
                  </div>
                  <div className="bg-ink-900 rounded-lg py-2">
                    <div className="text-[10px] text-slate-400">最新容量</div>
                    <div className="text-sky-400 font-bold">{trend[trend.length - 1].volume}</div>
                  </div>
                  <div className="bg-ink-900 rounded-lg py-2">
                    <div className="text-[10px] text-slate-400">记录次数</div>
                    <div className="text-white font-bold">{trend.length}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={filters.keyword}
                  onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
                  placeholder="动作/器械关键词"
                  className="bg-ink-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
                <select
                  value={filters.day}
                  onChange={(e) => setFilters((f) => ({ ...f, day: e.target.value }))}
                  className="bg-ink-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="">全部 Day</option>
                  {DAY_META.map((d) => (
                    <option key={d.day} value={d.day}>
                      Day {d.day} {d.emoji}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={filters.start}
                  onChange={(e) => setFilters((f) => ({ ...f, start: e.target.value }))}
                  className="bg-ink-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
                <input
                  type="date"
                  value={filters.end}
                  onChange={(e) => setFilters((f) => ({ ...f, end: e.target.value }))}
                  className="bg-ink-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilters((f) => ({ ...f, tag: '' }))}
                  className={`px-2 py-1 rounded-full text-[10px] ${!filters.tag ? 'bg-indigo-600 text-white' : 'bg-ink-700 text-slate-400'}`}
                >
                  全部标签
                </button>
                {QUICK_TAGS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilters((f) => ({ ...f, tag: f.tag === t ? '' : t }))}
                    className={`px-2 py-1 rounded-full text-[10px] ${
                      filters.tag === t ? 'bg-indigo-600 text-white' : 'bg-ink-700 text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {filtered.length === 0 && (
                  <p className="text-slate-400 text-xs py-6 text-center">没有匹配的记录</p>
                )}
                {filtered.map((log, i) => (
                  <div key={i} className="rounded-2xl bg-ink-800 border border-slate-700 p-3">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold text-white">
                        {log.date} · Day {log.day}
                      </span>
                      <span className="text-slate-500">#{log.cycleNumber}</span>
                    </div>
                    <div className="space-y-1">
                      {log.exercises?.map((ex, j) => (
                        <div key={j} className="flex justify-between text-[11px] text-slate-300">
                          <span className="truncate flex-1">
                            {nameOf(ex.exerciseId)}
                            {(ex.quickTags || []).map((t, k) => (
                              <span key={k} className={`ml-1 px-1 rounded ${TAG_COLORS[k % 2]}`}>
                                {t}
                              </span>
                            ))}
                          </span>
                          <span className="text-slate-400 shrink-0 ml-2">
                            {ex.sets?.filter((s) => s.completed).length || 0} 组
                            {ex.details?.avgHr ? ` · ${ex.details.avgHr}bpm` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
