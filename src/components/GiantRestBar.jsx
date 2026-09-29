import { useEffect, useRef, useState } from 'react'
import { BellRing, CheckCircle2, Plus, RotateCcw, SkipForward, Timer } from 'lucide-react'
import { gymDeviceManager } from '../utils/soundAndWakeLock'

/**
 * V2.6 彻底重构的「巨型休息横条」
 * ① 基于绝对时间戳（endTime = Date.now() + rest*1000）倒计时，手机锁屏/切后台不丢秒
 * ② 倒计时归零自动响铃震动并自动推进到下一组（无需手动关闭结束条）
 * ③ 移除易误触的滑动跳过，改为 [+15s] 与 [⏭️ 跳过进#X组] 实体按钮
 * ④ 用户查看「动作要领闪卡」或「设置背卡」时，屏幕顶部弹出跨卡实时提醒横幅
 * ⑤ 通过 onRestStateChange 通知父组件在倒计时期间锁定上下翻牌
 */
export default function GiantRestBar({
  activeSetNo, // 当前准备执行的组号（1-based）
  totalSets, // 本动作总组数
  allSetsCompleted, // 是否所有组均已完成
  restDurationSeconds, // 预设休息秒数
  isOverlayOpen, // 用户是否正打开「要领闪卡」或「设置背卡」
  theme,
  onStartSetComplete, // 点击大键 → 勾选完成当前组并开始休息
  onRestFinishedAutoNext, // 休息自然结束或跳过 → 自动聚焦下一组
  onUndoLastSet, // 撤销刚才误点的组
  onReturnToWorkoutFace, // 从设置卡/要领卡一键切回训练正面
  onRestStateChange, // (isResting: boolean) 通知父组件锁定/解锁翻牌
}) {
  const [status, setStatus] = useState('idle') // idle | counting | just_finished_toast
  const [secondsLeft, setSecondsLeft] = useState(restDurationSeconds)
  const endTimeRef = useRef(null)
  const timerRef = useRef(null)

  // 通知父组件：倒计时期间锁定上下翻牌
  useEffect(() => {
    onRestStateChange?.(status === 'counting')
  }, [status, onRestStateChange])

  // 动作切换 / 休息时长变化时重置
  useEffect(() => {
    clearInterval(timerRef.current)
    endTimeRef.current = null
    setStatus('idle')
    setSecondsLeft(restDurationSeconds)
  }, [restDurationSeconds])

  // 绝对时间戳高精度倒计时（250ms 轮询 + visibilitychange 校准）
  useEffect(() => {
    if (status !== 'counting') return

    const tick = () => {
      if (!endTimeRef.current) return
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000))
      setSecondsLeft(remaining)

      if (remaining <= 0) {
        clearInterval(timerRef.current)
        endTimeRef.current = null
        gymDeviceManager.playRestFinishedChime()
        setStatus('just_finished_toast')
        onRestFinishedAutoNext?.()
        setTimeout(() => {
          setStatus((curr) => (curr === 'just_finished_toast' ? 'idle' : curr))
          setSecondsLeft(restDurationSeconds)
        }, 3500)
      }
    }

    timerRef.current = setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    tick()

    return () => {
      clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [status, restDurationSeconds, onRestFinishedAutoNext])

  // 组件卸载清理
  useEffect(
    () => () => {
      clearInterval(timerRef.current)
      gymDeviceManager.releaseWakeLock()
    },
    []
  )

  const stopTimer = () => {
    clearInterval(timerRef.current)
    endTimeRef.current = null
  }

  const handleStartRest = () => {
    if (allSetsCompleted) return
    gymDeviceManager.initAudio()
    gymDeviceManager.requestWakeLock()
    onStartSetComplete?.()
    endTimeRef.current = Date.now() + restDurationSeconds * 1000
    setSecondsLeft(restDurationSeconds)
    setStatus('counting')
  }

  const handleSkipRest = (e) => {
    if (e) e.stopPropagation()
    stopTimer()
    setStatus('idle')
    setSecondsLeft(restDurationSeconds)
    gymDeviceManager.playTick()
    onRestFinishedAutoNext?.()
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
      ? Math.max(
          0,
          Math.min(100, ((restDurationSeconds - secondsLeft) / restDurationSeconds) * 100)
        )
      : 100

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
  }

  const nextSetNo = Math.min(totalSets, activeSetNo)

  return (
    <>
      {/* 跨卡全局顶层悬浮提醒：查看要领卡/设置卡时顶部置顶显示计时与到点提醒 */}
      {isOverlayOpen && (status === 'counting' || status === 'just_finished_toast') && (
        <div
          onClick={() => {
            if (status === 'just_finished_toast') setStatus('idle')
            onReturnToWorkoutFace?.()
          }}
          className={`fixed top-3 inset-x-4 z-[70] rounded-2xl px-4 py-3 border-2 shadow-2xl flex items-center justify-between cursor-pointer transition-all ${
            status === 'just_finished_toast'
              ? 'bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400 text-slate-950 border-white animate-bounce'
              : 'bg-slate-950/95 border-cyan-400/70 text-white backdrop-blur-md'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {status === 'just_finished_toast' ? (
              <BellRing className="w-6 h-6 text-slate-950" />
            ) : (
              <Timer className="w-5 h-5 text-cyan-400 animate-spin" />
            )}
            <div className="text-left">
              <div className="text-xs font-black">
                {status === 'just_finished_toast'
                  ? `🔔 休息结束！该做第 #${nextSetNo} 组了！`
                  : `⏳ 组间休息倒计时：${formatTime(secondsLeft)}`}
              </div>
              <div className="text-[10px] opacity-80 font-semibold">
                {status === 'just_finished_toast'
                  ? '点击此横幅立即返回训练卡开练'
                  : '翻牌已锁定 · 可安心查看要领或设置'}
              </div>
            </div>
          </div>
          {status === 'counting' && (
            <button
              type="button"
              onClick={handleSkipRest}
              className="px-2.5 py-1 rounded-xl bg-white/15 text-[11px] font-bold text-amber-300"
            >
              跳过休息
            </button>
          )}
        </div>
      )}

      {/* 卡片底部巨型横条大键主体 */}
      <div
        onClick={() => {
          if (status === 'idle' && !allSetsCompleted) handleStartRest()
          if (status === 'just_finished_toast') setStatus('idle')
        }}
        className={`relative w-full h-16 rounded-2xl overflow-hidden select-none transition-all duration-300 border-2 shadow-xl flex items-center justify-between px-4 ${
          status === 'just_finished_toast'
            ? 'bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400 text-slate-950 border-white animate-pulse shadow-emerald-400/50 cursor-pointer'
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

        {/* 状态 1：空闲（点击完成当前组并启动休息） */}
        {status === 'idle' && !allSetsCompleted && (
          <div className="relative z-10 w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Timer className="w-6 h-6" />
              <div className="text-left">
                <div className="text-sm font-black tracking-wide">
                  完成第 #{nextSetNo} 组 · 点击开始 {restDurationSeconds}s 休息
                </div>
                <div className="text-[10px] opacity-85 font-medium">
                  共 {totalSets} 组 · 休息结束将自动响铃并进入下一组
                </div>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-black/25 text-xs font-black shrink-0">
              打卡休息 ➔
            </span>
          </div>
        )}

        {/* 状态 1B：本卡全部组已完成 */}
        {status === 'idle' && allSetsCompleted && (
          <div className="relative z-10 w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div className="text-left">
                <div className="text-sm font-black">🎉 本卡 {totalSets} 组已全部完成！</div>
                <div className="text-[10px] opacity-80">请上下滑动屏幕进入下一张动作卡片</div>
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

        {/* 状态 2：倒计时中（锁定翻牌，实体 [+15s] 与 [跳过] 按钮） */}
        {status === 'counting' && (
          <div className="relative z-10 w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="text-2xl font-black font-mono text-cyan-300 tracking-tighter shrink-0">
                {formatTime(secondsLeft)}
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs font-extrabold text-white truncate">
                  休息中（翻牌已锁）· 准备第 #{nextSetNo} 组
                </div>
                <div className="text-[10px] text-amber-300 font-medium truncate">
                  可随时点右上角查看「动作要领」或「设置」
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
                onClick={handleSkipRest}
                className="px-2.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-[11px] font-black flex items-center gap-1 shadow active:scale-95"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>跳过进#{nextSetNo}组</span>
              </button>
            </div>
          </div>
        )}

        {/* 状态 3：休息结束响铃提醒（已自动进入下一组，3.5 秒后自动消退） */}
        {status === 'just_finished_toast' && (
          <div className="relative z-10 w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BellRing className="w-6 h-6 animate-bounce text-slate-950" />
              <div className="text-left">
                <div className="text-sm font-black text-slate-950">
                  🔔 休息结束！已自动进入第 #{nextSetNo} 组
                </div>
                <div className="text-[10px] font-bold text-slate-800">
                  请直接开练 · 练完第 #{nextSetNo} 组后再次点击此大键
                </div>
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
