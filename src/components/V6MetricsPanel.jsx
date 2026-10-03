import { Activity } from 'lucide-react'
import { V6_METRIC_RULES } from '../data/v6-workout-data'

/**
 * V6 功能性防衰指标追踪（握力年度 / 单腿睁眼站立季度）
 */
export default function V6MetricsPanel({ theme, metrics, currentUser, onChange }) {
  const m = metrics || {}
  const gripWarn = V6_METRIC_RULES.grip.warnBelow[currentUser] ?? 26

  const gripVal = Number(m.grip) || 0
  const balVal = Number(m.balanceSec) || 0

  return (
    <div className={`rounded-2xl border p-2.5 ${theme.subCardBg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black flex items-center gap-1">
          <Activity size={12} /> 功能性防衰指标追踪 (V6)
        </span>
        <span className="text-[9px] opacity-60">定期测试 · 评估肌力与神经衰退</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="bg-black/25 rounded-xl border border-white/10 px-2 py-1.5 flex items-center justify-between gap-1">
          <span className="min-w-0">
            <span className="block text-[9px] opacity-60">{V6_METRIC_RULES.grip.label}</span>
            <span className={`text-[9px] ${gripVal > 0 && gripVal < gripWarn ? 'text-rose-300' : 'opacity-60'}`}>
              {V6_METRIC_RULES.grip.hint}
            </span>
          </span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="kg"
            value={m.grip ?? ''}
            onChange={(e) => onChange('grip', e.target.value)}
            className={`w-14 bg-transparent text-right text-xs font-mono outline-none ${
              gripVal > 0 && gripVal < gripWarn ? 'text-rose-300' : 'text-emerald-400'
            }`}
          />
        </label>

        <label className="bg-black/25 rounded-xl border border-white/10 px-2 py-1.5 flex items-center justify-between gap-1">
          <span className="min-w-0">
            <span className="block text-[9px] opacity-60">{V6_METRIC_RULES.balanceSec.label}</span>
            <span className={`text-[9px] ${balVal > 0 && balVal < V6_METRIC_RULES.balanceSec.target ? 'text-amber-300' : 'opacity-60'}`}>
              {V6_METRIC_RULES.balanceSec.hint}
            </span>
          </span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="秒"
            value={m.balanceSec ?? ''}
            onChange={(e) => onChange('balanceSec', e.target.value)}
            className={`w-12 bg-transparent text-right text-xs font-mono outline-none ${
              balVal > 0 && balVal < V6_METRIC_RULES.balanceSec.target ? 'text-amber-300' : 'text-indigo-400'
            }`}
          />
        </label>
      </div>
    </div>
  )
}
