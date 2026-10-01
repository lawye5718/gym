/**
 * members.js —— 身份与权限架构（V1.0 小程序版）
 *
 * 角色设计：
 *   · leo   = 管理员（admin）：默认永久可用，可邀请 / 审核 / 激活 / 撤销其他成员
 *   · linda = 成员（member）：需管理员授权后可用
 *
 * 授权三条路径（任选其一即可得到使用权）：
 *   ① 管理员直接激活：Leo 在「成员管理」页对 Linda 点「直接激活」（等同审核通过）
 *   ② 邀请码激活：Leo 生成邀请码 → 通过微信发给 Linda → Linda 输入即可激活
 *   ③ 官方体验成员：Leo 在微信公众平台「成员管理」添加 Linda 为体验成员，
 *      Linda 扫体验版二维码打开小程序后，再由 Leo 在应用内激活（或输入邀请码）
 *
 * 说明：当前版本为纯本地存储（无自建后端），因此授权状态保存在本机；
 *      管理员身份由 ADMIN_ID 常量锁定，不会因清缓存而把 Leo 锁在门外。
 */
import { get, set } from './store.js'

export const ADMIN_ID = 'leo'

export const ROLE_LABEL = {
  leo: '管理员',
  linda: '成员',
}

export const MEMBER_PROFILES = {
  leo: { id: 'leo', name: 'Leo', role: 'admin', theme: 'cool', desc: '55 岁 · 关节长寿与向心变慢即停' },
  linda: { id: 'linda', name: 'Linda', role: 'member', theme: 'warm', desc: '死手护腕模式 · 零腰椎代偿' },
}

const DEFAULT_MEMBERS = {
  leo: { status: 'approved', role: 'admin', approvedBy: 'system', at: 0 },
  linda: { status: 'pending', role: 'member', approvedBy: null, at: 0 },
}

export function getMembers() {
  const m = get('members', null)
  if (!m) {
    set('members', DEFAULT_MEMBERS)
    return { ...DEFAULT_MEMBERS }
  }
  // 管理员恒定可用，防止历史数据异常把 Leo 锁在外面
  return { ...m, [ADMIN_ID]: { ...(m[ADMIN_ID] || {}), status: 'approved', role: 'admin' } }
}

export function isAdmin(memberId) {
  return memberId === ADMIN_ID
}

/** 是否已获授权（可正常使用打卡） */
export function isAuthorized(memberId) {
  if (!memberId) return false
  if (isAdmin(memberId)) return true
  const m = getMembers()
  return m[memberId]?.status === 'approved'
}

/**
 * 邀请码签名：只有内置了同一 SEED 的管理员端才能生成/校验，
 * 避免「随便拼一个 GMT-LINDA-XXXX」就能自助激活。
 */
const APP_SEED = 'acsm2026-leo-admin-v1'

function sign(memberId) {
  const s = `${String(memberId).toLowerCase()}:${APP_SEED}`
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return (h % 1679616).toString(36).toUpperCase().padStart(4, '0').slice(0, 4)
}

/** 管理员：生成邀请码（确定性签名，格式 GMT-<ID>-<4位>） */
export function genInviteCode(memberId) {
  return `GMT-${String(memberId).toUpperCase()}-${sign(memberId)}`
}

/** 管理员：直接激活某成员（等同审核通过） */
export function approveByAdmin(memberId, adminId = ADMIN_ID) {
  if (!isAdmin(adminId)) return { ok: false, msg: '只有管理员可以审核成员' }
  const m = getMembers()
  m[memberId] = {
    ...(m[memberId] || {}),
    status: 'approved',
    role: m[memberId]?.role || 'member',
    approvedBy: adminId,
    at: Date.now(),
  }
  set('members', m)
  return { ok: true, msg: `${memberId} 已激活` }
}

/** 成员：用邀请码自助激活；管理员也可代填 */
export function activateByCode(memberId, code) {
  if (isAdmin(memberId)) return { ok: true, msg: '管理员无需激活' }

  // 必须与管理员端生成的签名邀请码完全一致
  const c = String(code || '').trim().toUpperCase()
  if (c !== genInviteCode(memberId)) {
    return { ok: false, msg: '邀请码无效或与身份不匹配，请联系管理员（Leo）获取邀请码' }
  }

  const m = getMembers()
  m[memberId] = {
    ...(m[memberId] || {}),
    status: 'approved',
    role: 'member',
    approvedBy: 'invite',
    at: Date.now(),
  }
  set('members', m)
  return { ok: true, msg: `${memberId} 已通过邀请码激活` }
}

/** 管理员：撤销成员使用权 */
export function revoke(memberId, adminId = ADMIN_ID) {
  if (!isAdmin(adminId)) return { ok: false, msg: '只有管理员可以撤销' }
  if (isAdmin(memberId)) return { ok: false, msg: '管理员不可被撤销' }
  const m = getMembers()
  m[memberId] = { ...(m[memberId] || {}), status: 'pending', approvedBy: null, at: 0 }
  set('members', m)
  return { ok: true, msg: `${memberId} 已撤销` }
}

/** 当前登录身份（本地保存） */
export function getCurrentUser() {
  return get('current_user', ADMIN_ID)
}

export function setCurrentUser(id) {
  set('current_user', id)
}
