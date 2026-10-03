import { Target } from 'lucide-react'
import { getV6DayMeta } from '../data/v6-workout-data'

/**
 * V6 完整热身卡（12 分钟：7 分钟动态 + 首 5 分钟平衡与神经肌肉打卡）
 * 仅在力量日且 balanceMin > 0 时出现；属「不可压缩铁律」第 3 条。
 */
export default function WarmupBalanceCard({ currentDay, theme, checked, onToggle }) {
  const meta = getV6DayMeta(currentDay)
  const w = meta.warmup || {}
  if (!w.balanceMin || !w.balanceItems?.length) return null

  return (
    <div className={`rounded-2xl border p-2.5 ${theme.subCardBg}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Target size={14} className={theme.accentText} />
          <span className="text-[11px] font-black">完整热身（12 分钟）</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 shrink-0">
            后 5 分：平衡防跌倒
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
            checked ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' : 'opacity-60 border-white/10'
          }`}
        >
          {checked ? '✅ 完成热身' : '完成热身'}
        </button>
      </div>

      <ul className="mt-1.5 space-y-0.5">
        {w.balanceItems.map((b, i) => (
          <li key={i} className="text-[10px] opacity-80 flex items-start gap-1">
            <span className="opacity-50">•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
