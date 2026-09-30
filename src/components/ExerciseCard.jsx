import { useEffect, useState } from 'react'
import { BookOpen, Settings2, Tag } from 'lucide-react'
import SwipeNumberControl from './SwipeNumberControl'
import GiantRestBar from './GiantRestBar'
import AttachedSettingsCard from './AttachedSettingsCard'
import ActionCueFlashCard from './ActionCueFlashCard'
import { calculatePlatesPerSide } from '../utils/overloadEngine'

const QUICK_TAGS = [
  '⚡1.5s减速停(RIR2)',
  '🛑底部停1秒极稳',
  '🔥末组双起单下',
  '🧤死手模式零抓握',
]

/**
 * V2.8 紧凑型动作卡（手机下端减负版）
 * ① 体感标签收进顶部 [🏷️标签] 浮层，卡片下端 100% 留给 GiantRestBar
 * ② 单边挂片公式上提至器械副标题行，分组行高压缩（每行约 38px）
 * ③ 移除卡内 ⇄ 备选器械横条（不同重量动作已在数据层彻底拆卡）
 */
export default function ExerciseCard({
  exercise,
  venueMode,
  smartData,
  customConfig,
  seatMemory,
  theme,
  cardIndex,
  totalDeckCards,
  effectiveId,
  onSaveSeatMemory,
  onSaveCustomConfig,
  onResetToACSMPlan,
  onAckOverload,
  onUpdateSetData,
  onRestStateChange,
  onFlipCard,
}) {
  const [sets, setSets] = useState(smartData?.prefillSets || [])
  const [selectedTags, setSelectedTags] = useState([])
  const [showTagsPopover, setShowTagsPopover] = useState(false)
  const [cardFace, setCardFace] = useState('workout') // workout | settings
  const [showCueFlash, setShowCueFlash] = useState(false)
  const [restResetToken, setRestResetToken] = useState(0)

  const activeVariant = exercise.variants?.[venueMode] || exercise.variants?.newGym || {}
  const { prescription, tempoGuide } = exercise
  const [minReps, maxReps] = activeVariant.repRange || prescription.repRange || [8, 12]
  const effectiveRestSeconds = customConfig?.restSeconds || prescription.restSeconds || 120

  useEffect(() => {
    setSets(smartData?.prefillSets || [])
    setCardFace('workout')
    setShowTagsPopover(false)
  }, [smartData, exercise.id, venueMode])

  const commit = (nextSets, tags = selectedTags) => {
    setSets(nextSets)
    onUpdateSetData?.(effectiveId || exercise.id, nextSets, tags)
  }

  const firstIncompleteIdx = sets.findIndex((s) => !s.completed)
  const activeSetIdx =
    firstIncompleteIdx === -1 ? Math.max(0, sets.length - 1) : firstIncompleteIdx
  const allSetsCompleted = firstIncompleteIdx === -1 && sets.length > 0

  /** 改重量：同步应用到其后所有未完成的组 */
  const handleWeightChange = (idx, newWeight) => {
    const next = sets.map((s, i) => {
      if (i === idx) return { ...s, weight: newWeight }
      if (i > idx && !s.completed) return { ...s, weight: newWeight }
      return s
    })
    commit(next)
  }

  const handleRepsChange = (idx, newReps) => {
    const next = sets.map((s, i) => (i === idx ? { ...s, reps: Math.max(1, newReps) } : s))
    commit(next)
  }

  const toggleSetDone = (idx) => {
    const wasCompleted = sets[idx]?.completed
    const next = sets.map((s, i) => (i === idx ? { ...s, completed: !s.completed } : s))
    commit(next)
    if (wasCompleted) setRestResetToken((t) => t + 1) // 取消完成则停止误触的计时
  }

  const handleCompleteCurrentSet = () => {
    if (firstIncompleteIdx !== -1) {
      const next = sets.map((s, i) => (i === firstIncompleteIdx ? { ...s, completed: true } : s))
      commit(next)
    }
  }

  /** 撤销最后完成的一组 */
  const handleUndoLastSet = () => {
    let last = -1
    sets.forEach((s, i) => {
      if (s.completed) last = i
    })
    if (last < 0) return
    const next = sets.map((s, i) => (i === last ? { ...s, completed: false } : s))
    commit(next)
    setRestResetToken((t) => t + 1)
  }

  const activeWeight = Number(sets[activeSetIdx]?.weight) || 0
  const weightStep = activeWeight >= 20 ? 2.5 : 1
  const plateHint =
    activeVariant.isPlateLoaded && activeWeight > 0 ? calculatePlatesPerSide(activeWeight / 2) : ''

  const banner = smartData?.overloadBanner

  return (
    <>
      <div
        className={`relative w-full h-full rounded-3xl border px-3.5 pt-3 pb-2.5 flex flex-col justify-between select-none ${theme.cardBg}`}
      >
        {cardFace === 'settings' ? (
          <div className="flex-1 min-h-0 overflow-y-auto mb-2">
            <AttachedSettingsCard
              exercise={{ ...exercise, activeVariant }}
              venueMode={venueMode}
              customConfig={customConfig}
              theme={theme}
              onSave={(cfg) => {
                onSaveCustomConfig?.(exercise.id, venueMode, cfg)
                if (cfg.seatNote) onSaveSeatMemory?.(exercise.id, cfg.seatNote)
                setCardFace('workout')
              }}
              onReset={() => {
                onResetToACSMPlan?.(exercise.id, venueMode)
                setCardFace('workout')
              }}
              onBack={() => setCardFace('workout')}
            />
          </div>
        ) : (
          <>
            {/* 1. 紧凑顶部信息区 */}
            <div>
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`px-2 py-0.5 text-[10px] font-black rounded-lg border ${theme.accentBadge}`}
                >
                  {cardIndex + 1}/{totalDeckCards} · {exercise.order}
                </span>

                <div className="flex items-center gap-1">
                  {/* 收纳式体感标签（不占下端高度） */}
                  <button
                    type="button"
                    onClick={() => setShowTagsPopover(!showTagsPopover)}
                    className={`px-2 py-1 rounded-xl border text-[10px] font-bold flex items-center gap-1 active:scale-95 ${
                      selectedTags.length > 0
                        ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                        : 'bg-white/10 border-white/15 text-slate-300'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    <span>标签{selectedTags.length > 0 ? `(${selectedTags.length})` : ''}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCueFlash(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-200 text-[10px] font-extrabold active:scale-95"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>要领</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCardFace('settings')}
                    className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 border border-white/15 text-[10px] font-bold active:scale-95"
                  >
                    <Settings2 className="w-3 h-3" />
                    <span>设置</span>
                  </button>
                </div>
              </div>

              {/* 弹出式体感标签浮层 */}
              {showTagsPopover && (
                <div className="mt-1.5 p-2 rounded-2xl bg-slate-950/95 border border-white/20 flex flex-wrap gap-1.5 z-30">
                  {QUICK_TAGS.map((tag) => {
                    const active = selectedTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const next = active
                            ? selectedTags.filter((t) => t !== tag)
                            : [...selectedTags, tag]
                          setSelectedTags(next)
                          onUpdateSetData?.(effectiveId || exercise.id, sets, next)
                        }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                          active ? `bg-gradient-to-r ${theme.accentPrimary}` : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* 主标题与目标处方 */}
              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <h2 className="text-lg font-black tracking-tight truncate">{activeVariant.name}</h2>
                <span className={`text-xs font-extrabold shrink-0 ${theme.accentText}`}>
                  {sets.length}组 × {minReps}–{maxReps}次
                </span>
              </div>

              {/* 器械编号 + 单边挂片 + 机位记忆（合并单行） */}
              <div className="text-[10px] opacity-85 flex items-center justify-between gap-2 mt-0.5">
                <span className="truncate">
                  {activeVariant.machineCode}
                  {plateHint && <b className="text-amber-300 ml-1.5">(单边 {plateHint})</b>}
                </span>
                <span className="text-amber-200/90 font-medium truncate shrink-0 max-w-[9.5rem]">
                  💺{' '}
                  {customConfig?.seatNote || seatMemory || activeVariant.defaultSeatNote || '标准机位'}
                </span>
              </div>

              {/* 单行浓缩节奏条 */}
              <div
                onClick={() => setShowCueFlash(true)}
                className={`mt-1.5 px-2.5 py-1 rounded-xl border text-[10px] flex items-center justify-between cursor-pointer ${theme.subCardBg}`}
              >
                <div className="truncate">
                  <span className="text-rose-300 font-bold">向心{tempoGuide.concentric.time}</span>
                  <span className="mx-1 opacity-40">|</span>
                  <span className="text-sky-300 font-bold">离心{tempoGuide.eccentric.time}</span>
                  <span className="mx-1 opacity-40">|</span>
                  <span className="text-amber-300 font-bold">{tempoGuide.bottomPause.cue}</span>
                </div>
                <span className="text-[9px] text-amber-300 shrink-0 ml-1 underline">详情 ➔</span>
              </div>

              {/* 一次确认型升级提醒 */}
              {banner?.type === 'upgrade_ready' && (
                <div className="mt-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-[10px] flex items-center justify-between gap-1.5">
                  <span className="font-bold text-amber-100 truncate">{banner.title}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const newW = banner.recommendedWeight
                        const resetR = banner.resetReps || minReps
                        const next = sets.map((s) =>
                          s.completed ? s : { ...s, weight: newW, reps: resetR }
                        )
                        commit(next)
                        onAckOverload?.(banner.ackKey, 'accepted', exercise.id, venueMode, newW)
                      }}
                      className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black"
                    >
                      确认升重
                    </button>
                    <button
                      type="button"
                      onClick={() => onAckOverload?.(banner.ackKey, 'dismissed')}
                      className="px-1.5 py-0.5 rounded-lg bg-white/10 text-slate-300"
                    >
                      暂不
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. 中部：紧凑分组行 */}
            <div className="my-1.5 flex-1 min-h-0 flex flex-col justify-center space-y-1.5 overflow-y-auto no-scrollbar">
              {sets.map((s, idx) => {
                const isCurrentFocus = idx === activeSetIdx && !s.completed
                return (
                  <div
                    key={s.setNo ?? idx}
                    className={`flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-2xl border transition-all ${
                      s.completed
                        ? theme.doneRowBg
                        : isCurrentFocus
                        ? `ring-2 ring-amber-400/80 ${theme.subCardBg}`
                        : theme.subCardBg
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                        isCurrentFocus ? 'bg-amber-400 text-slate-950' : 'bg-black/35'
                      }`}
                    >
                      #{s.setNo ?? idx + 1}
                    </span>

                    <SwipeNumberControl
                      value={s.weight}
                      step={weightStep}
                      min={0}
                      max={300}
                      unit="kg"
                      theme={theme}
                      onChange={(val) => handleWeightChange(idx, val)}
                    />

                    <SwipeNumberControl
                      value={s.reps}
                      step={1}
                      min={1}
                      max={60}
                      unit="次"
                      theme={theme}
                      highlightColor="text-emerald-400"
                      onChange={(val) => handleRepsChange(idx, val)}
                    />

                    <button
                      type="button"
                      onClick={() => toggleSetDone(idx)}
                      className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center transition shrink-0 ${
                        s.completed ? `bg-gradient-to-r ${theme.doneBtn}` : 'bg-white/10 text-white/60'
                      }`}
                    >
                      ✓
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* 3. 下端：纯粹的巨型休息大键 */}
        <div className="pt-0.5 shrink-0">
          <GiantRestBar
            key={restResetToken}
            activeSetNo={activeSetIdx + 1}
            totalSets={sets.length}
            allSetsCompleted={allSetsCompleted}
            restDurationSeconds={effectiveRestSeconds}
            isOverlayOpen={cardFace === 'settings' || showCueFlash}
            theme={theme}
            onStartSetComplete={handleCompleteCurrentSet}
            onAdvanceNext={() => {
              if (allSetsCompleted && onFlipCard) onFlipCard('next')
            }}
            onUndoLastSet={handleUndoLastSet}
            onReturnToWorkoutFace={() => {
              setCardFace('workout')
              setShowCueFlash(false)
            }}
            onRestStateChange={onRestStateChange}
          />
        </div>
      </div>

      {showCueFlash && (
        <ActionCueFlashCard
          exercise={exercise}
          venueMode={venueMode}
          theme={theme}
          onClose={() => setShowCueFlash(false)}
        />
      )}
    </>
  )
}
