/**
 * V2.7 声音 / 震动 / 屏幕常亮统一门面
 * 新增：可中断的 10 秒长响铃引擎（三音阶循环金属提示音 + 节奏马达震动）
 */

let audioCtx = null

function ensureAudio() {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      audioCtx = new AC()
    }
    if (audioCtx.state === 'suspended') audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

/** 播放单个音符 */
function tone(ctx, freq, startAt, duration, peak = 0.25, type = 'sine') {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, startAt)
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.linearRampToValueAtTime(peak, startAt + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startAt)
  osc.stop(startAt + duration + 0.05)
}

/** 休息结束：清脆三连升调提示音 */
export function playTripleChime() {
  const ctx = ensureAudio()
  if (!ctx) return
  const now = ctx.currentTime
  const freqs = [880, 1108.73, 1318.51]
  freqs.forEach((f, i) => tone(ctx, f, now + i * 0.16, 0.35, 0.28))
}

/** 打卡确认：单声短促清脆音 */
export function playTick() {
  const ctx = ensureAudio()
  if (!ctx) return
  tone(ctx, 1046.5, ctx.currentTime, 0.12, 0.2)
}

/** 手机脉冲震动（不支持时静默忽略） */
export function vibrate(pattern = [30, 60, 30]) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern)
  } catch {
    /* 不支持震动则忽略 */
  }
}

let wakeLockSentinel = null

/** 请求屏幕常亮（防止组间休息时手机息屏） */
export async function requestWakeLock() {
  try {
    if (!('wakeLock' in navigator)) return false
    if (!wakeLockSentinel) {
      wakeLockSentinel = await navigator.wakeLock.request('screen')
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null
      })
    }
    return true
  } catch {
    return false
  }
}

/** 释放屏幕常亮 */
export async function releaseWakeLock() {
  try {
    if (wakeLockSentinel) {
      await wakeLockSentinel.release()
      wakeLockSentinel = null
    }
  } catch {
    /* 忽略释放失败 */
  }
}

/**
 * V2.7 可中断的连续响铃管理器
 * 休息结束时播放长达 10 秒的循环三连金属琶音（C5→E5→G5）并伴随节奏震动；
 * 用户点击屏幕任意位置可立即停止，10 秒超时亦自动停止并推进。
 */
class SoundAndWakeManager {
  constructor() {
    this.audioCtx = null
    this.wakeLock = null
    this.ringingTimer = null
    this.isRinging = false
  }

  initAudio() {
    this.audioCtx = ensureAudio()
  }

  /** 播放单节清脆升调金属提示音 */
  _playSingleChimeNote(freq, startTime, duration = 0.35) {
    const ctx = this.audioCtx || ensureAudio()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, startTime)
    gain.gain.setValueAtTime(0.001, startTime)
    gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(startTime)
    osc.stop(startTime + duration)
  }

  /** 启动长达 10 秒的可中断循环提示音（每 1.6 秒循环一次三连音 + 震动） */
  startContinuousAlarm(onAutoStop) {
    this.initAudio()
    this.stopContinuousAlarm() // 确保单例
    this.isRinging = true

    const playLoop = () => {
      if (!this.isRinging) return
      vibrate([250, 100, 250, 100, 350])
      const ctx = this.audioCtx || ensureAudio()
      if (!ctx) return
      if (ctx.state === 'suspended') ctx.resume()
      const now = ctx.currentTime
      this._playSingleChimeNote(523.25, now)
      this._playSingleChimeNote(659.25, now + 0.14)
      this._playSingleChimeNote(783.99, now + 0.28)
    }

    playLoop()
    const intervalId = setInterval(playLoop, 1600)

    // 最长 10 秒自动停止
    const timeoutId = setTimeout(() => {
      this.stopContinuousAlarm()
      if (onAutoStop) onAutoStop()
    }, 10000)

    this.ringingTimer = { intervalId, timeoutId }
  }

  /** 停止响铃（点击屏幕任意位置或 10s 超时时调用） */
  stopContinuousAlarm() {
    this.isRinging = false
    if (this.ringingTimer) {
      clearInterval(this.ringingTimer.intervalId)
      clearTimeout(this.ringingTimer.timeoutId)
      this.ringingTimer = null
    }
  }

  playTick() {
    playTick()
    vibrate(12)
  }

  playRestFinishedChime() {
    playTripleChime()
    vibrate([80, 60, 80, 60, 140])
  }

  requestWakeLock() {
    return requestWakeLock()
  }

  releaseWakeLock() {
    return releaseWakeLock()
  }
}

export const gymDeviceManager = new SoundAndWakeManager()
