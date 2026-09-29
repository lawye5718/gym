import { useRef } from 'react'
import { vibrate } from '../utils/soundAndWakeLock'

/**
 * V2.5 卡片底部「巨型横条大键」（替代 RestTimerFloat）
 * - 点击：打卡当前组并启动读秒（进度条）
 * - 结束：大键变色呼吸闪烁（由父级触发提示音与震动）
 * - 左右滑动：取消 / 跳过休息，直接进入下一组
 */
export default function GiantRestBar({
  resting,
  remaining,
  total,
  theme,
  onStart,
  onSkip,
  label,
}) {
  const startX = useRef(null)

  const pct = total > 0 ? Math.max(0, Math.min(100, ((total - remaining) / total) * 100)) : 0
  const done = resting && remaining <= 0

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    e.stopPropagation()
  }

  const handleTouchEnd = (e) => {
    const sx = startX.current
    startX.current = null
    e.stopPropagation()
    if (sx == null) return
    const dx = e.changedTouches[0].clientX - sx
    if (Math.abs(dx) > 45) {
      vibrate(20)
      onSkip?.()
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (!resting) onStart?.()
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full shrink-0 overflow-hidden rounded-2xl border py-3 px-3 text-center font-extrabold transition-all active:scale-[0.99] ${
        done
          ? 'bg-emerald-500 text-slate-950 border-emerald-300 animate-pulse'
          : resting
          ? `bg-gradient-to-r ${theme.accentPrimary}`
          : `bg-gradient-to-r ${theme.doneBtn}`
      }`}
    >
      {/* 倒计时进度填充 */}
      {resting && (
        <span
          className="absolute inset-y-0 left-0 bg-white/25 transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      )}
      <span className="relative block text-[13px] leading-tight">
        {done
          ? '✅ 休息结束 · 开练下一组'
          : resting
          ? `⏳ 休息中 ${remaining}s · 左右滑可跳过`
          : label || '👆 点击打卡并开始休息'}
      </span>
    </button>
  )
}
