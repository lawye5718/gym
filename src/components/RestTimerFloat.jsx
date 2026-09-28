import { useEffect, useRef, useState } from 'react'
import { Hourglass, Plus, SkipForward, X } from 'lucide-react'

/** 每完成一组自动弹出的休战沙漏 */
export default function RestTimerFloat({ timer, onClose, onExtend, onSkip }) {
  const [left, setLeft] = useState(timer.total)
  const endAt = useRef(Date.now() + timer.total * 1000)

  useEffect(() => {
    endAt.current = Date.now() + timer.total * 1000
    setLeft(timer.total)
    const id = setInterval(() => {
      const remain = Math.max(0, Math.round((endAt.current - Date.now()) / 1000))
      setLeft(remain)
      if (remain === 0) {
        clearInterval(id)
        try {
          navigator.vibrate?.([200, 100, 200])
        } catch {}
      }
    }, 250)
    return () => clearInterval(id)
  }, [timer.startedAt, timer.total])

  const pct = Math.max(0, Math.min(100, (left / timer.total) * 100))
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')

  return (
    <div className="fixed left-3 right-3 bottom-3 z-40 safe-bottom">
      <div className="bg-ink-800/95 backdrop-blur border border-slate-700 rounded-2xl p-3 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Hourglass size={16} className="text-amber-400 shrink-0" />
            <span className="text-xs text-slate-300 truncate">休战沙漏 · {timer.label}</span>
          </div>
          <button onClick={onClose} className="text-slate-500 p-1">
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-3xl font-extrabold tabular-nums text-white tracking-tight">
            {mm}:{ss}
          </div>
          <div className="flex-1">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  left <= 10 ? 'bg-rose-500' : 'bg-amber-400'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={onExtend}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-700 active:bg-slate-600 text-xs font-semibold text-slate-100"
              >
                <Plus size={14} /> 30s
              </button>
              <button
                onClick={onSkip}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-emerald-600 active:bg-emerald-500 text-xs font-bold text-white"
              >
                <SkipForward size={14} /> 跳过
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
