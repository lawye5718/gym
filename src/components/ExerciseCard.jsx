import { useEffect, useState } from 'react'
import { Check, Ruler, Settings } from 'lucide-react'
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
  '⚠️关节微紧',
]

/**
 * V2.6 单屏动作分组状态主卡
 * 关键修复：
 * - ⚙️设置 / 📐要领 以「覆盖层」呈现，主卡与 GiantRestBar 常驻挂载，倒计时绝不中断重置
 * - 移除卡片内部的上下翻牌与左右滑改次数监听，全站手势统一由 App.jsx 管理（杜绝双重触发跳卡）
 * - 升级提醒引入 upgradeAckMap 指纹锁：一次确认或忽略后不再反复打扰
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
  upgradeAckMap,
  onRestStateChange,
  onSaveSeatMemory,
  onSaveCustomConfig,
  onResetToACSMPlan,
  onUpdateSetData,
  onSaveUpgradeAck,
  effectiveId,
  onSelectAlternative,
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
  const [restResetToken, setRestResetToken] = useState(0)

  // 设置卡更新 / 切换动作后重新带入预填
  useEffect(() => {
    setSets(smartData?.prefillSets || [])
    setActiveSetIdx(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customConfig?.updatedAt, exercise.id])

  const commit = (nextSets, tags = selectedTags) => {
    setSets(nextSets)
    onUpdateSetData?.(effectiveId || exercise.id, nextSets, tags)
  }

  const handleFieldChange = (idx, field, val) => {
    const next = sets.map((s, i) => (i === idx ? { ...s, [field]: Number(val) } : s))
    commit(next)
  }

  const toggleTag = (tag) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]
    setSelectedTags(next)
    onUpdateSetData?.(effectiveId || exercise.id, sets, next)
  }

  const firstIncompleteIdx = sets.findIndex((s) => !s.completed)
  const allCompleted = sets.length > 0 && sets.every((s) => s.completed)
  const activeSetNo = (firstIncompleteIdx >= 0 ? firstIncompleteIdx : Math.max(0, sets.length - 1)) + 1

  /** 巨型大键点击：标记当前组完成（休息计时由 GiantRestBar 接管） */
  const handleStartSetComplete = () => {
    const idx = firstIncompleteIdx >= 0 ? firstIncompleteIdx : activeSetIdx
    if (idx < 0 || !sets[idx]) return
    const next = sets.map((s, i) => (i === idx ? { ...s, completed: true } : s))
    commit(next)
  }

  /** 休息自然结束或跳过：自动把焦点推进到下一个未完成组 */
  const handleAutoNext = () => {
    const idx = sets.findIndex((s) => !s.completed)
    if (idx >= 0) setActiveSetIdx(idx)
  }

  /** 撤销误点的最后一组，并停止误触的倒计时 */
  const handleUndoLastSet = () => {
    let last = -1
    sets.forEach((s, i) => {
      if (s.completed) last = i
    })
    if (last < 0) return
    const next = sets.map((s, i) => (i === last ? { ...s, completed: false } : s))
    commit(next)
    setActiveSetIdx(last)
    setRestResetToken((t) => t + 1) // 强制 GiantRestBar 重置，停止计时
  }

  /** 手动切换某组完成状态（误触容错） */
  const toggleSetDone = (idx) => {
    const next = sets.map((s, i) => (i === idx ? { ...s, completed: !s.completed } : s))
    commit(next)
    if (sets[idx]?.completed) setRestResetToken((t) => t + 1) // 取消完成则停止计时
  }

  // 升级提醒指纹锁：同一达标记录确认或忽略后不再重复弹窗
  const banner = smartData?.overloadBanner
  const ackKey = `${exercise.id}__${venueMode}__${smartData?.lastDate || 'none'}__${
    smartData?.lastWeight || 0
  }`
  const acked = upgradeAckMap?.[ackKey]
  const showBanner = banner && !acked

  const handleAcceptUpgrade = () => {
    if (!banner?.recommendedWeight) return
    const next = sets.map((s, i) =>
      i >= activeSetIdx
        ? { ...s, weight: banner.recommendedWeight, reps: banner.resetReps ?? minReps }
        : s
    )
    commit(next)
    onSaveUpgradeAck?.(ackKey, 'accepted')
  }

  const handleDismissUpgrade = () => {
    onSaveUpgradeAck?.(ackKey, 'dismissed')
  }

  const isOverlayOpen = showSettings || showCue

  return (
    <div className={`relative flex flex-col h-full min-h-0 rounded-3xl border ${theme.cardBg}`}>
      {/* 头部 + 牌序 + 升级横幅 */}
      <div className="shrink-0 px-3 pt-2.5 pb-1.5">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${theme.accentBadge}`}>
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

        {/* V2.7：「或者」备选器械自由切换（各自独立记录，互不串台） */}
        {exercise.alternatives && exercise.alternatives.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 p-1 rounded-xl bg-black/40 border border-amber-400/30 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-amber-300 font-bold px-1.5 shrink-0">⇄ 备选器械:</span>
            {exercise.alternatives.map((alt) => {
              const active = effectiveId
                ? effectiveId.endsWith(`::${alt.id}`)
                : exercise.activeAltId === alt.id
              return (
                <button
                  key={alt.id}
                  type="button"
                  onClick={() => onSelectAlternative?.(exercise.id, alt.id)}
                  className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    active ? 'bg-amber-400 text-slate-950 font-black' : 'bg-white/10 text-white/70'
                  }`}
                >
                  {alt.name}
                </button>
              )
            })}
          </div>
        )}

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
          <span>↕ 滑动翻牌（由主舞台统一处理）</span>
        </div>

        {showBanner && (
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
              <div className="flex gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={handleAcceptUpgrade}
                  className={`flex-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-gradient-to-r ${theme.accentPrimary}`}
                >
                  ✅ 确认升至 {banner.recommendedWeight}kg
                </button>
                <button
                  type="button"
                  onClick={handleDismissUpgrade}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/10"
                >
                  ✋ 暂不升级
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 各组打卡 */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 space-y-1.5">
        {sets.map((s, idx) => {
          const isActive = idx === (firstIncompleteIdx >= 0 ? firstIncompleteIdx : activeSetIdx)
          return (
            <div
              key={s.setNo ?? idx}
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
                highlightColor="text-emerald-400"
                className="flex-1"
              />

              <button
                type="button"
                onClick={() => toggleSetDone(idx)}
                className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center font-bold transition ${
                  s.completed
                    ? `bg-gradient-to-r ${theme.doneBtn}`
                    : 'bg-black/30 border border-white/10'
                }`}
                title={s.completed ? '点击可撤销本组' : '标记完成'}
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

      {/* 巨型休息横条（常驻挂载，切换设置卡/要领卡时不会卸载） */}
      <div className="shrink-0 p-3 pt-2">
        <GiantRestBar
          key={restResetToken}
          activeSetNo={activeSetNo}
          totalSets={sets.length || prescription.sets}
          allSetsCompleted={allCompleted}
          restDurationSeconds={restSeconds}
          isOverlayOpen={isOverlayOpen}
          theme={theme}
          onStartSetComplete={handleStartSetComplete}
          onAdvanceNext={handleAutoNext}
          onUndoLastSet={handleUndoLastSet}
          onReturnToWorkoutFace={() => {
            setShowSettings(false)
            setShowCue(false)
          }}
          onRestStateChange={onRestStateChange}
        />
      </div>

      {/* ⚙️ 设置背卡（覆盖层，不卸载主卡与计时器） */}
      {showSettings && (
        <div className="absolute inset-0 z-40 rounded-3xl overflow-hidden">
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
      )}

      {/* 📐 动作要领闪卡（全屏浮层） */}
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
