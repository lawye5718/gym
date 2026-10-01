import {
  saveCustomAvatar,
  resetCustomAvatar,
  importCustomPlan,
  resetCustomPlan,
} from '../../utils/logs.js'
import { get } from '../../utils/store.js'
import { AI_PLAN_COMPILER_PROMPT } from '../../utils/aiPlanPrompt.js'

Page({
  data: {
    tab: 'plan', // plan | avatar
    jsonInput: '',
    msg: '',
    avatars: {},
    users: [
      { id: 'leo', name: 'Leo' },
      { id: 'linda', name: 'Linda' },
    ],
  },

  onShow() {
    this.setData({ avatars: get('custom_avatars', {}) || {} })
  },

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab })
  },

  // ---------- 计划导入 ----------
  onJsonInput(e) {
    this.setData({ jsonInput: e.detail.value })
  },

  /** 从聊天记录选择 JSON 文件 */
  pickJsonFile() {
    const fs = wx.getFileSystemManager()
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json', 'txt'],
      success: (res) => {
        try {
          const content = fs.readFileSync(res.tempFiles[0].path, 'utf8')
          this.setData({ jsonInput: String(content || '') })
        } catch (e) {
          this.setData({ msg: '文件读取失败，请改用粘贴方式' })
        }
      },
    })
  },

  applyPlan() {
    try {
      const cleaned = this.data.jsonInput
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/```$/i, '')
      const parsed = JSON.parse(cleaned)
      if (!parsed.exercises || !Array.isArray(parsed.exercises)) {
        throw new Error('缺少 exercises 数组字段')
      }
      const res = importCustomPlan(parsed)
      this.setData({
        msg: `✅ 导入成功！已应用${
          parsed.mode === 'patch' ? '局部修改' : '全量计划'
        }（共更新 ${res.updatedCount} 个动作卡片）`,
        jsonInput: '',
      })
      wx.showToast({ title: '导入成功', icon: 'success' })
    } catch (err) {
      this.setData({ msg: `❌ JSON 格式有误：${err.message}` })
    }
  },

  resetPlan() {
    wx.showModal({
      title: '恢复默认计划',
      content: '将清除所有自定义计划，回到内置 ACSM 2026 八天计划。',
      success: (r) => {
        if (r.confirm) {
          resetCustomPlan()
          this.setData({ msg: '已恢复内置 ACSM 2026 默认计划' })
          wx.showToast({ title: '已恢复', icon: 'success' })
        }
      },
    })
  },

  copyPrompt() {
    wx.setClipboardData({
      data: AI_PLAN_COMPILER_PROMPT,
      success: () => {
        this.setData({ msg: 'AI Prompt 已复制，发给任意 AI 即可生成可导入的 JSON' })
        wx.showToast({ title: '已复制', icon: 'success' })
      },
    })
  },

  // ---------- 头像 ----------
  chooseAvatar(e) {
    const key = e.currentTarget.dataset.id
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const temp = res.tempFiles?.[0]?.tempFilePath
        if (!temp) return
        // 压缩到 256 宽，避免 base64 过大撑爆 storage
        wx.compressImage({
          src: temp,
          quality: 80,
          compressedWidth: 256,
          success: (c) => {
            try {
              const fs = wx.getFileSystemManager()
              const b64 = fs.readFileSync(c.tempFilePath, 'base64')
              const all = saveCustomAvatar(key, `data:image/jpeg;base64,${b64}`)
              this.setData({ avatars: all, msg: `${key === 'leo' ? 'Leo' : 'Linda'} 头像已更新` })
              wx.showToast({ title: '头像已更新', icon: 'success' })
            } catch (err) {
              this.setData({ msg: '图片处理失败：' + err.message })
            }
          },
          fail: () => this.setData({ msg: '图片压缩失败，请重试' }),
        })
      },
    })
  },

  resetAvatar(e) {
    const key = e.currentTarget.dataset.id
    const all = resetCustomAvatar(key)
    this.setData({ avatars: all, msg: `${key} 头像已恢复默认` })
  },

  goBack() {
    wx.navigateBack()
  },
})
