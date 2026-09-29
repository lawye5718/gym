import { gymDeviceManager } from '../utils/soundAndWakeLock'

/**
 * V2.6 纯按钮高敏步进器
 * 已彻底移除左右滑动改数值逻辑（消除与卡片翻牌手势的误触冲突），
 * 保留大尺寸 − / ＋ 实体按钮，点击即增减并带微震动反馈。
 */
export default function SwipeNumberControl({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 300,
  unit = '',
  subLabel = '',
  theme,
  highlightColor = 'text-white',
}) {
  const clamp = (val) => {
    const rounded = Math.round(val / step) * step
    return Number(Math.max(min, Math.min(max, rounded)).toFixed(2))
  }

  const handleStep = (e, delta) => {
    e.stopPropagation()
    gymDeviceManager.playTick()
    onChange(clamp((Number(value) || 0) + delta))
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`relative select-none rounded-xl border px-1.5 py-1 flex flex-col items-center justify-center ${
        theme?.repSliderBg || ''
      }`}
    >
      <div className="flex items-center justify-between w-full gap-1.5">
        <button
          type="button"
          onClick={(e) => handleStep(e, -step)}
          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-sm font-black transition"
          aria-label="减少"
        >
          −
        </button>

        <div className="flex items-baseline justify-center min-w-[2.8rem] text-center">
          <span className={`font-black text-base leading-none tracking-tight ${highlightColor}`}>
            {value}
          </span>
          {unit && <span className="text-[10px] font-medium ml-0.5 opacity-75">{unit}</span>}
        </div>

        <button
          type="button"
          onClick={(e) => handleStep(e, step)}
          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-sm font-black transition"
          aria-label="增加"
        >
          ＋
        </button>
      </div>

      {subLabel && (
        <div className="text-[9px] text-amber-300/90 font-medium truncate max-w-[7.5rem] mt-0.5">
          {subLabel}
        </div>
      )}
    </div>
  )
}
