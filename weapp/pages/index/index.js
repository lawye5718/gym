import {
  buildDayExercises,
  flattenDayExercises,
  DAY_META,
} from '../../utils/planData.js'
import {
  getSmartPrescription,
  getVenueExerciseKey,
  calculatePlatesPerSide,
} from '../../utils/engine.js'
import { loadAllState } from '../../utils/store.js'
import {
  saveExerciseSessionLog,
  saveCustomConfig,
  resetCustomConfig,
  saveSeatMemory,
  saveUpgradeAck,
  saveCardioOrRest,
  getTodayLog,
  getCustomPlan,
} from '../../utils/logs.js'
import {
  isAuthorized,
  isAdmin,
  getCurrentUser,
  setCurrentUser,
  MEMBER_PROFILES,
} from '../../utils/members.js'
import * as device from '../../utils/device.js'

const VENUES = [
  { id: 'newGym', name: '新馆' },
  { id: 'oldGym', name: '旧馆' },
  { id: 'home', name: '家庭' },
]

const QUICK_TAGS = [
  '⚡1.5s减速停(RIR2)',
  '🛑底部停1秒极稳',
  '🔥末组双起单下',
  '🧤死手模式零抓握',
]

Page({
  data: {
    user: 'leo',
    profile: null,
    isAdmin: true,
    authorized: true,
    venueMode: 'newGym',
    venues: VENUES,
    day: 1,
    dayName: '',
    dayFocus: '',
    deck: [],
    cardIdx: 0,
    summaryIdx: 0,
    finaleIdx: 0,
    currentExercise: null,
    activeVariant: null,
    sets: [],
    smartData: null,
    banner: null,
    plateHint: '',
    cardCompletion: [],
    dotTitle: '',
    status: 'idle', // idle | counting | ringing
    secondsLeft: 0,
    restTotal: 0,
    restLabel: '',
    tags: [],
    showTags: false,
    todayStats: { done: 0, total: 0, volume: 0 },
    flatExercises: [],
    hasPlan: false,
    // 动作要领浮层
    showCue: false,
    cueScale: 1,
    // 器械设置卡
    showSettings: false,
    settingsForm: { weight: '', sets: 3, repsText: '', restSeconds: 120, seatNote: '' },
    // 有氧 / 静息日
    cardioType: 'zone2',
    cardio: { duration: 35, avgHr: 120, tags: [], hiitRunning: false, phase: 'sprint', left: 240, round: 1 },
    cardioSaved: null,
    cardioTags: [],
  },

  // ---------- 生命周期 ----------
  onLoad() {
    this.refreshAuth()
    this.buildAll()
  },

  onShow() {
    this.refreshAuth()
    if (this.data.hasPlan) this.refreshPrefill()
  },

  onUnload() {
    device.stopContinuousAlarm()
    device.keepScreenOn(false)
  },

  onHide() {
    device.stopContinuousAlarm()
  },

  refreshAuth() {
    const user = getCurrentUser()
    const ok = isAuthorized(user)
    this.setData({
      user,
      authorized: ok,
      isAdmin: isAdmin(user),
      profile: MEMBER_PROFILES[user] || null,
    })
    if (!ok) {
      wx.showModal({
        title: '尚未获得使用权限',
        content: '请联系管理员 Leo 在「成员管理」中激活，或输入邀请码。',
        confirmText: '去激活',
        cancelText: '切换身份',
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: '/pages/members/members' })
        },
      })
    }
  },

  // ---------- 构建牌堆 ----------
  buildAll() {
    const st = loadAllState()
    this._state = st
    const { user, venueMode, day } = this.data
    const customPlan = getCustomPlan() // 支持导入的自定义计划
    const dayExercises = buildDayExercises(user, day, venueMode, customPlan)

    // 有氧 / 静息日类型与体感标签（与 Web 版 CardioPanel 一致）
    const cardioType = day === 6 ? 'hiit' : day === 7 ? 'rest' : 'zone2'
    const cardioTags =
      cardioType === 'hiit'
        ? ['⚡双腿轻盈正常', '⚠️腿部酸痛需降量']
        : cardioType === 'rest'
        ? ['😴睡满 8 小时', '🍚碳水补充到位', '🧘拉伸放松完毕']
        : ['👃全程鼻呼吸轻松', '🦵冲刷昨日下肢酸痛', '😮‍💨略有吃力但可控']
    const todayLog = getTodayLog({ user, day, venueMode })

    if (!dayExercises.length) {
      this.setData({
        hasPlan: false,
        deck: [],
        cardioType,
        cardioTags,
        cardioSaved: todayLog?.cardioSummary || null,
        cardio: {
          ...this.data.cardio,
          duration: todayLog?.cardioSummary?.durationMinutes || 35,
          avgHr: todayLog?.cardioSummary?.avgHeartRate || 120,
          tags: todayLog?.cardioSummary?.tags || [],
        },
      })
      return
    }

    const withPrefill = dayExercises.map((ex) => ({
      ...ex,
      prefillSets: getSmartPrescription(
        ex,
        venueMode,
        st.logs,
        st.customConfigs[getVenueExerciseKey(ex.id, venueMode)],
        st.upgradeAckMap
      ).prefillSets,
    }))

    const deck = [
      { type: 'welcome' },
      ...withPrefill.map((ex) => ({ type: 'exercise', data: ex })),
      { type: 'summary' },
      { type: 'finale' },
    ]

    const meta = (DAY_META || []).find((d) => d.day === day) || {}
    this.setData({
      hasPlan: true,
      deck,
      dayName: meta.title || '',
      dayFocus: meta.sub || '',
      summaryIdx: dayExercises.length + 1,
      finaleIdx: dayExercises.length + 2,
      flatExercises: flattenDayExercises(withPrefill, venueMode),
    })
    this.refreshCompletion()
    this.applyCard()
  },

  refreshPrefill() {
    // 切换回页面时刷新统计
    this.refreshCompletion()
  },

  refreshCompletion() {
    const { user, venueMode, day } = this.data
    const log = getTodayLog({ user, day, venueMode })
    const deck = this.data.deck
    const completion = []
    let done = 0
    let total = 0
    let volume = 0
    for (const c of deck) {
      if (c.type !== 'exercise') continue
      const rec = log?.exercises?.find((e) => e.exerciseId === c.data.id)
      const t = c.data.prescription?.sets || 0
      const d = (rec?.sets || []).filter((s) => s.completed).length
      completion.push(t > 0 && d >= t ? 'done' : d > 0 ? 'partial' : 'todo')
      total += t
      done += d
      ;(rec?.sets || []).forEach((s) => {
        if (s.completed) volume += (Number(s.weight) || 0) * (Number(s.reps) || 0)
      })
    }
    this.setData({ cardCompletion: completion, todayStats: { done, total, volume: Math.round(volume) } })
  },

  /** 根据当前卡片索引装载数据 */
  applyCard() {
    const idx = Math.min(this.data.cardIdx, (this.data.deck.length || 1) - 1)
    const card = this.data.deck[idx]
    if (!card) return

    if (card.type === 'exercise') {
      const ex = card.data
      const st = this._state || loadAllState()
      const key = getVenueExerciseKey(ex.id, this.data.venueMode)
      const smart = getSmartPrescription(
        ex,
        this.data.venueMode,
        st.logs,
        st.customConfigs[key],
        st.upgradeAckMap
      )
      const log = getTodayLog({ user: this.data.user, day: this.data.day, venueMode: this.data.venueMode })
      const rec = log?.exercises?.find((e) => e.exerciseId === ex.id)
      const sets = rec?.sets?.length ? rec.sets : smart.prefillSets || []
      const v = ex.variants?.[this.data.venueMode] || ex.variants?.newGym || {}
      const activeWeight = Number(sets.find((s) => !s.completed)?.weight || sets[0]?.weight) || 0
      this.setData({
        cardIdx: idx,
        currentExercise: ex,
        activeVariant: v,
        sets,
        smartData: smart,
        banner: smart.overloadBanner,
        tags: rec?.quickTags || [],
        plateHint:
          v.isPlateLoaded && activeWeight > 0 ? calculatePlatesPerSide(activeWeight / 2) : '',
        restTotal: st.customConfigs[key]?.restSeconds || ex.prescription?.restSeconds || 120,
        restLabel: '',
        status: 'idle',
      })
      device.keepScreenOn(true)
    } else {
      this.setData({ cardIdx: idx, currentExercise: null, status: 'idle' })
    }
  },

  // ---------- 翻牌 ----------
  flip(direction) {
    if (this.data.status !== 'idle') return // 休息/响铃中锁定
    const total = this.data.deck.length
    if (!total) return
    const next = direction === 'next' ? (this.data.cardIdx + 1) % total : (this.data.cardIdx - 1 + total) % total
    this.setData({ cardIdx: next })
    this.applyCard()
  },

  onTouchStart(e) {
    this._touch = e.touches[0]
  },

  onTouchEnd(e) {
    const t = e.changedTouches?.[0]
    if (!t || !this._touch) return
    const dy = t.clientY - this._touch.clientY
    const dx = t.clientX - this._touch.clientX
    if (Math.abs(dy) > 45 && Math.abs(dy) > Math.abs(dx) * 1.2) {
      this.flip(dy < 0 ? 'next' : 'prev')
    } else if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const d = this.data.day
      const nd = dx < 0 ? (d % 8) + 1 : ((d - 2 + 8) % 8) + 1
      this.setData({ day: nd, cardIdx: 0 })
      this.buildAll()
    }
  },

  goCard(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    if (this.data.status !== 'idle') return
    this.setData({ cardIdx: idx })
    this.applyCard()
  },

  // ---------- 打卡 ----------
  onWeightChange(e) {
    const i = Number(e.currentTarget.dataset.idx)
    const val = Number(e.detail.value) || 0
    const sets = this.data.sets.map((s, k) =>
      k === i ? { ...s, weight: val } : k > i && !s.completed ? { ...s, weight: val } : s
    )
    this.commitSets(sets)
  },

  onRepsChange(e) {
    const i = Number(e.currentTarget.dataset.idx)
    const val = Math.max(1, Number(e.detail.value) || 1)
    const sets = this.data.sets.map((s, k) => (k === i ? { ...s, reps: val } : s))
    this.commitSets(sets)
  },

  toggleSetDone(e) {
    const i = Number(e.currentTarget.dataset.idx)
    const sets = this.data.sets.map((s, k) => (k === i ? { ...s, completed: !s.completed } : s))
    this.commitSets(sets)
    device.playTick()
  },

  commitSets(sets) {
    const ex = this.data.currentExercise
    if (!ex) return
    this.setData({ sets })
    const logs = saveExerciseSessionLog({
      user: this.data.user,
      day: this.data.day,
      venueMode: this.data.venueMode,
      exerciseId: ex.id,
      sets,
      quickTags: this.data.tags,
    })
    this._state.logs = logs
    this.refreshCompletion()
  },

  toggleTagPanel() {
    this.setData({ showTags: !this.data.showTags })
  },

  tapTag(e) {
    const tag = e.currentTarget.dataset.tag
    const has = this.data.tags.includes(tag)
    const tags = has ? this.data.tags.filter((t) => t !== tag) : [...this.data.tags, tag]
    this.setData({ tags })
    this.commitSets(this.data.sets)
  },

  // ---------- 休息计时（绝对时间戳，防后台降频） ----------
  startRest() {
    const sets = this.data.sets
    const first = sets.findIndex((s) => !s.completed)
    if (first === -1) return
    const next = sets.map((s, i) => (i === first ? { ...s, completed: true } : s))
    this.commitSets(next)

    device.keepScreenOn(true)
    this._endTime = Date.now() + this.data.restTotal * 1000
    this.setData({ status: 'counting', secondsLeft: this.data.restTotal })
    this._timer = setInterval(() => this.tick(), 200)
  },

  tick() {
    if (!this._endTime) return
    const left = Math.max(0, Math.ceil((this._endTime - Date.now()) / 1000))
    this.setData({ secondsLeft: left })
    if (left <= 0) {
      clearInterval(this._timer)
      this._endTime = null
      this.setData({ status: 'ringing' })
      device.startContinuousAlarm(() => this.stopAlarmAndAdvance(), 10)
    }
  },

  stopAlarmAndAdvance() {
    device.stopContinuousAlarm()
    clearInterval(this._timer)
    this._endTime = null
    this.setData({ status: 'idle', secondsLeft: this.data.restTotal })
    const remain = this.data.sets.some((s) => !s.completed)
    if (!remain) this.flip('next')
  },

  add15s() {
    if (this._endTime) {
      this._endTime += 15000
      this.setData({ secondsLeft: this.data.secondsLeft + 15 })
    }
  },

  undoLastSet() {
    let last = -1
    this.data.sets.forEach((s, i) => {
      if (s.completed) last = i
    })
    if (last < 0) return
    const sets = this.data.sets.map((s, i) => (i === last ? { ...s, completed: false } : s))
    this.commitSets(sets)
  },

  ackUpgrade(e) {
    const decision = e.currentTarget.dataset.decision
    const b = this.data.banner
    if (!b) return
    if (decision === 'accepted') {
      const sets = this.data.sets.map((s) =>
        s.completed ? s : { ...s, weight: b.recommendedWeight, reps: b.resetReps || s.reps }
      )
      this.commitSets(sets)
      saveCustomConfig(this.data.currentExercise.id, this.data.venueMode, {
        defaultWeight: b.recommendedWeight,
      })
    }
    saveUpgradeAck(b.ackKey, decision)
    this.setData({ banner: null })
  },

  saveSeat(e) {
    const text = e.detail.value
    const key = getVenueExerciseKey(this.data.currentExercise.id, this.data.venueMode)
    const all = saveSeatMemory(key, text)
    this._state.seatMemory = all
  },

  // ---------- 切换 ----------
  switchUser(e) {
    const id = e.currentTarget.dataset.id
    setCurrentUser(id)
    this.setData({ user: id, cardIdx: 0 })
    this.refreshAuth()
    this.buildAll()
  },

  switchVenue(e) {
    const v = e.currentTarget.dataset.id
    this.setData({ venueMode: v, cardIdx: 0 })
    this.buildAll()
  },

  goMembers() {
    wx.navigateTo({ url: '/pages/members/members' })
  },

  goAudit() {
    wx.navigateTo({ url: '/pages/audit/audit' })
  },

  finishWorkout() {
    this.setData({ cardIdx: this.data.finaleIdx })
    this.applyCard()
  },

  restart() {
    this.setData({ cardIdx: 0 })
    this.applyCard()
  },

  // ---------- ① 动作要领浮层 ----------
  openCue() {
    this.setData({ showCue: true, cueScale: 1 })
  },
  closeCue() {
    this.setData({ showCue: false })
  },
  zoomCue(e) {
    const d = Number(e.currentTarget.dataset.d || 0)
    const s = Math.min(2.5, Math.max(1, Number((this.data.cueScale + d).toFixed(2))))
    this.setData({ cueScale: s })
  },

  // ---------- ② 器械设置卡 ----------
  openSettings() {
    const ex = this.data.currentExercise
    if (!ex) return
    const key = getVenueExerciseKey(ex.id, this.data.venueMode)
    const cfg = (this._state.customConfigs || {})[key] || {}
    const v = ex.variants?.[this.data.venueMode] || ex.variants?.newGym || {}
    const p = ex.prescription || {}
    this.setData({
      showSettings: true,
      settingsForm: {
        weight: cfg.defaultWeight ?? v.defaultWeight ?? '',
        sets: cfg.sets || v.sets || p.sets || 3,
        repsText: (cfg.defaultRepsList || v.defaultRepsList || []).join(','),
        restSeconds: cfg.restSeconds || p.restSeconds || 120,
        seatNote: cfg.seatNote || '',
      },
    })
  },
  closeSettings() {
    this.setData({ showSettings: false })
  },
  onSettingInput(e) {
    const f = e.currentTarget.dataset.field
    this.setData({ [`settingsForm.${f}`]: e.detail.value })
  },
  saveSettings() {
    const ex = this.data.currentExercise
    const f = this.data.settingsForm
    const repsList = String(f.repsText)
      .split(/[,，\s]+/)
      .map((n) => Number(n))
      .filter((n) => !Number.isNaN(n) && n > 0)
    const finalSets = Number(f.sets) || ex.prescription.sets
    const minReps = (ex.prescription.repRange || [10])[0]
    const cfg = {
      defaultWeight: Number(f.weight) || 0,
      sets: finalSets,
      defaultRepsList: repsList.length
        ? repsList
        : Array.from({ length: finalSets }, () => minReps),
      restSeconds: Number(f.restSeconds) || ex.prescription.restSeconds,
      seatNote: f.seatNote,
    }
    const all = saveCustomConfig(ex.id, this.data.venueMode, cfg)
    this._state.customConfigs = all
    this.setData({ showSettings: false, restTotal: cfg.restSeconds })
    wx.showToast({ title: '已保存设置', icon: 'success' })
    this.applyCard()
  },
  resetSettings() {
    const ex = this.data.currentExercise
    const all = resetCustomConfig(ex.id, this.data.venueMode)
    this._state.customConfigs = all
    this.setData({ showSettings: false })
    wx.showToast({ title: '已恢复计划标准', icon: 'success' })
    this.applyCard()
  },

  // ---------- ③ 有氧 / 静息日面板 ----------
  onCardioInput(e) {
    const f = e.currentTarget.dataset.field
    this.setData({ [`cardio.${f}`]: Number(e.detail.value) || 0 })
  },
  toggleCardioTag(e) {
    const t = e.currentTarget.dataset.tag
    const tags = this.data.cardio.tags || []
    const next = tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]
    this.setData({ 'cardio.tags': next })
  },
  startHiit() {
    // 挪威 4x4：冲刺 4 分钟 / 恢复 3 分钟 × 4 轮
    this.setData({
      'cardio.hiitRunning': true,
      'cardio.phase': 'sprint',
      'cardio.left': 240,
      'cardio.round': 1,
    })
    this._hiit = setInterval(() => this.tickHiit(), 1000)
  },
  tickHiit() {
    const c = this.data.cardio
    const left = (c.left || 0) - 1
    if (left > 0) {
      this.setData({ 'cardio.left': left })
      return
    }
    if (c.phase === 'sprint') {
      if ((c.round || 1) >= 4) {
        this.stopHiit()
        return
      }
      this.setData({ 'cardio.phase': 'recovery', 'cardio.left': 180 })
      device.vibrate()
    } else {
      this.setData({
        'cardio.phase': 'sprint',
        'cardio.left': 240,
        'cardio.round': (c.round || 1) + 1,
      })
      device.vibrate()
    }
  },
  stopHiit() {
    clearInterval(this._hiit)
    this.setData({ 'cardio.hiitRunning': false })
    device.vibrate()
  },
  saveCardio() {
    const c = this.data.cardio
    const payload = {
      completed: true,
      durationMinutes: Number(c.duration) || 0,
      avgHeartRate: Number(c.avgHr) || 0,
      tags: c.tags || [],
      savedAt: new Date().toTimeString().slice(0, 5),
    }
    const { logs } = saveCardioOrRest({
      user: this.data.user,
      day: this.data.day,
      venueMode: this.data.venueMode,
      cardioData: payload,
    })
    this._state.logs = logs
    this.setData({ cardioSaved: payload })
    wx.showToast({ title: '已打卡 ✓', icon: 'success' })
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },
})
