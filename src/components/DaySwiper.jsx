import { ShieldPlus } from 'lucide-react'
import { DAY_META } from '../data/seedPlanData'

/** Day 1–8 进度胶囊导航 + 弹性 +1 静息日按钮 */
export default function DaySwiper({ currentDay, setCurrentDay, restInserted, onToggleRest }) {
  return (
    <div className="bg-ink-900/95 border-b border-slate-800">
      <div className="px-3 py-2.5">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {DAY_META.map((m) => {
            const active = currentDay === m.day
            return (
              <button
                key={m.day}
                onClick={() => setCurrentDay(m.day)}
                className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                  active
                    ? 'bg-slate-100 text-ink-900 border-slate-100'
                    : 'bg-ink-700 text-slate-400 border-slate-700'
                }`}
                title={`${m.title} · ${m.sub}`}
              >
                <span className="mr-1">{m.emoji}</span>D{m.day}
              </button>
            )
          })}
        </div>

        {/* Day 5 与 Day 6 之间的弹性阀 */}
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={onToggleRest}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition ${
              restInserted
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40'
                : 'bg-ink-700 text-slate-400 border-slate-700'
            }`}
          >
            <ShieldPlus size={13} />
            {restInserted ? '已插入 +1 弹性静息日 ✓' : '🛡️ 插入 +1 弹性静息日'}
          </button>
          <span className="text-[10px] text-slate-500 leading-tight flex-1">
            {restInserted ? '本周期顺延为 9 天' : 'Day5 后腿沉/睡差可插入'}
          </span>
        </div>
      </div>
    </div>
  )
}
