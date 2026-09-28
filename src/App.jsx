import { useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { PLAN_LIBRARY, DAY_META } from './data/seedPlanData'
import { loadState, saveState, upsertDayLog, saveEquipment } from './utils/storageSync'
import { getSmartPrescription } from './utils/overloadEngine'
import HeaderSwitcher from './components/HeaderSwitcher'
import DaySwiper from './components/DaySwiper'
import ExerciseCard from './components/ExerciseCard'
import CardioPanel from './components/CardioPanel'
import AnalyticsModal from './components/AnalyticsModal'
import RestTimerFloat from './components/RestTimerFloat'

const NON_STRENGTH_COPY = {
  rest: { emoji: '⚪', title: '静息日 · 超量恢复', body: '严禁摸铁！让中枢神经与肌糖原彻底恢复，明天才能炸得更狠。' },
}

export default function App() {
  const [state, setState] = useState(() => loadState())
  const [user, setUser] = useState('leo')
  const [venueMode, setVenueMode] = useState('newGym')
  const [currentDay, setCurrentDay] = useState(1)
  const [drafts, setDrafts] = useState({}) // exerciseId -> { sets, quickTags }
  const [timer, setTimer] = useState(null)
  const [toast, setToast] = useState(null)
  const [showAnalytics, setShowAnalytics] = useState(false)

  // 左右滑动切换 Day 1~8
  const touchX = useRef(0)
  const touchY = useRef(0)
  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX
    touchY.current = e.touches[0].clientY
  }
  const onTouchEnd = (e) => {
    const t = e.changedTouches[0]
    const dx = t.clientX - touchX.current
    const dy = t.clientY - touchY.current
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    if (e.target.closest('input,button,textarea,[data-no-swipe]')) return
    setCurrentDay((d) => (dx < 0 ? Math.min(8, d + 1) : Math.max(1, d - 1)))
  }

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(id)
  }, [toast])

  const todayMeta = DAY_META.find((d) => d.day === currentDay)
  const todaysExercises = useMemo(
    () => PLAN_LIBRARY.filter((e) => e.user === user && e.day === currentDay),
    [user, currentDay]
  )

  const restInserted = !!state.restDaysInserted?.[user]

  const persist = (next) => {
    const saved = saveState(next)
    setState(saved)
    return saved
  }

  const handleUpdateSetData = (exerciseId, sets, quickTags) => {
    setDrafts((prev) => ({ ...prev, [exerciseId]: { sets, quickTags } }))
  }

  const handleSetComplete = (restSeconds, label) => {
    setTimer({ total: restSeconds, label, startedAt: Date.now() })
  }

  const handleSaveSeatMemory = (exerciseId, text) => {
    persist(saveEquipment(state, exerciseId, text))
  }

  const handleToggleRest = () => {
    persist({
      ...state,
      restDaysInserted: { ...(state.restDaysInserted || {}), [user]: !restInserted },
    })
  }

  const handleExtend = () => {
    setTimer((t) => (t ? { ...t, total: t.total + 30, startedAt: Date.now() } : t))
  }
  const handleClose = () => setTimer(null)
  const handleSkip = () => setTimer(null)

  const handleSaveDay = () => {
    const date = new Date().toISOString().slice(0, 10)
    const cycleNumber = Number(state.cycleOffset?.[user] || 0) + 1
    const exercises = todaysExercises.map((ex) => {
      const draft = drafts[ex.id]
      const prefill = getSmartPrescription(ex, state.workoutLogs).prefillSets
      return {
        exerciseId: ex.id,
        day5SourceId: ex.prescription.day5SourceId || null,
        sets: draft?.sets || prefill,
        quickTags: draft?.quickTags || [],
      }
    })
    const log = { user, day: currentDay, date, cycleNumber, exercises }
    persist(upsertDayLog(state, log))
    setDrafts({})
    setToast('今日战报已保存 ✓')
  }

  const handleSaveCardio = (details) => {
    const date = new Date().toISOString().slice(0, 10)
    const cycleNumber = Number(state.cycleOffset?.[user] || 0) + 1
    const exerciseId = todayMeta.type === 'hiit' ? 'cardio_hiit' : 'cardio_zone2'
    const log = {
      user,
      day: currentDay,
      date,
      cycleNumber,
      exercises: [{ exerciseId, type: todayMeta.type, details }],
    }
    persist(upsertDayLog(state, log))
    setToast('有氧打卡已保存 ✓')
  }

  const isStrength = todayMeta?.type === 'strength'

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-30">
        <HeaderSwitcher user={user} setUser={setUser} venueMode={venueMode} setVenueMode={setVenueMode} />
        <DaySwiper
          currentDay={currentDay}
          setCurrentDay={setCurrentDay}
          restInserted={restInserted}
          onToggleRest={handleToggleRest}
        />
      </header>

      <main
        className="flex-1 w-full max-w-md mx-auto px-3 pb-28"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="pt-3 pb-1 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white">{todayMeta?.title}</h2>
            <span className="text-[11px] text-slate-400">{todayMeta?.sub}</span>
          </div>
          <button
            onClick={() => setShowAnalytics(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-ink-700 border border-slate-700 text-slate-300 active:bg-ink-600 text-xs font-semibold"
          >
            <BarChart3 size={14} /> 统计
          </button>
        </div>

        {isStrength ? (
          todaysExercises.length ? (
            todaysExercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                venueMode={venueMode}
                smartData={getSmartPrescription(ex, state.workoutLogs)}
                seatMemory={state.equipmentSettings?.[ex.id]?.text}
                onSaveSeatMemory={handleSaveSeatMemory}
                onSetComplete={handleSetComplete}
                onUpdateSetData={handleUpdateSetData}
              />
            ))
          ) : (
            <p className="text-slate-400 text-sm py-10 text-center">该日暂无动作配置</p>
          )
        ) : todayMeta.type === 'rest' ? (
          <div className="mt-6 rounded-2xl bg-ink-800 border border-slate-700 p-5 text-center">
            <div className="text-4xl mb-2">{NON_STRENGTH_COPY.rest.emoji}</div>
            <div className="font-bold text-white text-base mb-1">{NON_STRENGTH_COPY.rest.title}</div>
            <p className="text-[12px] text-slate-300 leading-relaxed">{NON_STRENGTH_COPY.rest.body}</p>
          </div>
        ) : (
          <CardioPanel
            user={user}
            day={currentDay}
            dayType={todayMeta.type}
            logs={state.workoutLogs}
            onSave={handleSaveCardio}
            onToast={setToast}
          />
        )}

        {isStrength && (
          <button
            onClick={handleSaveDay}
            className="mt-4 w-full py-3 rounded-2xl bg-indigo-600 active:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30"
          >
            保存今日战报 💾
          </button>
        )}
      </main>

      {timer && (
        <RestTimerFloat timer={timer} onClose={handleClose} onExtend={handleExtend} onSkip={handleSkip} />
      )}

      {showAnalytics && (
        <AnalyticsModal
          state={state}
          user={user}
          onClose={() => setShowAnalytics(false)}
          onToast={setToast}
        />
      )}

      {toast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-emerald-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  )
}
