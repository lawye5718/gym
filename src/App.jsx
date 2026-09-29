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
import FinaleCard from './components/FinaleCard'
import CardioPanel from './components/CardioPanel'
import AnalyticsModal from './components/AnalyticsModal'
import PlanAndAvatarModal from './components/PlanAndAvatarModal'

export default function App() {
  const initialState = useMemo(() => loadAllState(), [])
  const [logs, setLogs] = useState(initialState.logs)
  const [seatMemory, setSeatMemory] = useState(initialState.seatMemory)
  const [customConfigs, setCustomConfigs] = useState(initialState.customConfigs)
  const [cycleMeta, setCycleMeta] = useState(initialState.cycleMeta)
  // V2.6：自定义头像、自定义训练计划、升级确认指纹锁
  const [customAvatars, setCustomAvatars] = useState(initialState.customAvatars || {})
  const [customPlan, setCustomPlan] = useState(initialState.customPlan || null)
  const [upgradeAckMap, setUpgradeAckMap] = useState(initialState.upgradeAckMap || {})

  const [currentUser, setCurrentUser] = useState('leo')
  const [venueMode, setVenueMode] = useState('newGym')
  const [currentDay, setCurrentDay] = useState(1)
  const [activeCardIdx, setActiveCardIdx] = useState(0)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showPlanSettings, setShowPlanSettings] = useState(false)
  const [isResting, setIsResting] = useState(false)

  const theme = THEMES[currentUser]

  // 当天 / 当人 / 当馆动作（已合并 AI 导入的自定义计划）
  const dayExercises = useMemo(
    () => buildDayExercises(currentUser, currentDay, venueMode, customPlan),
    [currentUser, currentDay, venueMode, customPlan]
  )

  const totalDeckCards = dayExercises.length > 0 ? dayExercises.length + 1 : 1
  const safeCardIdx = Math.min(activeCardIdx, totalDeckCards - 1)

  // ── V2.6 单步防抖锁：一次上下滑严格只翻 1 张；休息倒计时期间锁定翻牌 ──
  const isFlippingRef = useRef(false)
  const touchHandledRef = useRef(false)

  const handleFlipCard = useCallback(
    (direction) => {
      if (dayExercises.length === 0) return
      if (isResting) return // 组间休息中禁止翻牌（大键已提示“翻牌已锁”）
      if (isFlippingRef.current) return // 320ms 冷却，杜绝跳卡
      isFlippingRef.current = true
      setActiveCardIdx((prev) => {
        if (direction === 'next') return (prev + 1) % totalDeckCards
        return (prev - 1 + totalDeckCards) % totalDeckCards
      })
      setTimeout(() => {
        isFlippingRef.current = false
      }, 320)
    },
    [dayExercises.length, totalDeckCards, isResting]
  )

  const stageTouchRef = useRef({ x: 0, y: 0 })

  const handleStageTouchStart = (e) => {
    stageTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    touchHandledRef.current = false
  }

  const handleStageTouchEnd = (e) => {
    if (touchHandledRef.current) return // 单次 Touch 周期只处理一次
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

  const handleSaveCustomConfig = (exerciseId, venue, configObj) => {
    setCustomConfigs({ ...saveCustomExerciseConfig(exerciseId, venue, configObj) })
  }

  const handleResetToACSMPlan = (exerciseId, venue) => {
    setCustomConfigs({ ...resetCustomExerciseConfig(exerciseId, venue) })
  }

  const handleSaveUpgradeAck = (ackKey, decision) => {
    setUpgradeAckMap({ ...saveUpgradeAck(ackKey, decision) })
  }

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

  // 头像与计划
  const handleSaveAvatar = (userKey, dataUrl) => setCustomAvatars({ ...saveCustomAvatar(userKey, dataUrl) })
  const handleResetAvatar = (userKey) => setCustomAvatars({ ...resetCustomAvatar(userKey) })
  const handleImportPlan = (parsed) => {
    const res = importCustomPlan(parsed)
    setCustomPlan(res.plan)
    return res
  }
  const handleResetPlan = () => setCustomPlan(resetCustomPlan())

  const todayCardio = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const log = logs.find(
      (l) =>
        l.date === today && l.user === currentUser && l.day === currentDay && l.venueMode === venueMode
    )
    return log?.cardioSummary || null
  }, [logs, currentUser, currentDay, venueMode])

  const todayStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayLog = logs.find(
      (l) =>
        l.date === today && l.user === currentUser && l.day === currentDay && l.venueMode === venueMode
    )
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
  }, [logs, currentUser, currentDay, venueMode, dayExercises])

  /** 三色状态灯：未开始(灰) / 进行中(琥珀) / 已完成(翠绿) */
  const cardCompletion = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayLog = logs.find(
      (l) =>
        l.date === today && l.user === currentUser && l.day === currentDay && l.venueMode === venueMode
    )
    return dayExercises.map((ex) => {
      const rec = todayLog?.exercises?.find((e) => e.exerciseId === ex.id)
      const total = ex.prescription?.sets || 0
      const done = (rec?.sets || []).filter((s) => s.completed).length
      if (total > 0 && done >= total) return 'done'
      if (done > 0) return 'partial'
      return 'todo'
    })
  }, [logs, currentUser, currentDay, venueMode, dayExercises])

  const currentExercise = dayExercises[safeCardIdx]
  const currentScopedKey = currentExercise
    ? getVenueExerciseKey(currentExercise.id, venueMode)
    : ''

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
        {dayExercises.length > 0 ? (
          <div className="w-full h-full max-w-md flex items-center gap-1.5">
            <div className="flex-1 h-full min-w-0">
              {safeCardIdx < dayExercises.length ? (
                <ExerciseCard
                  key={`${currentUser}_${currentDay}_${venueMode}_${currentExercise.id}`}
                  exercise={currentExercise}
                  venueMode={venueMode}
                  smartData={getSmartPrescription(
                    currentExercise,
                    venueMode,
                    logs,
                    customConfigs[currentScopedKey],
                    upgradeAckMap
                  )}
                  customConfig={customConfigs[currentScopedKey]}
                  seatMemory={seatMemory[currentScopedKey]}
                  theme={theme}
                  cardIndex={safeCardIdx}
                  totalExerciseCards={dayExercises.length}
                  upgradeAckMap={upgradeAckMap}
                  onRestStateChange={setIsResting}
                  onSaveUpgradeAck={handleSaveUpgradeAck}
                  onSaveSeatMemory={(exId, text) => {
                    const next = {
                      ...seatMemory,
                      [getVenueExerciseKey(exId, venueMode)]: text,
                    }
                    setSeatMemory(next)
                    localStorage.setItem('acsm2026_seat_memory_v25', JSON.stringify(next))
                  }}
                  onSaveCustomConfig={handleSaveCustomConfig}
                  onResetToACSMPlan={handleResetToACSMPlan}
                  onUpdateSetData={handleUpdateSetData}
                  onFlipCard={handleFlipCard}
                />
              ) : (
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
              {Array.from({ length: totalDeckCards }).map((_, idx) => {
                const state = idx === dayExercises.length ? 'finale' : cardCompletion[idx] || 'todo'
                const isActive = idx === safeCardIdx
                const dotClass =
                  state === 'done'
                    ? 'bg-emerald-400 h-5 w-1.5'
                    : state === 'partial'
                    ? 'bg-amber-400 h-5 w-1.5 animate-pulse'
                    : isActive
                    ? theme.dotActive
                    : theme.dotInactive
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveCardIdx(idx)}
                    className={`rounded-full transition-all duration-300 ${dotClass}`}
                    title={
                      idx === dayExercises.length
                        ? '完赛尾卡'
                        : `动作 #${idx + 1}（${
                            state === 'done' ? '已完成' : state === 'partial' ? '进行中' : '未开始'
                          }）`
                    }
                  />
                )
              })}
            </div>
          </div>
        ) : (
          <div className="w-full h-full max-w-md">
            <CardioPanel
              currentDay={currentDay}
              currentUser={currentUser}
              venueMode={venueMode}
              theme={theme}
              cycleNumber={cycleMeta.cycleNumber}
              savedCardio={todayCardio}
              onSave={handleSaveCardio}
            />
          </div>
        )}
      </main>

      {/* 统计抽屉 */}
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

      {/* 训练计划导入 & 自定义头像中心 */}
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
