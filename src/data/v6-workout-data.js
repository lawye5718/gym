/**
 * v6-workout-data.js —— 8 天循环训练计划 V6（四维双目标版）规范数据
 *
 * 来源：`v3.0.pdf`（V6 四维体系规范）+《增肌 8 天循环训练计划 v3》表格
 * 四维目标：增肌 · 心肺/VO2 Max · 爆发力/防跌倒 · 骨密度/平衡
 *
 * 本模块只存放「系统层」数据（配置 / 红黄绿灯 / 备忘智库 / 铁律 / 阈值），
 * 逐日动作课表在 seedPlanData.js 中，二者共同构成 V6。
 */

export const V6_PLAN_CONFIG = {
  version: 'V6.0',
  cycleDays: 8,
  title: '8天循环训练计划 V6（增肌+防衰四维双目标版）',
  subtitle: '增肌 · 心肺 · 爆发力 · 骨密度平衡',
  dateRange: '2026-10-01 至 2026-11-25',
  weeks: 7,
  nonCompressibleRules: [
    'D6（4×4）到下一轮 D1（下肢A）之间必须满打满算休足 72 小时',
    'Zone 2 与 4×4 高强度有氧的前一天，绝对不能安排腿部力量训练',
    '力量日首个复合主项前，必须执行包含 5 分钟平衡与步态的完整热身',
    '4×4 HIIT 每循环必须执行满 1 次，即使进入减载周也不得剔除',
  ],
}

/** 四项不可压缩铁律（独立导出，便于备忘智库引用） */
export const V6_NON_COMPRESSIBLE = V6_PLAN_CONFIG.nonCompressibleRules

/** 三色状态灯定义（红灯替换主课表为主动恢复） */
export const V6_STATUS_LIGHTS = {
  green: {
    key: 'green',
    label: '绿灯 · 满血输出',
    short: '绿灯 (A方案)',
    dot: 'bg-emerald-400',
    ring: 'ring-emerald-400',
    text: 'text-emerald-300',
    card: 'bg-emerald-950/40 border-emerald-500/50',
    desc: '自由=器械等效 / 激活首项爆发向心',
    tip: '当前状态良好：力量主动作开放自由版切换，正式组前 2 次采用最大意图向心爆发（~1s），第 3 次起恢复常规速度。',
  },
  yellow: {
    key: 'yellow',
    label: '黄灯 · 保守器械',
    short: '黄灯 (保守)',
    dot: 'bg-amber-400',
    ring: 'ring-amber-400',
    text: 'text-amber-300',
    card: 'bg-amber-950/40 border-amber-500/50',
    desc: '锁死纯器械保护 / 跳过爆发意图匀速',
    tip: '疲劳警戒：系统已自动屏蔽自由重量切换，切回纯器械稳定轨道；取消爆发意图，全程控制离心，建议容量自动下调 1-2 组，保留次数 RPE 控制在 7-8。',
  },
  red: {
    key: 'red',
    label: '红灯 · 防衰休整',
    short: '红灯 (休整)',
    dot: 'bg-rose-400',
    ring: 'ring-rose-400',
    text: 'text-rose-300',
    card: 'bg-rose-950/40 border-rose-500/50',
    desc: '切换主动恢复 / 20-30分散步+拉伸',
    tip: '伤痛/极度疲劳阻断：严禁执行高负荷抗阻。主课表已替换为低心率主动恢复散步、筋膜放松与关节活动度训练。',
  },
}

/** 红灯主动恢复卡内容 */
export const V6_RECOVERY_ITEMS = [
  {
    key: 'walk',
    title: '低强度户外/跑步机散步',
    detail: '20-30 分钟 · 心率控制在 100 bpm 以下 · 能轻松交谈',
  },
  {
    key: 'stretch',
    title: '温和全身拉伸与泡沫轴放松',
    detail: '10-15 分钟 · 重点小腿腓肠肌、髂腰肌、胸大肌',
  },
]

export const V6_RECOVERY_NOTE =
  'ACSM 老年健康指引：在急性疼痛、发热、严重睡眠缺失或眩晕状态下进行大负荷抗阻，神经对稳定肌的支配能力骤降，损伤风险成倍增加。今日任务是促进血液回流与组织修复。'

/** 双重阈值铁律（解决加重失败无下限保护） */
export const V6_THRESHOLDS = [
  {
    category: '大肌群复合',
    items: '哈克深蹲、挂片倒蹬、腿屈伸、臀推、杠铃 RDL、挂片推胸、水平卧推、高位下拉、两台坐姿划船',
    repRange: '8-12 次',
    upgrade: '连续两次在次数上限完成、且 RPE 低于 8',
    regress: '加重后做不到「严格 2 秒离心」的 8 次，或动作出现向心借力、离心砸下，立即退回原重量',
  },
  {
    category: '伤肩风险动作',
    items: '坐姿推肩机、蝴蝶机夹胸、飞鸟机侧平举、飞鸟机俯身侧平举',
    repRange: '10-15 次',
    upgrade: '连续两次做到 15 次且 RPE 低于 8，才加 2.5%',
    regress: '加重后做不到 10 次，或出现耸肩、肩前移代偿，立即退回；小肌群宁可做满 15 次也不轻易加重',
  },
  {
    category: '手臂与小腿',
    items: '牧师凳弯举、龙门架三头下压、站姿提踵、倒蹬机提踵',
    repRange: '12-20 次',
    upgrade: '连续两次做到 20 次且 RPE 低于 8',
    regress: '加重后做不到 12 次，或出现甩臂、弹震式起落，退回原重量',
  },
]

export const V6_THRESHOLD_NOTE =
  '每次只动一个变量——先把次数加到区间上限，次数到顶才加重量 2.5-5%。杠铃 RDL 额外执行 RIR 2，任何时候都不做 RIR 0。加重后第一次训练必须主动放慢离心至 2 秒以上做动作检查，确认能稳住再恢复正常节奏。'

/** 爆发力向心意图（首复合动作，绿灯生效） */
export const V6_EXPLOSIVE_CUE = {
  title: '⚡ 爆发向心：前 2 次最快速度(~1s)',
  lockedTitle: '匀速向心 (黄灯跳过爆发)',
  detail:
    '每个力量日首个复合动作正式组前 2 次，以「最大意图最快速度（~1s）」向心推起/蹬起，离心仍保持 2-3 秒控制；第 3 次起恢复常规节奏。零额外加组与时间成本。',
}

/** V6 8 天课表元信息（含热身结构与时长校准） */
export const V6_DAY_META = [
  {
    day: 1,
    type: 'strength',
    title: '下肢 A',
    sub: '股四主导 + 臀',
    emoji: '🟢',
    duration: '73 分钟',
    focus: '自由 ⇋ 器械等效并列 · 首个复合动作爆发向心意图',
    warmup: {
      dynamicMin: 7,
      balanceMin: 5,
      balanceItems: [
        '单腿站立（可微扶墙，渐进脱手）：3 组 × 30 秒/侧',
        '足跟接足尖直线脚跟走（Tandem Gait）：2 组 × 10 步',
        '侧向重心跨步控制：2 组 × 10 步',
      ],
    },
  },
  {
    day: 2,
    type: 'strength',
    title: '上肢 A',
    sub: '推优先 + 背宽',
    emoji: '🔵',
    duration: '72 分钟',
    focus: '推胸复合爆发向心 · Linda 固定器械版',
    warmup: {
      dynamicMin: 7,
      balanceMin: 5,
      balanceItems: ['单腿平衡站立：3 × 30 秒/侧', '足跟接足尖走：2 × 10 步'],
    },
  },
  {
    day: 3,
    type: 'cardio',
    title: 'Zone 2 低强心肺',
    sub: '坡度快走 + 核心拉伸',
    emoji: '🟦',
    duration: '55 分钟',
    focus: '跑步机 6-9% 坡度快走 40 分钟（促骨密度，优于椭圆机）',
    warmup: { dynamicMin: 5, balanceMin: 0, balanceItems: [] },
  },
  {
    day: 4,
    type: 'strength',
    title: '下肢 B',
    sub: '后链：臀与腘绳 + 手臂',
    emoji: '🟠',
    duration: '73 分钟',
    focus: '杠铃 RDL 当日第一个 · 腰椎未疲劳时完成',
    warmup: {
      dynamicMin: 7,
      balanceMin: 5,
      balanceItems: [
        '单腿站立睁眼测试/练习：3 组 × 30 秒/侧',
        '足跟步态练习：2 组 × 10 步',
        '动态侧向跨步重心转移：2 组 × 10 步',
      ],
    },
  },
  {
    day: 5,
    type: 'strength',
    title: '上肢 B',
    sub: '拉优先 + 胸厚度 + 后束',
    emoji: '🟣',
    duration: '71 分钟',
    focus: '拉类复合爆发向心 · 手臂同机位超级组',
    warmup: {
      dynamicMin: 7,
      balanceMin: 5,
      balanceItems: ['单腿站立平衡：3 × 30 秒/侧', '脚尖接脚跟行走：2 × 10 步'],
    },
  },
  {
    day: 6,
    type: 'hiit',
    title: '4×4 挪威 HIIT',
    sub: 'VO2 Max 金标准',
    emoji: '🔴',
    duration: '40 分钟',
    focus: '4 轮 ×（4 分钟冲刺 + 3 分钟恢复）· 之后连休两天',
    warmup: { dynamicMin: 8, balanceMin: 0, balanceItems: [] },
  },
  {
    day: 7,
    type: 'rest',
    title: '主动休整日 A',
    sub: 'HIIT 后第一天',
    emoji: '⚪',
    duration: '自由安排',
    focus: '日常低强度散步 20-30 分钟（心率 < 100 bpm，轻松交谈），或太极 20 分钟',
    warmup: { dynamicMin: 0, balanceMin: 0, balanceItems: [] },
  },
  {
    day: 8,
    type: 'rest',
    title: '主动休整日 B',
    sub: 'HIIT 后第二天',
    emoji: '⚪',
    duration: '自由安排',
    focus: '日常户外散步 20-30 分钟，接触自然光；保障夜间深睡，准备进入下一轮 D1',
    warmup: { dynamicMin: 0, balanceMin: 0, balanceItems: [] },
  },
]

/** 滑动备忘智库 · 5 大卡片 */
export const MEMO_CARDS = [
  {
    id: 'memo-swap',
    tag: '器械等效',
    title: '自由动作 ⇋ 器械等效替代（绿灯日并列）',
    color: 'blue',
    table: [
      { day: 'D1 下肢A', machine: '哈克深蹲机', free: '史密斯机深蹲 / 六角杠硬拉', leo: true, linda: true },
      { day: 'D2 上肢A', machine: '挂片推胸机', free: '杠铃/哑铃卧推（Linda禁用）', leo: true, linda: false },
      { day: 'D2 上肢A', machine: '坐姿推肩机', free: '站姿哑铃/杠铃推举（Linda禁用）', leo: true, linda: false },
      {
        day: 'D4 下肢B',
        machine: '臀推机 B-Stance',
        free: '杠铃 RDL / 六角杠 RDL（最友好选项）',
        leo: true,
        linda: true,
      },
      { day: 'D5 上肢B', machine: '高位下拉机', free: '助力引体 / 自体重引体（Linda禁用）', leo: true, linda: false },
      {
        day: 'D5 上肢B',
        machine: '挂片划船机',
        free: '哑铃单臂划船 / 杠铃俯身划船（Linda禁用）',
        leo: true,
        linda: false,
      },
      { day: '强化项', machine: '(无对应)', free: '农夫行走（强烈推荐 Leo；Linda禁用）', leo: true, linda: false },
    ],
    rules: [
      '绿灯日自由与器械完全平等，任选其一；黄灯日强制退守器械版。',
      '选择自由版动作前，必须额外增加 1 组约 15 次的轻重量过渡组。',
      '自由动作严守 RPE 8 与双区间铁律，离心严格保持 2-3 秒控制。',
    ],
  },
  {
    id: 'memo-linda',
    tag: '死手守则',
    title: 'Linda 死手模式（Grip-Free）边界指南',
    color: 'rose',
    badge: '避免小臂变粗 · 阻断斜方代偿',
    list: [
      '【已开放自由动作】：杠铃 RDL、六角杠硬拉、史密斯深蹲（需全程使用金属宽面钩助力连接杆）。',
      '【六角杠RDL优势】：躯干比直杠更直立，腰椎剪切力显著降低，为 Linda 最优自由髋主导选项。',
      '【绝对禁用清单】：哑铃侧平举、哑铃划船、自由卧推、农夫行走（禁止任何需握紧完成的动作）。',
      '【独立握力代偿方案】：非训练日独立使用轻负荷握力器（3组 × 15-20次），不介入主项动作链。',
    ],
  },
  {
    id: 'memo-power-bone',
    tag: '防衰爆发',
    title: '爆发力向心 & 骨密度推进指南',
    color: 'amber',
    list: [
      '【爆发力意图】：每个力量日首个复合动作正式组前 2 次，以「最大意图最快速度（~1s）」向心推起/蹬起，离心仍保持 2-3s 控制；第 3 次恢复常规节奏。零额外加组与时间成本。',
      '【骨密度动作库】：大肌群复合加重（哈克/倒蹬/RDL/推胸/划船）+ D4/D5 提踵（保留刺激髋、脊柱、踝）。',
      '【负重有氧原则】：D3 采用坡度快走（绝经后女性增骨密度 0-2%）。椭圆机为下肢减负设计，骨密度收益低于快走。',
      '【冲击跳跃阶梯（无骨松且医嘱许可）】：脚跟落地 2×10 步 ➔ 台阶上下 2×20 步 ➔ 原地小跳 2×10 次（稳定 4-6 周方可进阶）。',
    ],
  },
  {
    id: 'memo-metrics',
    tag: '基线测试',
    title: '功能性指标与筛查备忘',
    color: 'emerald',
    list: [
      '【握力年度检测】：每年测定 1 次。肌力低下警示阈值：男性 < 26kg，女性 < 16kg。',
      '【单腿站立睁眼测试】：每季度测试 1 次。闭眼/睁眼单腿站立目标 > 30 秒（防跌倒前庭本体觉）。',
      '【DXA 骨密度检测】：每 1-2 年复查腰椎与髋部 T 值基线，确认抗阻负荷进度保守程度。',
      '【心血管与代谢】：4×4 前需完成心血管风险筛查；日常监测血压血脂，排查打鼾睡眠呼吸暂停。',
    ],
  },
  {
    id: 'memo-rules',
    tag: '不可压缩',
    title: '8天循环四项不可压缩铁律',
    color: 'purple',
    list: [
      '1. D6（4×4）到下一轮 D1（下肢A）之间必须满打满算休足 72 小时。',
      '2. Zone 2 与 4×4 高强度有氧的前一天，绝对不能安排腿部力量训练。',
      '3. 力量日首个复合主项前，必须执行包含 5 分钟平衡与步态的完整热身。',
      '4. 4×4 HIIT 每循环必须执行满 1 次，即使进入减载周也不得剔除。',
    ],
  },
]

/** 功能性防衰指标阈值 */
export const V6_METRIC_RULES = {
  grip: { label: '握力年度基线 (kg)', hint: '男<26 / 女<16 低下', warnBelow: { leo: 26, linda: 16 } },
  balanceSec: { label: '单腿睁眼站立 (秒)', hint: '防跌倒目标 >30秒', target: 30 },
}

/** 便捷查询：某天元信息 */
export function getV6DayMeta(day) {
  return V6_DAY_META.find((d) => d.day === Number(day)) || V6_DAY_META[0]
}

/** 便捷查询：黄灯模式下容量下调 1-2 组 */
export function applyStatusToSets(baseSets, statusLight) {
  if (statusLight === 'yellow') return Math.max(2, Number(baseSets || 3) - 1)
  return Number(baseSets || 3)
}
