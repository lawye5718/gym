import { useRef, useState } from 'react'
import { Minus, Plus, X } from 'lucide-react'

/**
 * V2.5 闪出式动作要领卡
 * - 双指捏合缩放 + 顶部 +/- 按钮缩放（100% ~ 250%）
 * - 单指任意方向滑动 → 顺着轨迹飞走关闭
 */
export default function ActionCueFlashCard({ exercise, venueMode, theme, onClose }) {
  const [scale, setScale] = useState(1)
  const [flyStyle, setFlyStyle] = useState(null)

  const pinchRef = useRef(null)
  const swipeRef = useRef(null)

  const { tempoGuide, media, prescription } = exercise
  const variant = exercise.variants?.[venueMode] || exercise.variants?.newGym
  const [minReps, maxReps] = prescription.repRange

  const zoom = (delta) => setScale((s) => Math.min(2.5, Math.max(1, Number((s + delta).toFixed(2)))))

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchRef.current = Math.hypot(dx, dy)
      swipeRef.current = null
    } else if (e.touches.length === 1) {
      swipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      pinchRef.current = null
    }
  }

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      if (pinchRef.current > 0) {
        const ratio = dist / pinchRef.current
        setScale((s) => Math.min(2.5, Math.max(1, s * ratio)))
      }
      pinchRef.current = dist
    }
  }

  const handleTouchEnd = (e) => {
    // 单指滑动飞走
    if (swipeRef.current && e.changedTouches?.length) {
      const dx = e.changedTouches[0].clientX - swipeRef.current.x
      const dy = e.changedTouches[0].clientY - swipeRef.current.y
      if (Math.hypot(dx, dy) > 60) {
        setFlyStyle({
          transform: `translate(${dx}px, ${dy}px) rotate(${dx > 0 ? 18 : -18}deg)`,
          opacity: 0,
        })
        setTimeout(() => onClose?.(), 180)
      }
    }
    swipeRef.current = null
    pinchRef.current = null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={flyStyle ? { ...flyStyle, transition: 'all 180ms ease-out' } : undefined}
        className={`w-full max-w-md max-h-full flex flex-col rounded-3xl border overflow-hidden ${theme.cardBg}`}
      >
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/10">
          <button
            type="button"
            onClick={() => zoom(-0.25)}
            className="w-7 h-7 rounded-lg bg-black/40 flex items-center justify-center"
            aria-label="缩小"
          >
            <Minus size={14} />
          </button>
          <span className="text-[11px] font-bold tabular-nums">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={() => zoom(0.25)}
            className="w-7 h-7 rounded-lg bg-black/40 flex items-center justify-center"
            aria-label="放大"
          >
            <Plus size={14} />
          </button>
          <div className="flex-1 truncate text-right text-[11px] font-bold opacity-80">滑动飞走关闭</div>
          <button type="button" onClick={onClose} className="opacity-70">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-3">
          <div
            style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
            className="transition-transform duration-150"
          >
            <div className="text-[15px] font-extrabold leading-snug">{variant?.name}</div>
            <div className="text-[11px] opacity-70 mt-0.5">
              {variant?.machineCode} · {prescription.sets} 组 × {minReps}–{maxReps} 次
            </div>

            {/* 器械图解占位（V2 实拍上线后自动显示） */}
            <div className="mt-2.5 aspect-[4/3] rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-[11px] opacity-60">
              {media?.machinePhotoUrl ? (
                <img
                  src={media.machinePhotoUrl}
                  alt=""
                  className="w-full h-full object-contain rounded-2xl"
                />
              ) : (
                '器械实拍图解（上传后自动显示）'
              )}
            </div>

            {/* 四段式节奏要领 */}
            <div className="mt-2.5 space-y-2">
              <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-2">
                <div className="text-[12px] font-bold text-rose-300">
                  🔥 向心 {tempoGuide.concentric.time}
                </div>
                <p className="text-[11px] mt-0.5 leading-snug">{tempoGuide.concentric.cue}</p>
              </div>
              <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-2">
                <div className="text-[12px] font-bold text-sky-300">
                  ❄️ 离心 {tempoGuide.eccentric.time}
                </div>
                <p className="text-[11px] mt-0.5 leading-snug">{tempoGuide.eccentric.cue}</p>
              </div>
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-2">
                <div className="text-[12px] font-bold text-amber-300">
                  ⏱️ 底部停顿 {tempoGuide.bottomPause.time}
                </div>
                <p className="text-[11px] mt-0.5 leading-snug">{tempoGuide.bottomPause.cue}</p>
              </div>
              {tempoGuide.overloadCue && (
                <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-2">
                  <div className="text-[12px] font-bold text-indigo-300">💡 超负荷要点</div>
                  <p className="text-[11px] mt-0.5 leading-snug">{tempoGuide.overloadCue}</p>
                </div>
              )}
            </div>

            {/* 关键要点 */}
            {(media?.keyPointsOverlay || []).length > 0 && (
              <div className="mt-2.5 space-y-1">
                {media.keyPointsOverlay.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span className="w-4 h-4 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-[9px]">
                      {i + 1}
                    </span>
                    {pt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
