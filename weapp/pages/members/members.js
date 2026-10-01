import {
  getMembers,
  isAdmin,
  genInviteCode,
  approveByAdmin,
  revoke,
  activateByCode,
  MEMBER_PROFILES,
  setCurrentUser,
  getCurrentUser,
} from '../../utils/members.js'

Page({
  data: {
    me: 'leo',
    isAdmin: true,
    profiles: [],
    inviteCode: '',
    inputCode: '',
    msg: '',
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const me = getCurrentUser()
    const members = getMembers()
    const profiles = Object.keys(MEMBER_PROFILES).map((k) => ({
      ...MEMBER_PROFILES[k],
      status: members[k]?.status || 'pending',
      approvedBy: members[k]?.approvedBy || '',
    }))
    this.setData({ me, isAdmin: isAdmin(me), profiles })
  },

  /** 管理员：生成邀请码 */
  genCode(e) {
    const id = e.currentTarget.dataset.id
    const code = genInviteCode(id)
    this.setData({
      inviteCode: code,
      msg: `已生成 ${id} 的邀请码，请通过微信发给本人`,
    })
  },

  copyCode() {
    if (!this.data.inviteCode) return
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    })
  },

  /** 管理员：直接激活（等同审核通过） */
  approve(e) {
    const id = e.currentTarget.dataset.id
    const res = approveByAdmin(id, this.data.me)
    this.setData({ msg: res.msg })
    this.refresh()
    wx.showToast({ title: res.ok ? '已激活' : res.msg, icon: res.ok ? 'success' : 'none' })
  },

  revokeMember(e) {
    const id = e.currentTarget.dataset.id
    const res = revoke(id, this.data.me)
    this.setData({ msg: res.msg })
    this.refresh()
  },

  onInput(e) {
    this.setData({ inputCode: e.detail.value })
  },

  /** 成员：输入邀请码自助激活 */
  submitCode() {
    const res = activateByCode(this.data.me, this.data.inputCode)
    this.setData({ msg: res.msg })
    this.refresh()
    wx.showToast({ title: res.ok ? '激活成功' : res.msg, icon: res.ok ? 'success' : 'none' })
  },

  switchMe(e) {
    const id = e.currentTarget.dataset.id
    setCurrentUser(id)
    this.refresh()
  },

  goBack() {
    wx.navigateBack()
  },
})
