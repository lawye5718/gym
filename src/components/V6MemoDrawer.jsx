import { X } from 'lucide-react'
import { MEMO_CARDS, V6_NON_COMPRESSIBLE, V6_THRESHOLDS, V6_THRESHOLD_NOTE } from '../data/v6-workout-data'

const TAG_COLORS = {
  blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
}

/**
 * V6 滑动备忘智库（Memo Deck Carousel）
 * 底部抽屉 + 横向 Scroll-Snap 切卡，5 大分类卡片 + 双重阈值铁律附录
 */
export default function V6MemoDrawer({ open, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
      <div className="flex-1" onClick={onClose} />

      <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-4 max-w-2xl mx-auto w-full shadow-2xl flex flex-col max-h-[85vh] text-slate-100">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <h3 className="text-sm font-black text-white">V6 备忘智库 · 滑动浏览</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs bg-slate-800 text-slate-400 hover:text-white px-2.5 py-1 rounded-full border border-slate-700 flex items-center gap-1"
          >
            <X size={12} /> 关闭
          </button>
        </div>

        <p className="text-[10px] text-slate-400 mt-2 mb-2 shrink-0">
          👈 左右滑动卡片，可查阅器械等效替换、Linda 死手模式、骨密度阶梯与功能测试备忘
        </p>

        {/* 横向滑动容器 */}
        <div className="flex space-x-3 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory no-scrollbar flex-1">
          {MEMO_CARDS.map((memo) => (
            <div
              key={memo.id}
              className="min-w-[85%] sm:min-w-[70%] snap-center bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col shadow-lg"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TAG_COLORS[memo.color] || TAG_COLORS.blue}`}>
                  {memo.tag}
                </span>
                {memo.badge && <span className="text-[9px] text-rose-400 font-mono">{memo.badge}</span>}
              </div>

              <h4 className="text-[13px] font-black text-white mb-2">{memo.title}</h4>

              {memo.table ? (
                <div className="space-y-2 text-xs">
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse text-[10.5px]">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800">
                          <th className="py-1 pr-2">阶段</th>
                          <th className="py-1 pr-2">器械版</th>
                          <th className="py-1">自由等效版</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {memo.table.map((row, i) => (
                          <tr key={i}>
                            <td className="py-1 pr-2 text-indigo-400 whitespace-nowrap">{row.day}</td>
                            <td className="py-1 pr-2">{row.machine}</td>
                            <td className="py-1 text-emerald-300">{row.free}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2 space-y-1 text-[10.5px] text-slate-400 pt-2 border-t border-slate-800">
                    {memo.rules.map((r, i) => (
                      <p key={i} className="leading-snug">
                        • {r}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {memo.list.map((line, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-slate-900/70 border border-slate-800/60 leading-relaxed text-[10.5px] text-slate-300"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[9px] text-slate-500 text-right mt-2">V6 防衰规范卡 · 对应 2026.10 周期</div>
            </div>
          ))}

          {/* 附录：双重阈值铁律 */}
          <div className="min-w-[85%] sm:min-w-[70%] snap-center bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col shadow-lg">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-orange-500/20 text-orange-300 border-orange-500/30 self-start">
              双重阈值
            </span>
            <h4 className="text-[13px] font-black text-white mt-1.5 mb-2">加重双区间铁律（含回退保护）</h4>
            <div className="space-y-1.5">
              {V6_THRESHOLDS.map((t) => (
                <div key={t.category} className="p-2 rounded-xl bg-slate-900/70 border border-slate-800/60 text-[10.5px]">
                  <div className="font-bold text-amber-300">
                    {t.category} · {t.repRange}
                  </div>
                  <div className="text-slate-400 leading-snug mt-0.5">升级：{t.upgrade}</div>
                  <div className="text-rose-300/90 leading-snug">回退：{t.regress}</div>
                </div>
              ))}
              <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800/60 text-[10.5px]">
                <div className="font-bold text-purple-300 mb-1">四项不可压缩铁律</div>
                {V6_NON_COMPRESSIBLE.map((r, i) => (
                  <p key={i} className="text-slate-300 leading-snug">
                    {i + 1}. {r}
                  </p>
                ))}
              </div>
              <div className="text-[10px] text-slate-400 leading-snug pt-1 border-t border-slate-800">
                {V6_THRESHOLD_NOTE}
              </div>
            </div>
            <div className="text-[9px] text-slate-500 text-right mt-2">V6 防衰规范卡 · 对应 2026.10 周期</div>
          </div>
        </div>
      </div>
    </div>
  )
}
