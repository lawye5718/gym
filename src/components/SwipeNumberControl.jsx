import { useRef } from 'react'
import { vibrate } from '../utils/soundAndWakeLock'

/**
 * V2.5 阻尼手势数值滑块
 * 手势约定（与文档一致）：
 *   左滑 (⬅️, deltaX < 0) = 增加 (+)
 *   右滑 (➡️, deltaX > 0) = 减少 (-)
 */
export default function SwipeNumberControl({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  decimals = 0,
  unit = '',
  theme,
  className = '',
}) {
  const startX = useRef(null)

  const clamp = (v) => {
    const next = Math.min(max, Math.max(min, v))
    return decimals ? Number(next.toFixed(decimals)) : Math.round(next)
  }

  const commit = (delta) => {
    const current = Number(value) || 0
    const next = clamp(current + delta)
    if (next !== current) {
      onChange(next)
      vibrate(12)
    }
  }

  // 阻止冒泡：避免滑动调数值时误触发父级卡片的翻牌手势
  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    e.stopPropagation()
  }

  const handleTouchEnd = (e) => {
    e.stopPropagation()
    if (startX.current == null) return
    const dx = e.changedTouches[0].clientX - startX.current
    startX.current = null
    if (Math.abs(dx) < 30) return
    // 左滑 dx < 0 → 增加；右滑 dx > 0 → 减少
    commit(dx < 0 ? step : -step)
  }

  const display = decimals ? (Number(value) || 0).toFixed(decimals) : Math.round(Number(value) || 0)

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`flex items-center justify-between gap-1 rounded-lg border px-0.5 ${
        theme?.repSliderBg || 'bg-slate-800 border-slate-600'
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => commit(-step)}
        className="px-1.5 py-1 text-slate-400 active:scale-95"
        aria-label="减少"
      >
        −
      </button>
      <span className="flex-1 text-center font-bold text-sm tabular-nums">
        {display}
        {unit && <span className="text-[10px] opacity-60 ml-0.5">{unit}</span>}
      </span>
      <button
        type="button"
        onClick={() => commit(step)}
        className="px-1.5 py-1 text-slate-400 active:scale-95"
        aria-label="增加"
      >
        ＋
      </button>
    </div>
  )
}
