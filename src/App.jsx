import { useMemo, useRef, useState } from 'react'
import { THEMES } from './utils/themeConfig'
import { ALL_EXERCISES, DAY_META, getExercisesForDayAndVenue } from './data/seedPlanData'
import { getSmartPrescription, getVenueExerciseKey } from './utils/overloadEngine'
import {
  loadAllState,
  resetCustomExerciseConfig,
  saveCardioOrRestLog,
  saveCustomExerciseConfig,
  saveExerciseSessionLog,
} from './utils/storageSync'
import HeaderSwitcher from './components/HeaderSwitcher'
import DaySwiper from './components/DaySwiper'
import ExerciseCard from './components/ExerciseCard'
import FinaleCard from './components/FinaleCard'
import CardioPanel from './components/CardioPanel'
import AnalyticsModal from './components/AnalyticsModal'

export default function App() {
  const initialState = useMemo(() => loadAllState(), [])
  const [logs, setLogs] = useState(initialState.logs)
  const [seatMemory, setSeatMemory] = useState(initialState.seatMemory)
  const [customConfigs, setCustomConfigs] = useState(initialState.customConfigs)
  const [cycleMeta, setCycleMeta] = useState(initialState.cycleMeta)

  const [currentUser, setCurrentUser] = useState('leo') // 'leo' | 'linda'
  const [venueMode, setVenueMode] = useState('newGym') // 'newGym' | 'oldGym' | 'home'
  const [currentDay, setCurrentDay] = useState(1) // 1 ~ 8
  const [activeCardIdx, setActiveCardIdx] = useState(0) // 当前扑克牌索引
  const [showAnalytics, setShowAnalytics] = useState(false)

  const theme = THEMES[currentUser]

  // 当天 / 当人 / 当馆的专属动作列表
  const dayExercises = useMemo(
    () => getExercisesForDayAndVenue(currentUser, currentDay, venueMode),
    [currentUser, currentDay, venueMode]
  )

  // 总牌数 = 当日动作卡 + 1 张完赛尾卡
  const totalDeckCards = dayExercises.length > 0 ? dayExercises.length + 1 : 1
  const safeCardIdx = Math.min(activeCardIdx, totalDeckCards - 1)

  // 上下滑翻牌循环（末尾完赛卡后再滑回到第 0 张）
  const handleFlipCard = (direction) => {
    if (dayExercises.length === 0) return
    setActiveCardIdx((prev) => {
      if (direction === 'next') return (prev + 1) % totalDeckCards
      return (prev - 1 + totalDeckCards) % totalDeckCards
    })
  }

  // 舞台手势：↕ 翻牌 / ↔ 切换 Day
  const stageTouchRef = useRef({ x: 0, y: 0 })

  const handleStageTouchStart = (e) => {
    stageTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const handleStageTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - stageTouchRef.current.x
    const dy = e.changedTouches[0].clientY - stageTouchRef.current.y

    if (Math.abs(dy) > 45 && Math.abs(dy) > Math.abs(dx) * 1.2) {
      handleFlipCard(dy < 0 ? 'next' : 'prev')
    } else if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
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
    const nextConfigs = saveCustomExerciseConfig(exerciseId, venue, configObj)
    setCustomConfigs({ ...nextConfigs })
  }

  const handleResetToACSMPlan = (exerciseId, venue) => {
    const nextConfigs = resetCustomExerciseConfig(exerciseId, venue)
    setCustomConfigs({ ...nextConfigs })
  }

  // 今日完成组数与总吨位（供完赛尾卡展示）
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayLog = logs.find(
      (l) =>
        l.date === today &&
        l.user === currentUser &&
        l.day === currentDay &&
        l.venueMode === venueMode
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

  // 当日有氧 / 静息打卡记录（回显给 CardioPanel）
  const todayCardio = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const log = logs.find(
      (l) =>
        l.date === today &&
        l.user === currentUser &&
        l.day === currentDay &&
        l.venueMode === venueMode
    )
    return log?.cardioSummary || null
  }, [logs, currentUser, currentDay, venueMode])

  // 有氧 / 静息日打卡落库（Day 8 勾选开启下一轮时自动推进周期）
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

  const currentExercise = dayExercises[safeCardIdx]
  const currentScopedKey = currentExercise
    ? getVenueExerciseKey(currentExercise.id, venueMode)
    : ''

  return (
    <div
      className={`h-[100dvh] w-screen overflow-hidden flex flex-col select-none transition-colors duration-500 ${theme.appBg}`}
    >
      {/* 1. 顶栏：双人切换 + 三馆切换 + 统计入口 */}
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
        onOpenAnalytics={() => setShowAnalytics(true)}
      />

      {/* 2. Day 1~8 胶囊条 + 弹性静息日 */}
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

      {/* 3. 中央单屏扑克牌主舞台 */}
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
                    customConfigs[currentScopedKey]
                  )}
                  customConfig={customConfigs[currentScopedKey]}
                  seatMemory={seatMemory[currentScopedKey]}
                  theme={theme}
                  cardIndex={safeCardIdx}
                  totalExerciseCards={dayExercises.length}
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
                  completedSetsCount={todayStats.completedSetsCount}
                  totalSetsCount={todayStats.totalSetsCount}
                  totalVolumeKg={todayStats.totalVolumeKg}
                  theme={theme}
                  onRestartFirstCard={() => setActiveCardIdx(0)}
                />
              )}
            </div>

            {/* 右侧竖向牌序指示器（点击跳牌） */}
            <div className="flex flex-col items-center justify-center gap-1.5 px-0.5">
              {Array.from({ length: totalDeckCards }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveCardIdx(idx)}
                  className={`rounded-full transition-all duration-300 ${
                    idx === safeCardIdx ? theme.dotActive : theme.dotInactive
                  }`}
                  title={idx === dayExercises.length ? '完赛尾卡' : `动作 #${idx + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          /* 有氧与静息日（Day 2 Zone2 / Day 6 4x4 HIIT / Day 7-8 静息）单屏大卡片 */
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

      {/* 4. 全卡片化统计分析与历史检索抽屉 */}
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
    </div>
  )
}
