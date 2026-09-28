import { useEffect, useMemo, useRef, useState } from 'react'
import { Heart, Play, Pause, RotateCcw, Save, Flame, Wind } from 'lucide-react'

const SPRINT_SEC = 240
const RECOVERY_SEC = 180
const ROUNDS = 4

function mmss(s) {
  const m = String(Math.floor(s / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return `${m}:${sec}`
}

/** Day 2 Zone 2 主动恢复打卡面板 */
function Zone2Panel({ existing, onSave }) {
  const d = existing?.exercises?.[0]?.details || {}
  const [duration, setDuration] = useState(d.durationMin || 40)
  const [avgHr, setAvgHr] = useState(d.avgHr || 120)

  const inZone = avgHr >= 110 && avgHr <= 130
  return (
    <div className="mt-2 rounded-2xl bg-ink-800 border border-slate-700 p-4 space-y-4">
      <div className="flex items-center gap-2 text-sky-300 font-bold">
        <Heart size={18} /> Zone 2 主动恢复 · 目标 110–130 bpm
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="bg-ink-900 rounded-xl border border-slate-700 p-3">
          <div className="text-[10px] text-slate-400 mb-1">时长（分钟）</div>
          <input
            type="number"
            value={duration}
            min={5}
            onChange={(e) => setDuration(Math.max(5, Number(e.target.value)))}
            className="w-full bg-transparent text-2xl font-extrabold text-white focus:outline-none"
          />
        </label>
        <label className="bg-ink-900 rounded-xl border border-slate-700 p-3">
          <div className="text-[10px] text-slate-400 mb-1">平均心率</div>
          <input
            type="number"
            value={avgHr}
            onChange={(e) => setAvgHr(Number(e.target.value))}
            className={`w-full bg-transparent text-2xl font-extrabold focus:outline-none ${
              inZone ? 'text-emerald-400' : 'text-amber-400'
            }`}
          />
        </label>
      </div>

      <div
        className={`text-[11px] text-center py-2 rounded-lg ${
          inZone ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
        }`}
      >
        {inZone ? '✅ 心率落在 Zone 2 黄金区间，脂肪供能 + 代谢清除最优' : '⚠️ 偏离 Zone 2，调至「能说话不能唱歌」的强度'}
      </div>

      <button
        onClick={() => onSave({ durationMin: duration, avgHr })}
        className="w-full py-3 rounded-2xl bg-sky-600 active:bg-sky-500 text-white font-bold text-sm flex items-center justify-center gap-2"
      >
        <Save size={16} /> 打卡 Zone 2
      </button>
    </div>
  )
}

/** Day 6 4×4 HIIT 交互式间歇计时器 */
function HiitPanel({ existing, onSave }) {
  const d = existing?.exercises?.[0]?.details || {}
  const phases = useMemo(() => {
    const arr = []
    for (let i = 0; i < ROUNDS; i++) {
      arr.push({ type: 'sprint', round: i + 1, sec: SPRINT_SEC })
      if (i < ROUNDS - 1) arr.push({ type: 'recovery', round: i + 1, sec: RECOVERY_SEC })
    }
    return arr
  }, [])

  const timerRef = useRef({ phaseIdx: 0, remaining: SPRINT_SEC })
  const [tick, setTick] = useState(0)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [hrInput, setHrInput] = useState('')
  const [soreness, setSoreness] = useState(d.soreness ?? '')
  const peakHrsRef = useRef([...(d.peakHrs || [])])
  const [peakHrs, setPeakHrs] = useState(peakHrsRef.current)
  const hrInputRef = useRef('')
  hrInputRef.current = hrInput

  const phase = phases[timerRef.current.phaseIdx]
  const isSprint = phase?.type === 'sprint'

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const t = timerRef.current
      if (t.remaining > 1) {
        t.remaining -= 1
      } else {
        if (t.phaseIdx >= phases.length - 1) {
          t.running = false
          setRunning(false)
          setFinished(true)
          setTick((x) => x + 1)
          return
        }
        if (phases[t.phaseIdx].type === 'sprint') {
          peakHrsRef.current.push(Number(hrInputRef.current) || 0)
          setPeakHrs([...peakHrsRef.current])
        }
        t.phaseIdx += 1
        t.remaining = phases[t.phaseIdx].sec
        try {
          navigator.vibrate?.([200, 100, 200])
        } catch {}
      }
      setTick((x) => x + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [running, phases])

  const reset = () => {
    timerRef.current = { phaseIdx: 0, remaining: SPRINT_SEC }
    peakHrsRef.current = []
    setPeakHrs([])
    setHrInput('')
    setFinished(false)
    setRunning(false)
    setTick((x) => x + 1)
  }

  if (finished) {
    return (
      <div className="mt-2 rounded-2xl bg-ink-800 border border-slate-700 p-4 space-y-3">
        <div className="flex items-center gap-2 text-rose-300 font-bold">
          <Flame size={18} /> 4×4 HIIT 完成 🔥
        </div>
        <div className="space-y-1.5">
          {peakHrs.map((hr, i) => (
            <div key={i} className="flex justify-between text-xs text-slate-300 bg-ink-900 rounded-lg px-3 py-1.5">
              <span>第 {i + 1} 轮峰值心率</span>
              <span className="font-bold text-rose-300">{hr || '—'} bpm</span>
            </div>
          ))}
        </div>
        <label className="block bg-ink-900 rounded-xl border border-slate-700 p-3">
          <div className="text-[10px] text-slate-400 mb-1">次日晨起腿部酸痛度（1–10）</div>
          <input
            type="number"
            min={1}
            max={10}
            value={soreness}
            onChange={(e) => setSoreness(Math.min(10, Math.max(1, Number(e.target.value))))}
            className="w-full bg-transparent text-2xl font-extrabold text-white focus:outline-none"
          />
        </label>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="flex-1 py-3 rounded-2xl bg-ink-700 active:bg-ink-600 text-slate-200 font-bold text-sm flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} /> 重来
          </button>
          <button
            onClick={() => onSave({ peakHrs, soreness })}
            className="flex-1 py-3 rounded-2xl bg-rose-600 active:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2"
          >
            <Save size={16} /> 保存战报
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2 rounded-2xl bg-ink-800 border border-slate-700 p-4 space-y-4">
      <div className="flex items-center gap-2 text-rose-300 font-bold">
        <Flame size={18} /> 绞肉机日 · 4×4 HIIT
      </div>

      <div
        className={`rounded-2xl p-5 text-center transition-colors ${
          isSprint ? 'bg-rose-600/20 border border-rose-500/50' : 'bg-emerald-600/20 border border-emerald-500/50'
        }`}
      >
        <div className="text-xs font-semibold tracking-widest mb-1">
          {isSprint ? '🔴 冲刺（目标 160–170+ bpm）' : '🟢 恢复慢走（<120 bpm）'}
        </div>
        <div className="text-6xl font-extrabold tabular-nums text-white leading-none">
          {mmss(timerRef.current.remaining)}
        </div>
        <div className="text-[11px] text-slate-300 mt-2">
          第 {phase?.round} / {ROUNDS} 轮 · {isSprint ? '全力冲刺' : '主动恢复'}
        </div>
      </div>

      {isSprint && (
        <label className="block bg-ink-900 rounded-xl border border-slate-700 p-3">
          <div className="text-[10px] text-slate-400 mb-1">当前心率（冲刺末手动填入峰值）</div>
          <input
            type="number"
            inputMode="numeric"
            value={hrInput}
            onChange={(e) => setHrInput(e.target.value)}
            placeholder="如 168"
            className="w-full bg-transparent text-2xl font-extrabold text-rose-300 focus:outline-none"
          />
        </label>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className={`flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 text-white ${
            running ? 'bg-amber-600 active:bg-amber-500' : 'bg-rose-600 active:bg-rose-500'
          }`}
        >
          {running ? <Pause size={16} /> : <Play size={16} />} {running ? '暂停' : '开始'}
        </button>
        <button
          onClick={reset}
          className="px-4 py-3 rounded-2xl bg-ink-700 active:bg-ink-600 text-slate-200 font-bold text-sm flex items-center justify-center"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1.5 justify-center text-[10px] text-slate-500">
        <Wind size={12} /> 4 分钟冲刺 + 3 分钟恢复 × 4 轮，跑完记录峰值心率与次日酸痛
      </div>
    </div>
  )
}

export default function CardioPanel({ user, day, dayType, logs, onSave, onToast }) {
  const existing = useMemo(() => {
    const matched = (logs || []).filter((l) => l.user === user && l.day === day)
    return matched.sort((a, b) => (a.date < b.date ? 1 : -1))[0]
  }, [logs, user, day])

  if (dayType === 'hiit') return <HiitPanel existing={existing} onSave={onSave} />
  return <Zone2Panel existing={existing} onSave={onSave} />
}
