import { useMemo, useState } from 'react'
import { Dumbbell, History, TrendingUp, X } from 'lucide-react'
import { DAY_META } from '../data/seedPlanData'
import {
  buildTrendSeries,
  calculateACSMCycleVolume,
  queryWorkoutLogs,
} from '../utils/storageSync'

const QUICK_TAGS = [
  '⚡1.5s减速停(RIR2)',
  '🛑底部停1秒极稳',
  '🔥末组双起单下',
  '🧤死手模式零抓握',
  '⚠️关节微紧',
]

function nameOf(exerciseId, allPlanItems) {
  const p = (allPlanItems || []).find((x) => x.id === exerciseId)
  if (!p) return exerciseId
  return p.variants?.newGym?.name || p.order || exerciseId
}

/** 有氧 / 静息打卡徽章卡（历史战报） */
function CardioBadge({ cardio, theme }) {
  if (!cardio?.completed) return null
  const isZone2 = cardio.type === 'zone2'
  const isHiit = cardio.type === 'hiit_4x4'
  const icon = isZone2 ? '🫀' : isHiit ? '🔥' : '😴'
  const title = isZone2 ? 'Zone 2 洗刷日' : isHiit ? '4×4 HIIT 绞肉机' : '静息恢复日'
  const detail = isZone2
    ? `${cardio.durationMinutes} 分钟 · 平均 ${cardio.avgHeartRate} bpm`
    : isHiit
      ? `${cardio.roundsCompleted} 轮 · 峰值 ${cardio.peakHeartRate} / 恢复 ${cardio.recoveryHeartRate} bpm`
      : cardio.cnsStatus || '中枢神经与肌糖原恢复'
  const ring = isZone2
    ? 'border-sky-400/40 bg-sky-500/10'
    : isHiit
      ? 'border-rose-400/40 bg-rose-500/10'
      : 'border-emerald-400/40 bg-emerald-500/10'

  return (
    <div className={`mt-1.5 rounded-xl border p-2 ${ring}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold">
        <span>{icon}</span>
        <span>{title}</span>
        <span className="ml-auto opacity-60 text-[10px]">
          ✅ 已打卡{cardio.savedAt ? ` · ${cardio.savedAt}` : ''}
        </span>
      </div>
      <div className="text-[10px] opacity-80 mt-0.5">{detail}</div>
      {cardio.advanceCycle && (
        <div className="text-[10px] text-amber-300 mt-0.5">🎉 已开启下一轮微循环</div>
      )}
      {(cardio.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {cardio.tags.map((t, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded-full bg-black/30 text-[10px]">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** 轻量内联 SVG 趋势图（e1RM 折线 + 容量柱） */
function TrendChart({ series, theme }) {
  if (!series || series.length < 2) {
    return <p className="text-[11px] opacity-60 py-6 text-center">至少两次记录才能画出趋势线</p>
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
  const accent = theme?.accentText?.includes('amber') ? 'fill-amber-500/40' : 'fill-cyan-500/40'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {vol.map((v, i) => (
        <rect
          key={i}
          x={xAt(i) - 7}
          y={yVol(v)}
          width={14}
          height={H - pad - yVol(v)}
          className={accent}
          rx={2}
        />
      ))}
      <polyline points={line} fill="none" className="stroke-emerald-400" strokeWidth={2.5} />
      {series.map((s, i) => (
        <text key={i} x={xAt(i)} y={H - 4} fontSize={8} textAnchor="middle" className="opacity-50">
          {s.date.slice(5)}
        </text>
      ))}
    </svg>
  )
}

/** ACSM 肌群容量达标进度条 */
function VolumeBars({ groups }) {
  return (
    <div className="space-y-2.5">
      {groups.map((g) => {
        const pct = Math.min(100, Math.round((g.sets / g.target) * 100))
        const hit = g.sets >= g.target
        return (
          <div key={g.key}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="opacity-80">{g.label}</span>
              <span className={hit ? 'text-emerald-400 font-bold' : 'opacity-60'}>
                {g.sets}/{g.target} 组 {hit ? '✓' : ''}
              </span>
            </div>
            <div className="h-2.5 bg-black/40 rounded-full overflow-hidden">
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

/** 出勤热力图 */
function AttendanceHeatmap({ logs, user, cycleNumber }) {
  const done = new Set(
    logs.filter((l) => l.user === user && l.cycleNumber === cycleNumber).map((l) => l.day)
  )
  return (
    <div className="grid grid-cols-8 gap-1.5 mt-1">
      {DAY_META.map((d) => (
        <div
          key={d.day}
          className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold ${
            done.has(d.day) ? 'bg-emerald-500/70 text-slate-950' : 'bg-black/30 opacity-50'
          }`}
          title={`Day ${d.day}`}
        >
          {d.day}
        </div>
      ))}
    </div>
  )
}

/**
 * V2.5 全卡片化统计分析与历史检索抽屉
 */
export default function AnalyticsModal({
  logs,
  allPlanItems,
  currentUser,
  cycleNumber,
  theme,
  onClose,
}) {
  const [tab, setTab] = useState('volume')
  const [keyword, setKeyword] = useState('')
  const [trendId, setTrendId] = useState('')

  const groups = useMemo(
    () => calculateACSMCycleVolume(logs || [], allPlanItems || [], currentUser, cycleNumber),
    [logs, allPlanItems, currentUser, cycleNumber]
  )

  const trendOptions = useMemo(
    () =>
      (allPlanItems || []).filter(
        (p) =>
          p.user === currentUser && (p.category === 'compound' || p.category === 'isolation')
      ),
    [allPlanItems, currentUser]
  )

  const effectiveTrendId = trendId || trendOptions[0]?.id || ''
  const trend = useMemo(
    () => (effectiveTrendId ? buildTrendSeries(logs || [], currentUser, effectiveTrendId) : []),
    [logs, currentUser, effectiveTrendId]
  )

  const filtered = useMemo(
    () => queryWorkoutLogs(logs || [], { user: currentUser, keyword }),
    [logs, currentUser, keyword]
  )

  const TabBtn = ({ id, label, icon }) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-bold border transition ${
        tab === id ? `bg-gradient-to-r ${theme.accentPrimary}` : theme.subCardBg
      }`}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex flex-col" onClick={onClose}>
      <div
        className={`flex-1 mt-8 rounded-t-3xl border-t overflow-y-auto safe-bottom ${theme.cardBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2.5 border-b border-white/10 backdrop-blur">
          <h2 className="text-[13px] font-extrabold">
            📊 {currentUser === 'leo' ? 'Leo' : 'Linda'} 数据中心
          </h2>
          <button type="button" onClick={onClose} className="opacity-70 p-1">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1.5 p-3">
          <TabBtn id="volume" label="容量达标" icon={<Dumbbell size={13} />} />
          <TabBtn id="trend" label="力量趋势" icon={<TrendingUp size={13} />} />
          <TabBtn id="history" label="历史战报" icon={<History size={13} />} />
        </div>

        <div className="px-3 pb-8 space-y-3">
          {tab === 'volume' && (
            <>
              <div className={`rounded-2xl border p-3 ${theme.subCardBg}`}>
                <div className="text-[12px] font-bold mb-2.5">
                  微循环 #{cycleNumber} · 各肌群有效组数 vs ACSM 11–12 组
                </div>
                <VolumeBars groups={groups} />
              </div>
              <div className={`rounded-2xl border p-3 ${theme.subCardBg}`}>
                <div className="text-[11px] font-bold opacity-80 mb-1.5">
                  出勤热力图（本周期 Day 1–8）
                </div>
                <AttendanceHeatmap logs={logs || []} user={currentUser} cycleNumber={cycleNumber} />
              </div>
            </>
          )}

          {tab === 'trend' && (
            <div className={`rounded-2xl border p-3 space-y-2.5 ${theme.subCardBg}`}>
              <select
                value={effectiveTrendId}
                onChange={(e) => setTrendId(e.target.value)}
                className={`w-full rounded-xl border px-2.5 py-2 text-[12px] bg-black/30 ${theme.repSliderBg}`}
              >
                {trendOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.variants?.newGym?.name || p.order}
                  </option>
                ))}
              </select>
              <div className="text-[10px] opacity-60">
                e1RM 折线 + 单次总吨位柱（容量 = 重量 × 次数）
              </div>
              <TrendChart series={trend} theme={theme} />
              {trend.length > 0 && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-black/30 rounded-xl py-2">
                    <div className="text-[10px] opacity-60">最新 e1RM</div>
                    <div className="text-emerald-400 font-bold text-[13px]">
                      {trend[trend.length - 1].e1rm}kg
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-xl py-2">
                    <div className="text-[10px] opacity-60">最新容量</div>
                    <div className="text-sky-400 font-bold text-[13px]">
                      {trend[trend.length - 1].volume}
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-xl py-2">
                    <div className="text-[10px] opacity-60">记录次数</div>
                    <div className="font-bold text-[13px]">{trend.length}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-2.5">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="按动作 / 标签关键词检索"
                className={`w-full rounded-xl border px-2.5 py-2 text-[12px] bg-black/30 ${theme.repSliderBg}`}
              />
              {filtered.length === 0 && (
                <p className="text-[11px] opacity-60 py-6 text-center">没有匹配的记录</p>
              )}
              {filtered.map((log) => (
                <div key={log.logId || log.date} className={`rounded-2xl border p-2.5 ${theme.subCardBg}`}>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="font-bold">
                      {log.date} · Day {log.day}
                    </span>
                    <span className="opacity-60">#{log.cycleNumber}</span>
                  </div>
                  <div className="space-y-1">
                    {(log.exercises || []).map((ex, j) => (
                      <div key={j} className="flex justify-between text-[11px] gap-2">
                        <span className="truncate flex-1">
                          {nameOf(ex.exerciseId, allPlanItems)}
                          {(ex.quickTags || []).map((t, k) => (
                            <span
                              key={k}
                              className={`ml-1 px-1 rounded ${
                                QUICK_TAGS.includes(t)
                                  ? 'bg-indigo-500/20 text-indigo-200'
                                  : 'bg-emerald-500/20 text-emerald-200'
                              }`}
                            >
                              {t}
                            </span>
                          ))}
                        </span>
                        <span className="opacity-60 shrink-0">
                          {(ex.sets || []).filter((s) => s.completed).length} 组
                        </span>
                      </div>
                    ))}
                    {log.cardioSummary?.completed && (
                      <CardioBadge cardio={log.cardioSummary} theme={theme} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
