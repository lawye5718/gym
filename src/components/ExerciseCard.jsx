import { useEffect, useRef, useState } from 'react'
import { Check, Ruler, Settings } from 'lucide-react'
import SwipeNumberControl from './SwipeNumberControl'
import GiantRestBar from './GiantRestBar'
import AttachedSettingsCard from './AttachedSettingsCard'
import ActionCueFlashCard from './ActionCueFlashCard'
import { calculatePlatesPerSide } from '../utils/overloadEngine'
import { playTripleChime, releaseWakeLock, requestWakeLock, vibrate } from '../utils/soundAndWakeLock'

const QUICK_TAGS = [
  '⚡1.5s减速停(RIR2)',
  '🛑底部停1秒极稳',
  '🔥末组双起单下',
  '🧤死手模式零抓握',
  '⚠️关节微紧',
]

/**
 * V2.5 单屏动作分组状态主卡
 * 集成：正交手势(↕翻牌 / ↔调次数)、⚙️设置翻转、📐要领闪出、底部巨型休息大键
 */
export default function ExerciseCard({
  exercise,
  venueMode,
  smartData,
  customConfig,
  seatMemory,
  theme,
  cardIndex,
  totalExerciseCards,
  onSaveSeatMemory,
  onSaveCustomConfig,
  onResetToACSMPlan,
  onUpdateSetData,
  onFlipCard,
}) {
  const variant = exercise.variants?.[venueMode] || exercise.variants?.newGym
  const { prescription, tempoGuide } = exercise
  const [minReps, maxReps] = prescription.repRange
  const restSeconds = customConfig?.restSeconds || prescription.restSeconds

  const [sets, setSets] = useState(smartData?.prefillSets || [])
  const [selectedTags, setSelectedTags] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [showCue, setShowCue] = useState(false)
  const [activeSetIdx, setActiveSetIdx] = useState(0)

  const [resting, setResting] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const [restTotal, setRestTotal] = useState(0)

  // 设置卡更新 / 切换动作后，重新带入预填数据
  useEffect(() => {
    setSets(smartData?.prefillSets || [])
    setActiveSetIdx(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customConfig?.updatedAt, exercise.id])

  // 组间休息倒计时：结束响铃 + 震动；保持 4 秒「已完成」高亮后复位
  useEffect(() => {
    if (!resting) return
    if (remaining <= 0) {
      playTripleChime()
      vibrate([80, 60, 80, 60, 140])
      releaseWakeLock()
      const t = setTimeout(() => setResting(false), 4000)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resting, remaining])

  const startRest = (sec) => {
    setRestTotal(sec)
    setRemaining(sec)
    setResting(true)
    requestWakeLock()
  }

  const skipRest = () => {
    setResting(false)
    setRemaining(0)
    releaseWakeLock()
  }

  const commit = (nextSets, tags = selectedTags) => {
    setSets(nextSets)
    onUpdateSetData?.(exercise.id, nextSets, tags)
  }

  const handleFieldChange = (idx, field, val) => {
    const next = sets.map((s, i) => (i === idx ? { ...s, [field]: Number(val) } : s))
    commit(next)
  }

  const toggleSetDone = (idx) => {
    const wasCompleted = sets[idx]?.completed
    const next = sets.map((s, i) => (i === idx ? { ...s, completed: !s.completed } : s))
    commit(next)
    if (!wasCompleted) {
      setActiveSetIdx(Math.min(idx + 1, sets.length - 1))
      startRest(restSeconds)
    }
  }

  const toggleTag = (tag) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]
    setSelectedTags(next)
    onUpdateSetData?.(exercise.id, sets, next)
  }

  /** 按新重量算：当前组及后续组升重，次数重置为起步下限 */
  const applyUpgrade = () => {
    const banner = smartData?.overloadBanner
    if (!banner?.recommendedWeight) return
    const next = sets.map((s, i) =>
      i >= activeSetIdx
        ? { ...s, weight: banner.recommendedWeight, reps: banner.resetReps ?? minReps }
        : s
    )
    commit(next)
    vibrate([30])
  }

  // 卡片正交手势：↕ 翻牌 / ↔ 调当前组次数（左滑+ 右滑-）
  const touchRef = useRef({ x: 0, y: 0 })
  const inListRef = useRef(false)

  const handleTouchStart = (e) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.x
    const dy = e.changedTouches[0].clientY - touchRef.current.y
    const insideList = inListRef.current
    inListRef.current = false
    if (insideList) return // 列表内优先滚动
    if (Math.abs(dy) > 45 && Math.abs(dy) > Math.abs(dx) * 1.2) {
      onFlipCard?.(dy < 0 ? 'next' : 'prev')
    } else if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const delta = dx < 0 ? 1 : -1
      const cur = sets[activeSetIdx]
      if (cur) handleFieldChange(activeSetIdx, 'reps', Math.max(1, Number(cur.reps) + delta))
    }
  }

  const banner = smartData?.overloadBanner

  // ── 设置背卡 ──
  if (showSettings) {
    return (
      <div className="h-full min-h-0" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <AttachedSettingsCard
          exercise={exercise}
          venueMode={venueMode}
          customConfig={customConfig}
          theme={theme}
          onSave={(cfg) => {
            onSaveCustomConfig?.(exercise.id, venueMode, cfg)
            if (cfg.seatNote) onSaveSeatMemory?.(exercise.id, cfg.seatNote)
            setShowSettings(false)
          }}
          onReset={() => {
            onResetToACSMPlan?.(exercise.id, venueMode)
            setShowSettings(false)
          }}
          onBack={() => setShowSettings(false)}
        />
      </div>
    )
  }

  // ── 主卡 ──
  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`flex flex-col h-full min-h-0 rounded-3xl border ${theme.cardBg}`}
    >
      {/* 头部 + 手势提示 + 升级横幅 */}
      <div className="shrink-0 px-3 pt-2.5 pb-1.5">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${theme.accentBadge}`}
              >
                {exercise.order}
              </span>
              <span className="text-[10px] opacity-70 truncate">{variant?.machineCode}</span>
            </div>
            <h3 className="text-[15px] font-extrabold mt-1 leading-snug">{variant?.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] opacity-80 flex-wrap">
              <span>
                {prescription.sets} 组 × {minReps}–{maxReps} 次
              </span>
              <span>·</span>
              <span>RIR {prescription.targetRIR}</span>
              <span>·</span>
              <span>⏱️ 休 {restSeconds}s</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center ${theme.subCardBg}`}
              title="器械设置"
            >
              <Settings size={15} />
            </button>
            <button
              type="button"
              onClick={() => setShowCue(true)}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center ${theme.subCardBg}`}
              title="动作要领"
            >
              <Ruler size={15} />
            </button>
          </div>
        </div>

        {/* 节奏摘要（点击闪出要领卡） */}
        <button
          type="button"
          onClick={() => setShowCue(true)}
          className={`mt-2 w-full text-left rounded-xl border px-2.5 py-1.5 text-[10px] leading-snug ${theme.subCardBg}`}
        >
          <span className="font-bold">📐 节奏：</span>
          向心 {tempoGuide.concentric.time} · 离心 {tempoGuide.eccentric.time} · 底部停{' '}
          {tempoGuide.bottomPause.time}
        </button>

        <div className="mt-1 flex items-center justify-between text-[10px] opacity-60">
          <span>
            动作 {cardIndex + 1} / {totalExerciseCards}
          </span>
          <span>↕滑翻牌 · ↔滑调次数</span>
        </div>

        {banner && (
          <div
            className={`mt-1.5 rounded-xl border px-2.5 py-2 text-[11px] ${
              banner.level === 'gold'
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                : banner.level === 'emerald'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                : 'bg-sky-500/15 border-sky-500/40 text-sky-200'
            }`}
          >
            <div className="font-bold text-[12px]">{banner.title}</div>
            <div className="opacity-90 leading-snug mt-0.5">{banner.message}</div>
            {banner.recommendedWeight && (
              <button
                type="button"
                onClick={applyUpgrade}
                className={`mt-1.5 px-2 py-1 rounded-lg text-[11px] font-bold bg-gradient-to-r ${theme.accentPrimary}`}
              >
                按新重量算（{banner.recommendedWeight}kg · {banner.resetReps ?? minReps} 次）
              </button>
            )}
          </div>
        )}
      </div>

      {/* 各组打卡（可滚动） */}
      <div
        onTouchStart={() => {
          inListRef.current = true
        }}
        className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 space-y-1.5"
      >
        {sets.map((s, idx) => {
          const isActive = idx === activeSetIdx
          return (
            <div
              key={s.setNo ?? idx}
              onClick={() => setActiveSetIdx(idx)}
              className={`flex items-center gap-1.5 rounded-xl border px-1.5 py-1.5 transition ${
                s.completed
                  ? theme.doneRowBg
                  : isActive
                  ? theme.repSliderBg
                  : 'border-transparent'
              }`}
            >
              <span className="w-5 text-center text-[11px] font-bold opacity-80">
                {s.setNo ?? idx + 1}
              </span>

              <SwipeNumberControl
                value={s.weight}
                onChange={(v) => handleFieldChange(idx, 'weight', v)}
                step={variant?.isPlateLoaded ? 2.5 : 1}
                min={0}
                max={300}
                decimals={1}
                unit="kg"
                theme={theme}
                className="flex-1"
              />

              <SwipeNumberControl
                value={s.reps}
                onChange={(v) => handleFieldChange(idx, 'reps', v)}
                step={1}
                min={1}
                max={60}
                unit="次"
                theme={theme}
                className="flex-1"
              />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleSetDone(idx)
                }}
                className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center font-bold transition ${
                  s.completed
                    ? `bg-gradient-to-r ${theme.doneBtn}`
                    : 'bg-black/30 border border-white/10'
                }`}
              >
                <Check size={15} strokeWidth={3} />
              </button>
            </div>
          )
        })}

        {variant?.isPlateLoaded && Number(sets[activeSetIdx]?.weight) > 0 && (
          <div className="text-[10px] opacity-70 text-center pb-0.5">
            单边约 {calculatePlatesPerSide(Number(sets[activeSetIdx].weight) / 2)}
          </div>
        )}
      </div>

      {/* 快捷标签 + 机位记忆 */}
      <div className="shrink-0 px-3 pt-1.5 flex gap-1.5 overflow-x-auto no-scrollbar">
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-medium border ${
              selectedTags.includes(tag) ? theme.accentBadge : 'opacity-60 border-white/10'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {seatMemory && (
        <div className="shrink-0 px-3 pt-1 text-[10px] opacity-70 truncate">💺 {seatMemory}</div>
      )}

      {/* 巨型休息大键 */}
      <div className="shrink-0 p-3 pt-2">
        <GiantRestBar
          resting={resting}
          remaining={remaining}
          total={restTotal}
          theme={theme}
          onStart={() => startRest(restSeconds)}
          onSkip={skipRest}
          label={`👆 完成第 ${activeSetIdx + 1} 组并开始休息 ${restSeconds}s`}
        />
      </div>

      {/* 动作要领闪卡 */}
      {showCue && (
        <ActionCueFlashCard
          exercise={exercise}
          venueMode={venueMode}
          theme={theme}
          onClose={() => setShowCue(false)}
        />
      )}
    </div>
  )
}
