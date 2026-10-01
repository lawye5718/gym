import { useEffect, useRef, useState } from 'react'
import { BellRing, CheckCircle2, Plus, RotateCcw, SkipForward, Timer } from 'lucide-react'
import { gymDeviceManager } from '../utils/soundAndWakeLock'

/**
 * V2.7 巨型休息横条
 * ① 绝对时间戳倒计时（锁屏/切后台不丢秒）
 * ② 倒计时归零进入 alarm_ringing：长达 10 秒循环金属响铃 + 震动
 * ③ 响铃期间全屏呼吸遮罩：点击屏幕任意区域立即静音并自动推进下一组
 * ④ 10 秒内未操作则自动静音并推进
 * ⑤ 保留 V2.6 修复：设置卡/要领卡为覆盖层时不卸载本组件，跨卡顶部仍显示实时提醒
 */
export default function GiantRestBar({
  activeSetNo,
  totalSets,
  allSetsCompleted,
  restDurationSeconds,
  isOverlayOpen,
  theme,
  onStartSetComplete,
  onAdvanceNext,
  onUndoLastSet,
  onReturnToWorkoutFace,
  onRestStateChange,
}) {
  const [status, setStatus] = useState('idle') // idle | counting | alarm_ringing
  const [secondsLeft, setSecondsLeft] = useState(restDurationSeconds)
  const endTimeRef = useRef(null)
  const timerRef = useRef(null)

  const isLocked = status === 'counting' || status === 'alarm_ringing'

  // 通知父组件：倒计时/响铃期间锁定上下翻牌
  useEffect(() => {
    onRestStateChange?.(isLocked)
  }, [isLocked, onRestStateChange])

  // 动作切换 / 休息时长变化时重置
  useEffect(() => {
    clearInterval(timerRef.current)
    gymDeviceManager.stopContinuousAlarm()
    endTimeRef.current = null
    setStatus('idle')
    setSecondsLeft(restDurationSeconds)
  }, [restDurationSeconds])

  // 停止响铃并推进下一项
  const handleStopAlarmAndAdvance = () => {
    gymDeviceManager.stopContinuousAlarm()
    clearInterval(timerRef.current)
    endTimeRef.current = null
    setStatus('idle')
    setSecondsLeft(restDurationSeconds)
    onAdvanceNext?.()
  }

  // 绝对时间戳高精度倒计时
  useEffect(() => {
    if (status !== 'counting') return

    const tick = () => {
      if (!endTimeRef.current) return
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000))
      setSecondsLeft(remaining)

      if (remaining <= 0) {
        clearInterval(timerRef.current)
        endTimeRef.current = null
        setStatus('alarm_ringing')
        // 启动长达 10s 的响铃；超时或点击屏幕则停止并自动推进
        gymDeviceManager.startContinuousAlarm(() => handleStopAlarmAndAdvance())
      }
    }

    timerRef.current = setInterval(tick, 200)

    // V2.9.1：移动端锁屏/切微信后 setInterval 会被系统降频休眠，
    // 因此切回前台瞬间主动按物理时间戳计算时间差并校正界面状态；
    // 若已超时，tick() 会立即补发震动与 10 秒响铃，杜绝响铃延后或错过。
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') tick()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    tick()

    return () => {
      clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // 组件卸载清理
  useEffect(
    () => () => {
      clearInterval(timerRef.current)
      gymDeviceManager.stopContinuousAlarm()
      gymDeviceManager.releaseWakeLock()
    },
    []
  )

  const handleStartRest = () => {
    if (allSetsCompleted) return
    gymDeviceManager.initAudio()
    gymDeviceManager.requestWakeLock()
    onStartSetComplete?.()
    endTimeRef.current = Date.now() + restDurationSeconds * 1000
    setSecondsLeft(restDurationSeconds)
    setStatus('counting')
  }

  const handleSkip = (e) => {
    if (e) e.stopPropagation()
    gymDeviceManager.playTick()
    handleStopAlarmAndAdvance()
  }

  const handleAdd15s = (e) => {
    if (e) e.stopPropagation()
    if (endTimeRef.current) {
      endTimeRef.current += 15000
      setSecondsLeft((s) => s + 15)
    }
  }

  const progressPct =
    status === 'counting'
      ? Math.max(0, Math.min(100, ((restDurationSeconds - secondsLeft) / restDurationSeconds) * 100))
      : 100

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
  }

  const nextSetNo = Math.min(totalSets, activeSetNo)

  return (
    <>
      {/* 响铃中：全屏轻触打断遮罩（最长 10s 自动推进） */}
      {status === 'alarm_ringing' && (
        <div
          onClick={handleStopAlarmAndAdvance}
          className="fixed inset-0 z-[100] bg-emerald-500/35 backdrop-blur-sm flex flex-col items-center justify-center p-6 cursor-pointer animate-pulse select-none"
        >
          <div className="bg-slate-950/95 border-2 border-emerald-400 p-6 rounded-3xl text-center shadow-2xl max-w-sm w-full">
            <BellRing className="w-14 h-14 text-emerald-400 mx-auto animate-bounce mb-3" />
            <div className="text-xl font-black text-white">🔔 组间休息结束！</div>
            <p className="text-xs text-emerald-300 font-semibold mt-1">
              轻触屏幕任意区域立即停止响铃，进入下一组
            </p>
            <div className="mt-4 px-3 py-1.5 rounded-xl bg-white/10 text-[11px] text-slate-300">
              ⏱️ 10 秒内未操作将自动进入
            </div>
          </div>
        </div>
      )}

      {/* 跨卡顶部提醒（用户正查看设置卡/要领卡时） */}
      {isOverlayOpen && isLocked && (
        <div
          onClick={() => {
            if (status === 'alarm_ringing') handleStopAlarmAndAdvance()
            else onReturnToWorkoutFace?.()
          }}
          className={`fixed top-3 inset-x-4 z-[70] rounded-2xl px-4 py-3 border-2 shadow-2xl flex items-center justify-between cursor-pointer ${
            status === 'alarm_ringing'
              ? 'bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400 text-slate-950 border-white animate-bounce'
              : 'bg-slate-950/95 border-cyan-400/70 text-white backdrop-blur-md'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {status === 'alarm_ringing' ? (
              <BellRing className="w-6 h-6 text-slate-950" />
            ) : (
              <Timer className="w-5 h-5 text-cyan-400 animate-spin" />
            )}
            <div className="text-left">
              <div className="text-xs font-black">
                {status === 'alarm_ringing'
                  ? `🔔 休息结束！该做第 #${nextSetNo} 组了！`
                  : `⏳ 组间休息倒计时：${formatTime(secondsLeft)}`}
              </div>
              <div className="text-[10px] opacity-80 font-semibold">
                {status === 'alarm_ringing'
                  ? '点击此横幅立即返回训练卡开练'
                  : '翻牌已锁定 · 可安心查看要领或设置'}
              </div>
            </div>
          </div>
          {status === 'counting' && (
            <button
              type="button"
              onClick={handleSkip}
              className="px-2.5 py-1 rounded-xl bg-white/15 text-[11px] font-bold text-amber-300"
            >
              跳过休息
            </button>
          )}
        </div>
      )}

      {/* 休息条主体 */}
      <div
        onClick={() => {
          if (status === 'idle' && !allSetsCompleted) handleStartRest()
        }}
        className={`relative w-full h-14 rounded-2xl overflow-hidden select-none transition-all duration-300 border-2 shadow-xl flex items-center justify-between px-3 ${
          status === 'alarm_ringing'
            ? 'bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400 text-slate-950 border-white animate-pulse'
            : status === 'counting'
            ? 'bg-slate-900/95 border-cyan-400/60 text-white shadow-cyan-950/50'
            : allSetsCompleted
            ? 'bg-emerald-600/25 border-emerald-400/50 text-emerald-200'
            : `bg-gradient-to-r ${theme.accentPrimary} border-white/25 cursor-pointer active:scale-[0.99]`
        }`}
      >
        {status === 'counting' && (
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/35 to-indigo-500/35 transition-all duration-300 ease-linear pointer-events-none"
            style={{ width: `${progressPct}%` }}
          />
        )}

        {/* 空闲：点击完成当前组并启动休息 */}
        {status === 'idle' && !allSetsCompleted && (
          <div className="relative z-10 w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Timer className="w-6 h-6" />
              <div className="text-left">
                <div className="text-sm font-black tracking-wide">
                  完成第 #{nextSetNo} 组 · 开始 {restDurationSeconds}s 休息
                </div>
                <div className="text-[10px] opacity-85 font-medium">
                  第 #{nextSetNo}/{totalSets} 组 · 结束将长响铃并自动进入下一组
                </div>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-black/25 text-xs font-black shrink-0">
              打卡休息 ➔
            </span>
          </div>
        )}

        {/* 全部完成 */}
        {status === 'idle' && allSetsCompleted && (
          <div className="relative z-10 w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div className="text-left">
                <div className="text-sm font-black">🎉 本动作 {totalSets} 组已全部达成！</div>
                <div className="text-[10px] opacity-80">向上滑动或查看清算卡</div>
              </div>
            </div>
            {onUndoLastSet && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onUndoLastSet()
                }}
                className="px-2.5 py-1 rounded-xl bg-white/10 text-[10px] font-bold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>撤销末组</span>
              </button>
            )}
          </div>
        )}

        {/* 倒计时中 */}
        {status === 'counting' && (
          <div className="relative z-10 w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="text-2xl font-black font-mono text-cyan-300 tracking-tighter shrink-0">
                {formatTime(secondsLeft)}
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs font-extrabold text-white truncate">
                  组间休息中 · 翻牌锁定
                </div>
                <div className="text-[10px] text-amber-300 font-medium truncate">
                  准备第 #{nextSetNo} 组（响铃长达 10s）
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleAdd15s}
                className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold flex items-center gap-0.5 active:scale-95"
              >
                <Plus className="w-3 h-3" />
                <span>15s</span>
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="px-2.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-[11px] font-black flex items-center gap-1 shadow active:scale-95"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>跳过进#{nextSetNo}组</span>
              </button>
            </div>
          </div>
        )}

        {/* 响铃中（横条同步提示） */}
        {status === 'alarm_ringing' && (
          <div className="relative z-10 w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BellRing className="w-6 h-6 animate-bounce text-slate-950" />
              <div className="text-left">
                <div className="text-sm font-black text-slate-950">
                  🔔 响铃中 · 即将进入第 #{nextSetNo} 组
                </div>
                <div className="text-[10px] font-bold text-slate-800">轻触屏幕任意处立即开练</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-slate-950 text-amber-300 text-xs font-black">
              开练 #{nextSetNo}
            </span>
          </div>
        )}
      </div>
    </>
  )
}
