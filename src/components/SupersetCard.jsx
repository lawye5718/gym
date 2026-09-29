import { useEffect, useState } from 'react'
import { BookOpen, Settings2, Zap } from 'lucide-react'
import SwipeNumberControl from './SwipeNumberControl'
import GiantRestBar from './GiantRestBar'
import AttachedSettingsCard from './AttachedSettingsCard'
import ActionCueFlashCard from './ActionCueFlashCard'

/**
 * V2.7 超级组上下联动卡片
 * 上半部：动作 A；下半部：动作 B
 * 各自拥有独立的重量/次数步进器、要领闪卡与设置背卡，共用底部休息大键；
 * A 与 B 各完成一组后点击大键打卡休息，休息结束同时推进 A、B 的下一组。
 */
export default function SupersetCard({
  exercise, // 复合超级组对象，包含 subExercises: [exA, exB]
  venueMode,
  theme,
  cardIndex,
  totalDeckCards,
  onSaveCustomConfig,
  onResetToACSMPlan,
  onUpdateSupersetData,
  onFlipCard,
}) {
  const exA = exercise.subExercises?.[0]
  const exB = exercise.subExercises?.[1]

  const [activeFace, setActiveFace] = useState('workout') // workout | settings_A | settings_B
  const [activeCueEx, setActiveCueEx] = useState(null)
  const [restResetToken, setRestResetToken] = useState(0)

  const [setsA, setSetsA] = useState(exA?.prefillSets || [])
  const [setsB, setSetsB] = useState(exB?.prefillSets || [])

  // 同步外部预填
  useEffect(() => {
    setSetsA(exA?.prefillSets || [])
    setSetsB(exB?.prefillSets || [])
  }, [exA, exB, venueMode])

  if (!exA || !exB) return null

  const variantA = exA.variants?.[venueMode] || exA.variants?.newGym || {}
  const variantB = exB.variants?.[venueMode] || exB.variants?.newGym || {}

  const firstIncompleteA = setsA.findIndex((s) => !s.completed)
  const firstIncompleteB = setsB.findIndex((s) => !s.completed)
  const currentRoundIdx = Math.max(
    0,
    Math.min(
      firstIncompleteA === -1 ? setsA.length - 1 : firstIncompleteA,
      firstIncompleteB === -1 ? setsB.length - 1 : firstIncompleteB
    )
  )
  const allCompleted = firstIncompleteA === -1 && firstIncompleteB === -1

  const handleUpdateVal = (which, setIdx, field, val) => {
    if (which === 'A') {
      const next = setsA.map((s, i) => (i === setIdx ? { ...s, [field]: Number(val) } : s))
      setSetsA(next)
      onUpdateSupersetData?.(exercise.id, next, setsB)
    } else {
      const next = setsB.map((s, i) => (i === setIdx ? { ...s, [field]: Number(val) } : s))
      setSetsB(next)
      onUpdateSupersetData?.(exercise.id, setsA, next)
    }
  }

  /** 共用休息大键：把当前轮次 A、B 同时标记完成 */
  const handleCompleteCurrentRound = () => {
    const nextA = setsA.map((s, i) => (i === currentRoundIdx ? { ...s, completed: true } : s))
    const nextB = setsB.map((s, i) => (i === currentRoundIdx ? { ...s, completed: true } : s))
    setSetsA(nextA)
    setSetsB(nextB)
    onUpdateSupersetData?.(exercise.id, nextA, nextB)
  }

  const handleUndo = () => {
    let lastA = -1
    setsA.forEach((s, i) => {
      if (s.completed) lastA = i
    })
    let lastB = -1
    setsB.forEach((s, i) => {
      if (s.completed) lastB = i
    })
    const idx = Math.max(lastA, lastB)
    if (idx < 0) return
    const nextA = setsA.map((s, i) => (i === idx ? { ...s, completed: false } : s))
    const nextB = setsB.map((s, i) => (i === idx ? { ...s, completed: false } : s))
    setSetsA(nextA)
    setSetsB(nextB)
    onUpdateSupersetData?.(exercise.id, nextA, nextB)
    setRestResetToken((t) => t + 1)
  }

  // 设置背卡（覆盖层，不卸载主卡与休息计时）
  const renderSettings = (which) => {
    const ex = which === 'A' ? exA : exB
    return (
      <div className="absolute inset-0 z-40 rounded-3xl overflow-hidden">
        <AttachedSettingsCard
          exercise={ex}
          venueMode={venueMode}
          customConfig={ex.customConfig}
          theme={theme}
          onSave={(cfg) => {
            onSaveCustomConfig?.(ex.id, venueMode, cfg)
            setActiveFace('workout')
          }}
          onReset={() => {
            onResetToACSMPlan?.(ex.id, venueMode)
            setActiveFace('workout')
          }}
          onBack={() => setActiveFace('workout')}
        />
      </div>
    )
  }

  const renderHalf = (which, ex, variant, sets) => {
    const isA = which === 'A'
    return (
      <div className={`flex-1 rounded-2xl border p-2 flex flex-col justify-between ${theme.subCardBg}`}>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                isA ? 'bg-rose-500/20 text-rose-300' : 'bg-sky-500/20 text-sky-300'
              }`}
            >
              动作 {which}
            </span>
            <h4 className="text-sm font-black mt-0.5 truncate">{variant.name}</h4>
            <div className="text-[10px] opacity-75 truncate">{variant.machineCode}</div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveCueEx(ex)}
              className="px-2 py-1 rounded-lg bg-amber-400/20 text-amber-200 text-[10px] font-bold flex items-center gap-0.5"
            >
              <BookOpen className="w-3 h-3" />
              <span>要领</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFace(isA ? 'settings_A' : 'settings_B')}
              className="p-1 rounded-lg bg-white/10 text-slate-300"
            >
              <Settings2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="space-y-1 my-1 overflow-y-auto no-scrollbar max-h-24">
          {sets.map((s, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between gap-1 px-2 py-1 rounded-xl border text-xs ${
                s.completed
                  ? theme.doneRowBg
                  : idx === currentRoundIdx
                  ? 'ring-1 ring-amber-400'
                  : 'bg-black/25'
              }`}
            >
              <span className="font-bold opacity-80">#{s.setNo ?? idx + 1}</span>
              <SwipeNumberControl
                value={s.weight}
                step={Number(s.weight) >= 20 ? 2.5 : 1}
                min={0}
                unit="kg"
                theme={theme}
                onChange={(v) => handleUpdateVal(which, idx, 'weight', v)}
              />
              <SwipeNumberControl
                value={s.reps}
                step={1}
                min={1}
                unit="次"
                theme={theme}
                highlightColor="text-emerald-400"
                onChange={(v) => handleUpdateVal(which, idx, 'reps', v)}
              />
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  s.completed ? 'bg-emerald-500/30 text-emerald-300' : 'opacity-40'
                }`}
              >
                {s.completed ? '✓' : '待做'}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative w-full h-full rounded-3xl border p-3 flex flex-col justify-between select-none ${theme.cardBg}`}
    >
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg border ${theme.accentBadge}`}>
            {cardIndex + 1}/{totalDeckCards} · 超级组
          </span>
          <span className="text-amber-300 text-xs font-black flex items-center gap-0.5">
            <Zap className="w-3.5 h-3.5 fill-amber-300" />
            <span>双动作无缝连做</span>
          </span>
        </div>
        <span className="text-[10px] opacity-70">A+B 各做一组后开始休息</span>
      </div>

      {/* 上下双动作联动视窗 */}
      <div className="flex-1 flex flex-col gap-2 my-1.5 overflow-hidden">
        {renderHalf('A', exA, variantA, setsA)}
        {renderHalf('B', exB, variantB, setsB)}
      </div>

      {/* 底部共用 GiantRestBar */}
      <div className="pt-1">
        <GiantRestBar
          key={restResetToken}
          activeSetNo={currentRoundIdx + 1}
          totalSets={Math.max(setsA.length, setsB.length)}
          allSetsCompleted={allCompleted}
          restDurationSeconds={exA.prescription?.restSeconds || 120}
          isOverlayOpen={activeFace !== 'workout' || !!activeCueEx}
          theme={theme}
          onStartSetComplete={handleCompleteCurrentRound}
          onAdvanceNext={() => {
            if (allCompleted && onFlipCard) onFlipCard('next')
          }}
          onUndoLastSet={handleUndo}
          onReturnToWorkoutFace={() => {
            setActiveFace('workout')
            setActiveCueEx(null)
          }}
          onRestStateChange={() => {}}
        />
      </div>

      {/* 设置背卡覆盖层 */}
      {activeFace === 'settings_A' && renderSettings('A')}
      {activeFace === 'settings_B' && renderSettings('B')}

      {/* 要领闪卡 */}
      {activeCueEx && (
        <ActionCueFlashCard
          exercise={activeCueEx}
          venueMode={venueMode}
          theme={theme}
          onClose={() => setActiveCueEx(null)}
        />
      )}
    </div>
  )
}
