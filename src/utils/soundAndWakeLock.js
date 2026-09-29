/**
 * V2.5 声音 / 震动 / 屏幕常亮锁
 * 供 GiantRestBar 巨型休息大键在计时结束时调用。
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
function tone(ctx, freq, startAt, duration, peak = 0.25) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, startAt)
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.linearRampToValueAtTime(peak, startAt + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startAt)
  osc.stop(startAt + duration + 0.05)
}

/** 休息结束：清脆三连升调提示音（A5 → C#6 → E6） */
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
 * V2.6 统一设备能力门面（供 GiantRestBar / SwipeNumberControl 调用）
 * 收敛音频初始化、提示音、震动与屏幕常亮，避免各组件重复处理兼容逻辑。
 */
export const gymDeviceManager = {
  /** 用户手势中初始化音频上下文（iOS 需在用户交互内触发） */
  initAudio() {
    ensureAudio()
  },
  /** 步进调节的轻提示音 + 微震动 */
  playTick() {
    playTick()
    vibrate(12)
  },
  /** 组间休息结束：三连升调响铃 + 脉冲震动 */
  playRestFinishedChime() {
    playTripleChime()
    vibrate([80, 60, 80, 60, 140])
  },
  requestWakeLock() {
    return requestWakeLock()
  },
  releaseWakeLock() {
    return releaseWakeLock()
  },
}
