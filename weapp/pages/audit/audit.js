import { buildDayExercises, flattenDayExercises } from '../../utils/planData.js'
import { get } from '../../utils/store.js'
import { getCurrentUser } from '../../utils/members.js'

/** ACSM 2026：重点肌群单周期有效组数 ≥ 10 组 */
const TARGET = {
  quads: 10,
  glutes_hams: 10,
  delts: 10,
  back: 10,
  chest: 10,
  arms: 10,
}

const LABEL = {
  quads: '股四头肌前链',
  glutes_hams: '臀大肌与后链',
  delts: '三角肌（中后束）',
  back: '背阔肌与上背',
  chest: '胸大肌',
  arms: '手臂（二三头）',
}

Page({
  data: {
    rows: [],
    summary: '',
    user: 'leo',
  },

  onShow() {
    this.compute()
  },

  compute() {
    const user = getCurrentUser()
    const logs = get('logs', [])
    const agg = {}

    for (const log of logs.filter((l) => l.user === user)) {
      let dayEx = []
      try {
        dayEx = buildDayExercises(user, log.day, log.venueMode || 'newGym', null)
      } catch (e) {
        continue
      }
      // 超级组展开为独立条目后再统计（与清算卡口径一致）
      const flat = flattenDayExercises(dayEx, log.venueMode || 'newGym')
      for (const ex of flat) {
        const rec = (log.exercises || []).find((e) => e.exerciseId === ex.id)
        const done = (rec?.sets || []).filter((s) => s.completed).length
        const mg = ex.muscleGroup || 'other'
        agg[mg] = (agg[mg] || 0) + done
      }
    }

    const rows = Object.keys(TARGET).map((k) => {
      const done = agg[k] || 0
      const target = TARGET[k]
      return {
        key: k,
        label: LABEL[k] || k,
        done,
        target,
        ok: done >= target,
        pct: Math.min(100, Math.round((done / target) * 100)),
      }
    })

    const okCount = rows.filter((r) => r.ok).length
    this.setData({
      user,
      rows,
      summary: `${user}：${okCount}/${rows.length} 个重点肌群达标（ACSM 2026 单周期 ≥10 组）`,
    })
  },

  goBack() {
    wx.navigateBack()
  },
})
