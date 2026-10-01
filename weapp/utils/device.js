/**
 * device.js —— 设备能力适配层（替代 Web 版 soundAndWakeLock）
 *
 * Web 版用 Web Audio 合成三音阶金属提示音；小程序无法实时合成音频，
 * 因此改为「节奏震动 + 可选音频文件」方案：
 *   - 若配置了 alarmSrc（音频文件/远程地址），用 InnerAudioContext 循环播放
 *   - 无论是否有音频，都以 1.6s 周期的节奏震动保证一定能被感知
 */
let alarmTimer = null
let autoStopTimer = null
let audioCtx = null

/** 短震动 */
export function vibrate(ms = 30) {
  try {
    wx.vibrateShort({ type: 'medium' })
  } catch (e) {
    try {
      wx.vibrateLong()
    } catch (e2) {}
  }
}

/** 节奏震动序列 */
export function vibratePattern(pattern = [30, 60, 30]) {
  let delay = 0
  pattern.forEach((p, i) => {
    setTimeout(() => {
      if (i % 2 === 0) vibrate(p)
    }, delay)
    delay += (p || 50) + 80
  })
}

export function initAudio() {
  try {
    if (!audioCtx && wx.createInnerAudioContext) {
      audioCtx = wx.createInnerAudioContext()
      audioCtx.loop = true
    }
  } catch (e) {}
}

/**
 * 启动 10 秒可中断响铃：循环震动 +（可选）音频
 * @param {Function} onAutoStop 10 秒超时回调（自动停止并推进）
 * @param {number} seconds 响铃最长时长
 * @param {string} alarmSrc 可选，音频地址
 */
export function startContinuousAlarm(onAutoStop, seconds = 10, alarmSrc = '') {
  stopContinuousAlarm()
  vibratePattern([250, 100, 250, 100, 350])

  if (alarmSrc) {
    try {
      initAudio()
      if (audioCtx) {
        audioCtx.src = alarmSrc
        audioCtx.play()
      }
    } catch (e) {}
  }

  // 每 1.6 秒循环一次节奏震动
  alarmTimer = setInterval(() => {
    vibratePattern([250, 100, 250, 100, 350])
  }, 1600)

  // 最长 10 秒自动停止并推进
  autoStopTimer = setTimeout(() => {
    stopContinuousAlarm()
    if (typeof onAutoStop === 'function') onAutoStop()
  }, seconds * 1000)
}

export function stopContinuousAlarm() {
  if (alarmTimer) {
    clearInterval(alarmTimer)
    alarmTimer = null
  }
  if (autoStopTimer) {
    clearTimeout(autoStopTimer)
    autoStopTimer = null
  }
  try {
    if (audioCtx) audioCtx.stop()
  } catch (e) {}
}

/** 保持屏幕常亮（训练过程中） */
export function keepScreenOn(on = true) {
  try {
    wx.setKeepScreenOn({ keepScreenOn: !!on })
  } catch (e) {}
}

/** 轻提示音（完成一组） */
export function playTick() {
  vibrate(40)
}
