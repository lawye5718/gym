import { AlertOctagon } from 'lucide-react'
import { V6_RECOVERY_ITEMS, V6_RECOVERY_NOTE } from '../data/v6-workout-data'

/**
 * 红灯模式专用：防衰主动恢复卡（替换主课表）
 */
export default function V6RecoveryCard({ theme, record, onToggle, onSave, saved }) {
  const rec = record || {}

  return (
    <div className={`w-full h-full rounded-3xl border-2 p-4 flex flex-col justify-between select-none ${theme.cardBg}`}>
      <div className="min-h-0 overflow-y-auto no-scrollbar space-y-2.5">
        <div className="flex items-center gap-2 text-rose-300">
          <AlertOctagon size={18} />
          <h2 className="text-sm font-black">红灯保护机制已生效 · 今日转为主动恢复</h2>
        </div>

        <p className="text-[11px] opacity-80 leading-relaxed">{V6_RECOVERY_NOTE}</p>

        {saved && (
          <div className={`rounded-2xl border p-2 text-[11px] ${theme.subCardBg}`}>
            ✅ 今日主动恢复日志已记录
            {saved.savedAt ? ` · ${saved.savedAt}` : ''}
          </div>
        )}

        {V6_RECOVERY_ITEMS.map((it) => (
          <button
            key={it.key}
            type="button"
            onClick={() => onToggle(it.key)}
            className={`w-full p-2.5 rounded-2xl border flex items-center justify-between gap-2 text-left transition ${
              rec[it.key] ? 'bg-emerald-500/15 border-emerald-400/40' : theme.subCardBg
            }`}
          >
            <div className="min-w-0">
              <div className="text-[12px] font-bold">{it.title}</div>
              <div className="text-[10px] opacity-70 leading-snug">{it.detail}</div>
            </div>
            <span
              className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center text-[11px] font-black ${
                rec[it.key] ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-white/40'
              }`}
            >
              ✓
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onSave}
        className="mt-3 w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm active:scale-[0.99] transition"
      >
        打卡保存今日主动恢复日志
      </button>
    </div>
  )
}
