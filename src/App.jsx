import { useCallback, useMemo, useRef, useState } from 'react'
import { THEMES } from './utils/themeConfig'
import { ALL_EXERCISES, DAY_META, buildDayExercises } from './data/seedPlanData'
import { getSmartPrescription, getVenueExerciseKey } from './utils/overloadEngine'
import {
  importCustomPlan,
  loadAllState,
  resetCustomAvatar,
  resetCustomExerciseConfig,
  resetCustomPlan,
  saveCardioOrRestLog,
  saveCustomAvatar,
  saveCustomExerciseConfig,
  saveExerciseSessionLog,
  saveUpgradeAck,
} from './utils/storageSync'
import HeaderSwitcher from './components/HeaderSwitcher'
import DaySwiper from './components/DaySwiper'
import ExerciseCard from './components/ExerciseCard'
import SupersetCard from './components/SupersetCard'
import DailySummaryCard from './components/DailySummaryCard'
import WelcomeCard from './components/WelcomeCard'
import FinaleCard from './components/FinaleCard'
import CardioPanel from './components/CardioPanel'
import AnalyticsModal from './components/AnalyticsModal'
import PlanAndAvatarModal from './components/PlanAndAvatarModal'

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function App() {
  const initialState = useMemo(() => loadAllState(), [])
  const [logs, setLogs] = useState(initialState.logs)
  const [seatMemory, setSeatMemory] = useState(initialState.seatMemory)
  const [customConfigs, setCustomConfigs] = useState(initialState.customConfigs)
  const [cycleMeta, setCycleMeta] = useState(initialState.cycleMeta)
  const [customAvatars, setCustomAvatars] = useState(initialState.customAvatars || {})
  const [customPlan, setCustomPlan] = useState(initialState.customPlan || null)
  const [upgradeAckMap, setUpgradeAckMap] = useState(initialState.upgradeAckMap || {})
  // V2.7：「或者」备选器械选择（exerciseId -> altId）
  const [altSelections, setAltSelections] = useState({})

  const [currentUser, setCurrentUser] = useState('leo')
  const [venueMode, setVenueMode] = useState('newGym')
  const [currentDay, setCurrentDay] = useState(1)
  const [activeCardIdx, setActiveCardIdx] = useState(0)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showPlanSettings, setShowPlanSettings] = useState(false)
  const [isResting, setIsResting] = useState(false)

  const theme = THEMES[currentUser]

  const dayExercises = useMemo(
    () => buildDayExercises(currentUser, currentDay, venueMode, customPlan),
    [currentUser, currentDay, venueMode, customPlan]
  )

  /** 附带智能预填：使清算卡在动作尚未打卡时也能直接录入 / 修改每一组 */
  const dayExercisesWithPrefill = useMemo(
    () =>
      dayExercises.map((ex) => ({
        ...ex,
        prefillSets: getSmartPrescription(
          ex,
          venueMode,
          logs,
          customConfigs[getVenueExerciseKey(ex.id, venueMode)],
          upgradeAckMap
        ).prefillSets,
      })),
    [dayExercises, venueMode, logs, customConfigs, upgradeAckMap]
  )

  // V2.7 牌堆：欢迎卡 → 动作卡（普通 / 超级组）→ 每日清算卡 → 完赛尾卡
  const deckCards = useMemo(() => {
    if (!dayExercisesWithPrefill.length) return []
    return [
      { type: 'welcome' },
      ...dayExercisesWithPrefill.map((ex) => ({ type: 'exercise', data: ex })),
      { type: 'summary' },
      { type: 'finale' },
    ]
  }, [dayExercisesWithPrefill])

  const totalDeckCards = deckCards.length || 1
  const safeCardIdx = Math.min(activeCardIdx, totalDeckCards - 1)
  const currentCard = deckCards[safeCardIdx]
  const summaryIdx = dayExercises.length + 1
  const finaleIdx = dayExercises.length + 2

  // ── 单步防抖锁：一次上下滑严格只翻 1 张；休息/响铃期间锁定翻牌 ──
  const isFlippingRef = useRef(false)
  const touchHandledRef = useRef(false)

  const handleFlipCard = useCallback(
    (direction) => {
      if (!deckCards.length) return
      if (isResting) return
      if (isFlippingRef.current) return
      isFlippingRef.current = true
      setActiveCardIdx((prev) => {
        if (direction === 'next') return (prev + 1) % totalDeckCards
        return (prev - 1 + totalDeckCards) % totalDeckCards
      })
      setTimeout(() => {
        isFlippingRef.current = false
      }, 320)
    },
    [deckCards.length, totalDeckCards, isResting]
  )

  const stageTouchRef = useRef({ x: 0, y: 0 })

  const handleStageTouchStart = (e) => {
    stageTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    touchHandledRef.current = false
  }

  const handleStageTouchEnd = (e) => {
    if (touchHandledRef.current) return
    const dx = e.changedTouches[0].clientX - stageTouchRef.current.x
    const dy = e.changedTouches[0].clientY - stageTouchRef.current.y

    if (Math.abs(dy) > 45 && Math.abs(dy) > Math.abs(dx) * 1.2) {
      touchHandledRef.current = true
      handleFlipCard(dy < 0 ? 'next' : 'prev')
    } else if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      touchHandledRef.current = true
      setCurrentDay((d) => (dx < 0 ? (d % 8) + 1 : ((d - 2 + 8) % 8) + 1))
      setActiveCardIdx(0)
    }
  }

  /** 当日打卡日志 */
  const todayLog = useMemo(() => {
    const today = todayStr()
    return logs.find(
      (l) =>
        l.date === today && l.user === currentUser && l.day === currentDay && l.venueMode === venueMode
    )
  }, [logs, currentUser, currentDay, venueMode])

  const todayStats = useMemo(() => {
    let completedSetsCount = 0
    let totalVolumeKg = 0
    const totalSetsCount = dayExercises.reduce((sum, ex) => sum + (ex.prescription?.sets || 0), 0)
    if (todayLog?.exercises) {
      for (const ex of todayLog.exercises) {
        for (const s of ex.sets || []) {
          if (s.completed) {
            completedSetsCount += 1
            totalVolumeKg += (Number(s.weight) || 0) * (Number(s.reps) || 0)
          }
        }
      }
    }
    return { completedSetsCount, totalSetsCount, totalVolumeKg: Math.round(totalVolumeKg) }
  }, [todayLog, dayExercises])

  /** 三色状态灯：未开始(灰) / 进行中(琥珀) / 已完成(翠绿) */
  const cardCompletion = useMemo(
    () =>
      dayExercises.map((ex) => {
        const rec = todayLog?.exercises?.find((e) => e.exerciseId === ex.id)
        const total = ex.prescription?.sets || 0
        const done = (rec?.sets || []).filter((s) => s.completed).length
        if (total > 0 && done >= total) return 'done'
        if (done > 0) return 'partial'
        return 'todo'
      }),
    [todayLog, dayExercises]
  )

  // 当前动作卡（含备选器械的有效 ID）
  const currentExercise = currentCard?.type === 'exercise' ? currentCard.data : null
  const currentAltId = currentExercise
    ? altSelections[currentExercise.id] || currentExercise.activeAltId
    : null
  const currentEffectiveId =
    currentExercise && currentAltId ? `${currentExercise.id}::${currentAltId}` : currentExercise?.id
  const currentScopedKey = currentEffectiveId ? getVenueExerciseKey(currentEffectiveId, venueMode) : ''

  const currentSmartData = useMemo(() => {
    if (!currentExercise) return null
    return getSmartPrescription(
      { ...currentExercise, id: currentEffectiveId || currentExercise.id },
      venueMode,
      logs,
      customConfigs[currentScopedKey],
      upgradeAckMap
    )
  }, [currentExercise, currentEffectiveId, venueMode, logs, customConfigs, currentScopedKey, upgradeAckMap])

  /** 超级组：为两个子动作各自计算预填数据 */
  const supersetData = useMemo(() => {
    if (currentExercise?.type !== 'superset') return null
    return {
      ...currentExercise,
      subExercises: (currentExercise.subExercises || []).map((sub) => {
        const key = getVenueExerciseKey(sub.id, venueMode)
        const sd = getSmartPrescription(sub, venueMode, logs, customConfigs[key], upgradeAckMap)
        return { ...sub, prefillSets: sd.prefillSets, customConfig: customConfigs[key] }
      }),
    }
  }, [currentExercise, venueMode, logs, customConfigs, upgradeAckMap])

  const handleUpdateSetData = (exerciseId, nextSets, quickTags) => {
    const nextLogs = saveExerciseSessionLog({
      user: currentUser,
      day: currentDay,
      venueMode,
      cycleNumber: cycleMeta.cycleNumber,
      exerciseId,
      sets: nextSets,
      quickTags,
    })
    setLogs([...nextLogs])
  }

  /** 超级组：A、B 两个子动作分别独立落库 */
  const handleUpdateSupersetData = (supersetId, setsA, setsB) => {
    const subs = supersetData?.subExercises || currentExercise?.subExercises || []
    if (subs[0]) {
      setLogs([
        ...saveExerciseSessionLog({
          user: currentUser,
          day: currentDay,
          venueMode,
          cycleNumber: cycleMeta.cycleNumber,
          exerciseId: subs[0].id,
          sets: setsA,
          quickTags: [],
        }),
      ])
    }
    if (subs[1]) {
      setLogs([
        ...saveExerciseSessionLog({
          user: currentUser,
          day: currentDay,
          venueMode,
          cycleNumber: cycleMeta.cycleNumber,
          exerciseId: subs[1].id,
          sets: setsB,
          quickTags: [],
        }),
      ])
    }
  }

  /** 清算卡：直接修改某一组的重量/次数（未打卡时用预填值起底） */
  const handleUpdateSingleSet = (exerciseId, setIdx, field, val) => {
    const rec = todayLog?.exercises?.find((e) => e.exerciseId === exerciseId)
    const ex = dayExercisesWithPrefill.find((e) => e.id === exerciseId)
    const sets = rec?.sets || ex?.prefillSets || []
    if (!sets[setIdx]) return
    const nextSets = sets.map((s, i) => (i === setIdx ? { ...s, [field]: Number(val) } : s))
    handleUpdateSetData(exerciseId, nextSets, rec?.quickTags || [])
  }

  /** 清算卡：切换某一组完成状态 */
  const handleToggleSetDone = (exerciseId, setIdx) => {
    const rec = todayLog?.exercises?.find((e) => e.exerciseId === exerciseId)
    const ex = dayExercisesWithPrefill.find((e) => e.id === exerciseId)
    const sets = rec?.sets || ex?.prefillSets || []
    if (!sets[setIdx]) return
    const nextSets = sets.map((s, i) => (i === setIdx ? { ...s, completed: !s.completed } : s))
    handleUpdateSetData(exerciseId, nextSets, rec?.quickTags || [])
  }

  const handleSaveCustomConfig = (exerciseId, venue, configObj) =>
    setCustomConfigs({ ...saveCustomExerciseConfig(exerciseId, venue, configObj) })
  const handleResetToACSMPlan = (exerciseId, venue) =>
    setCustomConfigs({ ...resetCustomExerciseConfig(exerciseId, venue) })
  const handleSaveUpgradeAck = (ackKey, decision) =>
    setUpgradeAckMap({ ...saveUpgradeAck(ackKey, decision) })
  const handleSelectAlternative = (exerciseId, altId) =>
    setAltSelections((prev) => ({ ...prev, [exerciseId]: altId }))

  const handleSaveCardio = (cardioData) => {
    const res = saveCardioOrRestLog({
      user: currentUser,
      day: currentDay,
      venueMode,
      cycleNumber: cycleMeta.cycleNumber,
      cardioData,
    })
    setLogs([...res.logs])
    setCycleMeta({ ...res.cycleMeta })
  }

  const handleSaveAvatar = (k, d) => setCustomAvatars({ ...saveCustomAvatar(k, d) })
  const handleResetAvatar = (k) => setCustomAvatars({ ...resetCustomAvatar(k) })
  const handleImportPlan = (p) => {
    const r = importCustomPlan(p)
    setCustomPlan(r.plan)
    return r
  }
  const handleResetPlan = () => setCustomPlan(resetCustomPlan())

  const dayMetaMap = useMemo(() => {
    const m = {}
    DAY_META.forEach((d) => {
      m[d.day] = { name: d.title, focus: d.sub, emoji: d.emoji }
    })
    return m
  }, [])

  const dotFor = (idx) => {
    if (idx === 0 || idx >= summaryIdx) {
      return idx === safeCardIdx ? theme.dotActive : theme.dotInactive
    }
    const state = cardCompletion[idx - 1] || 'todo'
    if (state === 'done') return 'bg-emerald-400 h-5 w-1.5'
    if (state === 'partial') return 'bg-amber-400 h-5 w-1.5 animate-pulse'
    return idx === safeCardIdx ? theme.dotActive : theme.dotInactive
  }

  return (
    <div
      className={`h-[100dvh] w-screen overflow-hidden flex flex-col select-none transition-colors duration-500 ${theme.appBg}`}
    >
      <HeaderSwitcher
        currentUser={currentUser}
        onSelectUser={(u) => {
          setCurrentUser(u)
          setActiveCardIdx(0)
        }}
        venueMode={venueMode}
        onSelectVenue={(v) => {
          setVenueMode(v)
          setActiveCardIdx(0)
        }}
        customAvatars={customAvatars}
        onOpenAnalytics={() => setShowAnalytics(true)}
        onOpenPlanSettings={() => setShowPlanSettings(true)}
        onOpenDailySummary={() => setActiveCardIdx(summaryIdx)}
      />

      <DaySwiper
        currentDay={currentDay}
        dayMeta={DAY_META}
        theme={theme}
        extraRestInserted={cycleMeta.extraRestDayInserted}
        onSelectDay={(d) => {
          setCurrentDay(d)
          setActiveCardIdx(0)
        }}
        onToggleExtraRest={() => {
          const next = { ...cycleMeta, extraRestDayInserted: !cycleMeta.extraRestDayInserted }
          setCycleMeta(next)
          localStorage.setItem('acsm2026_cycle_meta_v25', JSON.stringify(next))
        }}
      />

      <main
        onTouchStart={handleStageTouchStart}
        onTouchEnd={handleStageTouchEnd}
        className="flex-1 min-h-0 px-3 pt-1.5 pb-3 flex items-center justify-center relative"
      >
        {!deckCards.length ? (
          <div className="w-full h-full max-w-md">
            <CardioPanel
              currentDay={currentDay}
              currentUser={currentUser}
              venueMode={venueMode}
              theme={theme}
              cycleNumber={cycleMeta.cycleNumber}
              savedCardio={todayLog?.cardioSummary || null}
              onSave={handleSaveCardio}
            />
          </div>
        ) : (
          <div className="w-full h-full max-w-md flex items-center gap-1.5">
            <div className="flex-1 h-full min-w-0">
              {/* 卡片 0：加油欢迎卡 */}
              {currentCard?.type === 'welcome' && (
                <WelcomeCard
                  currentDay={currentDay}
                  currentUser={currentUser}
                  venueMode={venueMode}
                  dayMeta={dayMetaMap}
                  theme={theme}
                  customAvatars={customAvatars}
                  onStartFirstExercise={() => handleFlipCard('next')}
                />
              )}

              {/* 动作卡：超级组 */}
              {currentCard?.type === 'exercise' && currentExercise?.type === 'superset' && supersetData && (
                <SupersetCard
                  key={`${currentUser}_${currentDay}_${venueMode}_${currentExercise.id}`}
                  exercise={supersetData}
                  venueMode={venueMode}
                  theme={theme}
                  cardIndex={safeCardIdx}
                  totalDeckCards={totalDeckCards}
                  onSaveCustomConfig={handleSaveCustomConfig}
                  onResetToACSMPlan={handleResetToACSMPlan}
                  onUpdateSupersetData={handleUpdateSupersetData}
                  onFlipCard={handleFlipCard}
                />
              )}

              {/* 动作卡：普通单动作（含“或者”备选器械切换） */}
              {currentCard?.type === 'exercise' && currentExercise?.type !== 'superset' && currentExercise && (
                <ExerciseCard
                  key={`${currentUser}_${currentDay}_${venueMode}_${currentEffectiveId}`}
                  exercise={currentExercise}
                  venueMode={venueMode}
                  smartData={currentSmartData}
                  customConfig={customConfigs[currentScopedKey]}
                  seatMemory={seatMemory[currentScopedKey]}
                  theme={theme}
                  cardIndex={Math.max(0, safeCardIdx - 1)}
                  totalExerciseCards={dayExercises.length}
                  upgradeAckMap={upgradeAckMap}
                  effectiveId={currentEffectiveId}
                  onSelectAlternative={handleSelectAlternative}
                  onRestStateChange={setIsResting}
                  onSaveUpgradeAck={handleSaveUpgradeAck}
                  onSaveSeatMemory={(exId, text) => {
                    const next = { ...seatMemory, [getVenueExerciseKey(exId, venueMode)]: text }
                    setSeatMemory(next)
                    localStorage.setItem('acsm2026_seat_memory_v25', JSON.stringify(next))
                  }}
                  onSaveCustomConfig={handleSaveCustomConfig}
                  onResetToACSMPlan={handleResetToACSMPlan}
                  onUpdateSetData={handleUpdateSetData}
                  onFlipCard={handleFlipCard}
                />
              )}

              {/* 每日清算卡 */}
              {currentCard?.type === 'summary' && (
                <DailySummaryCard
                  currentDay={currentDay}
                  currentUser={currentUser}
                  venueMode={venueMode}
                  dayExercises={dayExercisesWithPrefill}
                  todayLog={todayLog}
                  theme={theme}
                  onUpdateSingleSet={handleUpdateSingleSet}
                  onToggleSetDone={handleToggleSetDone}
                  onFinishWorkout={() => setActiveCardIdx(finaleIdx)}
                  onReturnToDeck={() => setActiveCardIdx(0)}
                />
              )}

              {/* 完赛尾卡 */}
              {currentCard?.type === 'finale' && (
                <FinaleCard
                  currentUser={currentUser}
                  currentDay={currentDay}
                  customAvatars={customAvatars}
                  completedSetsCount={todayStats.completedSetsCount}
                  totalSetsCount={todayStats.totalSetsCount}
                  totalVolumeKg={todayStats.totalVolumeKg}
                  theme={theme}
                  onRestartFirstCard={() => setActiveCardIdx(0)}
                />
              )}
            </div>

            {/* 右侧竖向牌序三色状态灯 */}
            <div className="flex flex-col items-center justify-center gap-1.5 px-0.5">
              {deckCards.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveCardIdx(idx)}
                  className={`rounded-full transition-all duration-300 ${dotFor(idx)}`}
                  title={
                    idx === 0
                      ? '欢迎卡'
                      : idx === summaryIdx
                      ? '当日清算卡'
                      : idx === finaleIdx
                      ? '完赛尾卡'
                      : `动作 #${idx}（${
                          cardCompletion[idx - 1] === 'done'
                            ? '已完成'
                            : cardCompletion[idx - 1] === 'partial'
                            ? '进行中'
                            : '未开始'
                        }）`
                  }
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {showAnalytics && (
        <AnalyticsModal
          logs={logs}
          allPlanItems={ALL_EXERCISES}
          currentUser={currentUser}
          cycleNumber={cycleMeta.cycleNumber}
          theme={theme}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {showPlanSettings && (
        <PlanAndAvatarModal
          customAvatars={customAvatars}
          theme={theme}
          onSaveAvatar={handleSaveAvatar}
          onResetAvatar={handleResetAvatar}
          onImportCustomPlanJson={handleImportPlan}
          onResetPlanToDefault={handleResetPlan}
          onClose={() => setShowPlanSettings(false)}
        />
      )}
    </div>
  )
}
