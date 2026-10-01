/**
 * store.js —— 存储适配层
 * Web 版用 localStorage，小程序改用 wx.setStorageSync。
 * key 前缀沿用 acsm2026_*，保证与 Web 版数据结构一致，便于日后双向同步。
 */
const PREFIX = 'acsm2026_'

export function get(key, def = null) {
  try {
    const v = wx.getStorageSync(PREFIX + key)
    return v === '' || v === undefined || v === null ? def : v
  } catch (e) {
    return def
  }
}

export function set(key, val) {
  try {
    wx.setStorageSync(PREFIX + key, val)
    return true
  } catch (e) {
    return false
  }
}

export function remove(key) {
  try {
    wx.removeStorageSync(PREFIX + key)
  } catch (e) {}
}

/** 读取全部状态（与 Web 版 loadAllState 对齐） */
export function loadAllState() {
  return {
    logs: get('logs', []),
    seatMemory: get('seat_memory', {}),
    customConfigs: get('custom_configs', {}),
    cycleMeta: get('cycle_meta', { cycleNumber: 1, extraRestDayInserted: false }),
    customAvatars: get('custom_avatars', {}),
    members: get('members', null),
    upgradeAckMap: get('upgrade_ack', {}),
  }
}
