import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Flame, Heart, Moon, Pause, Play, RotateCcw, Wind } from 'lucide-react'
import { DAY_META } from '../data/seedPlanData'
import SwipeNumberControl from './SwipeNumberControl'
import { vibrate } from '../utils/soundAndWakeLock'

const SPRINT_SEC = 240
const RECOVERY_SEC = 180
const ROUNDS = 4

const ZONE2_TAGS = ['👃全程鼻呼吸轻松', '🦵冲刷昨日下肢酸痛', '😮‍💨略有吃力但可控']
const HIIT_TAGS = ['⚡双腿轻盈正常', '⚠️腿部酸痛需降量']
const REST_TAGS = ['😴睡满 8 小时', '🍚碳水补充到位', '🧘拉伸放松完毕']

function mmss(s) {
  const m = String(Math.floor(s / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return `${m}:${sec}`
}

/** 单屏大卡片外壳 */
function Shell({ theme, title, icon, children }) {
  return (
    <div className={`flex flex-col h-full min-h-0 rounded-3xl border p-3 ${theme.cardBg}`}>
      <div className="shrink-0 flex items-center gap-2 text-[13px] font-extrabold">
        {icon}
        {title}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar mt-2.5">{children}</div>
    </div>
  )
}

/** 已打卡徽章 */
function DoneBadge({ theme, text }) {
  return (
    <div
      className={`rounded-2xl border p-2.5 text-[11px] flex items-center gap-1.5 ${theme.subCardBg}`}
    >
      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
      <span>{text}</span>
    </div>
  )
}

/** 底部保存大键 */
function SaveBigBar({ theme, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full py-3 rounded-2xl font-extrabold text-sm bg-gradient-to-r ${theme.accentPrimary} active:scale-[0.99] transition`}
    >
      {label}
    </button>
  )
}

/** 体感标签行 */
function TagRow({ theme, options, value, onToggle }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onToggle(t)}
          className={`px-2 py-1 rounded-full text-[10px] font-medium border transition ${
            value.includes(t) ? theme.accentBadge : 'opacity-60 border-white/10'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] opacity-70 mb-1">{label}</div>
      {children}
    </div>
  )
}

/* ─────────────── Day 2 · Zone 2 洗刷日 ─────────────── */
function Zone2Panel({ theme, savedCardio, onSave }) {
  const d = savedCardio || {}
  const [duration, setDuration] = useState(d.durationMinutes || 35)
  const [avgHr, setAvgHr] = useState(d.avgHeartRate || 120)
  const [tags, setTags] = useState(d.tags || [])

  const inZone = avgHr >= 110 && avgHr <= 130
  const toggleTag = (t) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  return (
    <Shell theme={theme} title="Zone 2 主动恢复" icon={<Heart size={16} />}>
      <div className="space-y-2.5">
        {savedCardio?.completed && (
          <DoneBadge
            theme={theme}
            text={`今日已打卡 · ${savedCardio.durationMinutes} 分钟 / 平均 ${savedCardio.avgHeartRate} bpm${savedCardio.savedAt ? ` · ${savedCardio.savedAt}` : ''}`}
          />
        )}

        <div className="grid grid-cols-2 gap-2">
          <Field label="持续时长（分钟）">
            <SwipeNumberControl
              value={duration}
              onChange={setDuration}
              step={5}
              min={5}
              max={180}
              unit="分"
              theme={theme}
            />
          </Field>
          <Field label="平均心率（目标 110–130）">
            <SwipeNumberControl
              value={avgHr}
              onChange={setAvgHr}
              step={1}
              min={60}
              max={200}
              unit="bpm"
              theme={theme}
            />
          </Field>
        </div>

        <div
          className={`rounded-2xl p-2.5 text-[11px] leading-relaxed ${
            inZone ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
          }`}
        >
          {inZone
            ? '✅ 心率落在 Zone 2 黄金区间，脂肪供能 + 代谢清除最优。'
            : '⚠️ 偏离 Zone 2（110–130 bpm），调到「能说话但不能唱歌」的强度。'}
        </div>

        <Field label="体感标签">
          <TagRow theme={theme} options={ZONE2_TAGS} value={tags} onToggle={toggleTag} />
        </Field>

        <SaveBigBar
          theme={theme}
          label="💾 保存 Zone 2 打卡"
          onClick={() =>
            onSave({ type: 'zone2', durationMinutes: duration, avgHeartRate: avgHr, tags })
          }
        />
      </div>
    </Shell>
  )
}

/* ─────────────── Day 6 · 4×4 HIIT 绞肉机日 ─────────────── */
function HiitPanel({ theme, savedCardio, onSave }) {
  const d = savedCardio || {}
  const phases = useMemo(() => {
    const arr = []
    for (let i = 0; i < ROUNDS; i++) {
      arr.push({ type: 'sprint', round: i + 1, sec: SPRINT_SEC })
      if (i < ROUNDS - 1) arr.push({ type: 'recovery', round: i + 1, sec: RECOVERY_SEC })
    }
    return arr
  }, [])

  const timerRef = useRef({ phaseIdx: 0, remaining: SPRINT_SEC })
  const [, setTick] = useState(0)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)

  const [rounds, setRounds] = useState(d.roundsCompleted || 4)
  const [peakHr, setPeakHr] = useState(d.peakHeartRate || 165)
  const [recoveryHr, setRecoveryHr] = useState(d.recoveryHeartRate || 118)
  const [tags, setTags] = useState(d.tags || [])

  const phase = phases[timerRef.current.phaseIdx]
  const isSprint = phase?.type === 'sprint'

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const t = timerRef.current
      if (t.remaining > 1) {
        t.remaining -= 1
      } else if (t.phaseIdx >= phases.length - 1) {
        setRunning(false)
        setFinished(true)
        vibrate([200, 100, 200])
        setTick((x) => x + 1)
        return
      } else {
        t.phaseIdx += 1
        t.remaining = phases[t.phaseIdx].sec
        vibrate([120, 60, 120])
      }
      setTick((x) => x + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [running, phases])

  const reset = () => {
    timerRef.current = { phaseIdx: 0, remaining: SPRINT_SEC }
    setFinished(false)
    setRunning(false)
    setTick((x) => x + 1)
  }

  const toggleTag = (t) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  return (
    <Shell theme={theme} title="绞肉机日 · 4×4 HIIT" icon={<Flame size={16} />}>
      <div className="space-y-2.5">
        {savedCardio?.completed && (
          <DoneBadge
            theme={theme}
            text={`今日已打卡 · ${savedCardio.roundsCompleted} 轮 / 峰值 ${savedCardio.peakHeartRate} bpm${savedCardio.savedAt ? ` · ${savedCardio.savedAt}` : ''}`}
          />
        )}

        {/* 间歇计时器 */}
        <div
          className={`rounded-2xl p-4 text-center border ${
            finished
              ? 'bg-emerald-600/20 border-emerald-500/50'
              : isSprint
              ? 'bg-rose-600/20 border-rose-500/50'
              : 'bg-emerald-600/20 border-emerald-500/50'
          }`}
        >
          {finished ? (
            <>
              <div className="text-[13px] font-extrabold">🔥 4×4 HIIT 完成</div>
              <div className="text-[10px] opacity-70 mt-1">记录峰值心率与恢复体感后打卡</div>
            </>
          ) : (
            <>
              <div className="text-[11px] font-semibold mb-1">
                {isSprint ? '🔴 冲刺（目标 160–170+ bpm）' : '🟢 恢复慢走（<120 bpm）'}
              </div>
              <div className="text-5xl font-extrabold tabular-nums leading-none">
                {mmss(timerRef.current.remaining)}
              </div>
              <div className="text-[10px] opacity-70 mt-1.5">
                第 {phase?.round} / {ROUNDS} 轮 · {isSprint ? '全力冲刺' : '主动恢复'}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className={`flex-1 py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 bg-gradient-to-r ${theme.accentPrimary}`}
          >
            {running ? <Pause size={15} /> : <Play size={15} />} {running ? '暂停' : '开始'}
          </button>
          <button
            type="button"
            onClick={reset}
            className={`px-3.5 py-2.5 rounded-2xl border font-bold ${theme.subCardBg}`}
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* 打卡数据 */}
        <div className="grid grid-cols-3 gap-2">
          <Field label="完成轮数">
            <SwipeNumberControl value={rounds} onChange={setRounds} step={1} min={1} max={4} unit="轮" theme={theme} />
          </Field>
          <Field label="冲刺峰值">
            <SwipeNumberControl value={peakHr} onChange={setPeakHr} step={1} min={100} max={220} unit="bpm" theme={theme} />
          </Field>
          <Field label="恢复期">
            <SwipeNumberControl value={recoveryHr} onChange={setRecoveryHr} step={1} min={60} max={200} unit="bpm" theme={theme} />
          </Field>
        </div>

        <Field label="恢复预算预警（次日腿部酸痛需降量）">
          <TagRow theme={theme} options={HIIT_TAGS} value={tags} onToggle={toggleTag} />
        </Field>

        <div
          className={`flex items-center gap-1.5 text-[10px] opacity-70 rounded-xl border p-2 ${theme.subCardBg}`}
        >
          <Wind size={12} /> 4 分钟冲刺 + 3 分钟恢复 × 4 轮，峰值 160–170+ / 恢复 &lt;120
        </div>

        <SaveBigBar
          theme={theme}
          label="💾 保存 HIIT 战报"
          onClick={() =>
            onSave({
              type: 'hiit_4x4',
              roundsCompleted: rounds,
              peakHeartRate: peakHr,
              recoveryHeartRate: recoveryHr,
              tags,
            })
          }
        />
      </div>
    </Shell>
  )
}

/* ─────────────── Day 7 / 8 · 静息恢复日 ─────────────── */
function RestPanel({ theme, currentDay, cycleNumber, savedCardio, onSave }) {
  const [tags, setTags] = useState(savedCardio?.tags || [])
  const toggleTag = (t) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  const isFinalDay = currentDay === 8

  return (
    <Shell theme={theme} title={`静息日 · Day ${currentDay}`} icon={<Moon size={16} />}>
      <div className="h-full flex flex-col justify-between gap-2.5">
        <div className="space-y-2.5">
          <div className="text-center py-2">
            <div className="text-5xl">😴</div>
            <div className="text-[13px] font-extrabold mt-1">严禁摸铁 · 超量恢复日</div>
            <div className="text-[10px] opacity-70 mt-0.5">
              当前第 {cycleNumber} 轮微循环 · 好好吃饭睡够觉
            </div>
          </div>

          {savedCardio?.completed && (
            <DoneBadge
              theme={theme}
              text={`今日已打卡${savedCardio.advanceCycle ? ' · 已开启下一轮' : ''}${savedCardio.savedAt ? ` · ${savedCardio.savedAt}` : ''}`}
            />
          )}

          <Field label="恢复体感">
            <TagRow theme={theme} options={REST_TAGS} value={tags} onToggle={toggleTag} />
          </Field>
        </div>

        <div className="space-y-2">
          <SaveBigBar
            theme={theme}
            label="🔋 静息恢复打卡"
            onClick={() => onSave({ type: 'rest', cnsStatus: '中枢神经与肌糖原恢复', tags })}
          />
          {isFinalDay && (
            <button
              type="button"
              onClick={() =>
                onSave({
                  type: 'rest',
                  cnsStatus: '八天微循环完成，电量蓄满',
                  tags,
                  advanceCycle: true,
                })
              }
              className="w-full py-3 rounded-2xl font-extrabold text-sm border bg-amber-500/20 text-amber-200 border-amber-400/40 active:scale-[0.99] transition"
            >
              🎉 完成第 {cycleNumber} 轮微循环 · 开启第 {cycleNumber + 1} 轮
            </button>
          )}
        </div>
      </div>
    </Shell>
  )
}

export default function CardioPanel({
  currentDay,
  currentUser,
  venueMode,
  theme,
  cycleNumber,
  savedCardio,
  onSave,
}) {
  const meta = DAY_META.find((d) => d.day === currentDay)
  const type = meta?.type || 'rest'

  if (type === 'hiit')
    return <HiitPanel theme={theme} savedCardio={savedCardio} onSave={onSave} />
  if (type === 'zone2')
    return <Zone2Panel theme={theme} savedCardio={savedCardio} onSave={onSave} />
  return (
    <RestPanel
      theme={theme}
      currentDay={currentDay}
      cycleNumber={cycleNumber}
      savedCardio={savedCardio}
      onSave={onSave}
    />
  )
}
