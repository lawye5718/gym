/**
 * 《八天无极微循环 · ACSM 2026 实战战术卡》战术库
 * 数据来源：训练计划定稿（Leo / Linda 三馆独立编排版）
 *
 * 字段约定：
 *  - variants.newGym    🌟 乐刻新馆顶配（Leo 帮挂片 / 全插销神机）
 *  - variants.oldGym    🏢 传统旧馆（经典插销器械 + 龙门架外挂）
 *  - variants.home      🏠 家庭重装（37KG 哑铃凳 + 弹力带 / 金属钩）
 *  - venues            该动作在哪些场馆出现（默认三馆全开）
 *  - prescription.day5SourceId  仅 Day 5 使用，指向主日动作 id，用于 85% 自动折算
 *  - media 为 V2 实拍图解预留，当前 V1 走占位弹窗
 */

const P = (sets, min, max, rir, rest, day5SourceId = null) => ({
  sets,
  repRange: [min, max],
  targetRIR: rir,
  restSeconds: rest,
  day5SourceId,
})

const T = (con, conTime, ecc, eccTime, bottom, overload) => ({
  concentric: { time: conTime, cue: con },
  topPause: { time: '0–1秒', cue: '顶点挤压/微屈不锁死，保持张力' },
  eccentric: { time: eccTime, cue: ecc },
  bottomPause: { time: '1秒', cue: bottom },
  overloadCue: overload,
})

const M = (type, points) => ({
  version: 1,
  placeholderSvgType: type,
  machinePhotoUrl: null,
  actionDiagramUrl: null,
  keyPointsOverlay: points,
})

// 三馆通用（无差异化）便捷构造
const ALL = ['newGym', 'oldGym', 'home']

export const PLAN_LIBRARY = [
  // ============================== LEO ==============================
  // ---------- Day 1 下肢重装日 ----------
  {
    id: 'leo_d1_power',
    user: 'leo',
    day: 1,
    order: '模块A',
    muscleGroup: 'quads',
    category: 'power',
    venues: ALL,
    variants: {
      newGym: { name: '哈克深蹲机 / 倒蹬机 快速蹬伸', machineCode: '爆发力前置 · 正式组 50–60%', isPlateLoaded: false, defaultSeatNote: '踏板居中，膝不锁死' },
      oldGym: { name: '哈克 / 腿举机 快速蹬伸', machineCode: '旧馆 · 哈克/腿举机', isPlateLoaded: false, defaultSeatNote: '踏板居中', prescription: { sets: 3 } },
      home: { name: '哑铃摆荡 / 快速分腿蹲', machineCode: '家庭 · 爆发力替代', isPlateLoaded: false, defaultSeatNote: '壶铃 16–24kg', prescription: { sets: 3 } },
    },
    prescription: P(4, 5, 5, 3, 120),
    tempoGuide: T('前 2/3 程全力加速蹬起，末端最后 15° 主动减速刹车', '<1秒', '稳稳下放到底部停稳再蹬下一次', '2秒', '底部停稳卸掉惯性，严禁膝盖锁死弹震', '总次数 15–20 次，严禁超过 24 次'),
    media: M('power_leg', ['爆发加速', '末端15°刹车', '不锁膝']),
  },
  {
    id: 'leo_d1_m1',
    user: 'leo',
    day: 1,
    order: '主项1',
    muscleGroup: 'quads',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '哈克深蹲（或坐姿腿举）', machineCode: '商业健身房 · 哈克深蹲机', isPlateLoaded: false, defaultSeatNote: '肩垫居中 | 脚距与肩同宽' },
      oldGym: { name: '哈克深蹲（或坐姿腿举）', machineCode: '旧馆 · 哈克深蹲机', isPlateLoaded: false, defaultSeatNote: '肩垫居中' },
      home: { name: '哑铃保加利亚分腿蹲', machineCode: '家庭 · 37KG 哑铃凳', isPlateLoaded: false, defaultSeatNote: '后脚搭凳面，躯干前倾 15°', prescription: { sets: 4, repRange: [8, 12] } },
    },
    prescription: P(4, 8, 12, 2, 150),
    tempoGuide: T('脚跟发力踩穿踏板，背部死贴靠背，顶点膝微屈不锁死', '1秒', '臀向后坐下蹲至最低安全位，全程张力不松', '2秒', '🛑 在最低点稳稳停顿 1 秒，不借反弹再发力', '严禁做单腿下放（保护半月板与骶髂关节）'),
    media: M('squat', ['脚跟发力', '顶点不锁死', '底部停1秒']),
  },
  {
    id: 'leo_d1_m2',
    user: 'leo',
    day: 1,
    order: '主项2',
    muscleGroup: 'glutes_hams',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '【图1】奥杆木质平台 罗马尼亚硬拉 RDL', machineCode: '图1 · 奥杆木质平台', isPlateLoaded: true, defaultSeatNote: '挂助握带 | 避开 Day6 冲刺跑' },
      oldGym: { name: '哑铃 / 杠铃 RDL', machineCode: '旧馆 · 自由重量', isPlateLoaded: true, defaultSeatNote: '挂助握带' },
      home: { name: '哑铃罗马尼亚硬拉 RDL', machineCode: '家庭 · 哑铃', isPlateLoaded: false, defaultSeatNote: '膝微屈固定', prescription: { sets: 4, repRange: [10, 15] } },
    },
    prescription: P(3, 8, 12, 2, 120),
    tempoGuide: T('臀部向前顶，把身体推回直立，不反弓腰', '1秒', '膝微屈固定，臀向后推，杠铃贴腿滑至小腿中上部', '2–3秒', '🛑 在最酸胀的底端停顿 1 秒再发力', '补齐伸髋短板，务必挂助握带'),
    media: M('hinge', ['臀向后推', '杠贴腿', '底端停1秒']),
  },
  {
    id: 'leo_d1_m3',
    user: 'leo',
    day: 1,
    order: '主项3',
    muscleGroup: 'glutes_hams',
    category: 'isolation',
    venues: ALL,
    variants: {
      newGym: { name: '坐姿 / 俯卧腿弯举', machineCode: '通用插销器械', isPlateLoaded: false, defaultSeatNote: '滚轴压在踝上，膝对齐转轴' },
      oldGym: { name: '坐姿 / 俯卧腿弯举', machineCode: '旧馆 · 通用插销器械', isPlateLoaded: false, defaultSeatNote: '膝对齐转轴' },
      home: { name: '坐姿 / 俯卧腿弯举', machineCode: '家庭 · 插销器械', isPlateLoaded: false, defaultSeatNote: '膝对齐转轴' },
    },
    prescription: P(3, 10, 15, 1, 90),
    tempoGuide: T('小腿勾向臀部，顶峰停 1 秒挤压', '1秒', '缓慢还原，全程腘绳肌绷紧', '2秒', '底部充分拉开腘绳肌', '🔥第3组离心超负荷：双腿勾起、单腿 3 秒控制下放'),
    media: M('leg_curl', ['顶峰停1秒', '离心2秒', '末组单腿慢放']),
  },
  {
    id: 'leo_d1_m4',
    user: 'leo',
    day: 1,
    order: '主项4',
    muscleGroup: 'calves',
    category: 'isolation',
    venues: ALL,
    variants: {
      newGym: { name: '坐姿倒蹬机提踵', machineCode: '坐姿倒蹬机', isPlateLoaded: false, defaultSeatNote: '前脚掌踩踏板边缘' },
      oldGym: { name: '坐姿倒蹬机提踵', machineCode: '旧馆 · 倒蹬机', isPlateLoaded: false, defaultSeatNote: '前脚掌踩踏板边缘' },
      home: { name: 'RKC 主动收紧平板支撑', machineCode: '家庭 · 徒手', isPlateLoaded: false, defaultSeatNote: '收紧腹背，臀腿绷紧', prescription: { sets: 3, repRange: [30, 45], restSeconds: 60 } },
    },
    prescription: P(3, 15, 20, 1, 75),
    tempoGuide: T('踮起至顶峰停 1 秒', '1秒', '缓慢下沉到底', '2秒', '🛑 底部停顿 1 秒充分拉开跟腱', '孤立动作磨满 20 次再跳档'),
    media: M('calf', ['顶峰停1秒', '底部拉开跟腱']),
  },

  // ---------- Day 3 铠甲日（推力） ----------
  {
    id: 'leo_d3_warm',
    user: 'leo',
    day: 3,
    order: '必做热身',
    muscleGroup: 'shoulders',
    category: 'warmup',
    venues: ALL,
    variants: {
      newGym: { name: '肩袖救命丸：弹力带肩外旋 + YTWL', machineCode: '弹力带', isPlateLoaded: false, defaultSeatNote: '肘夹紧躯干' },
      oldGym: { name: '肩袖救命丸：弹力带肩外旋 + YTWL', machineCode: '旧馆弹力带', isPlateLoaded: false, defaultSeatNote: '肘夹紧躯干' },
      home: { name: '肩袖救命丸：弹力带肩外旋 + YTWL', machineCode: '家庭弹力带', isPlateLoaded: false, defaultSeatNote: '肘夹紧躯干' },
    },
    prescription: P(2, 15, 15, 3, 60),
    tempoGuide: T('向心拉开弹力带', '1秒', '受控收回', '2秒', '润滑肩峰防撞击', '每次推日前必做'),
    media: M('shoulder_health', ['润滑肩峰', '防撞击']),
  },
  {
    id: 'leo_d3_m1a',
    user: 'leo',
    day: 3,
    order: '主项1A',
    muscleGroup: 'chest',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '【图2/3】挂片式水平卧推机', machineCode: '图2/3 · HORIZONTAL BENCH PRESS', isPlateLoaded: true, defaultSeatNote: '躺板居中 | 握距中宽' },
      oldGym: { name: '插销坐姿推胸机', machineCode: '旧馆 · 插销推胸机', isPlateLoaded: false, defaultSeatNote: '握距中宽', prescription: { sets: 5, repRange: [8, 12] } },
      home: { name: '37KG 凳 上斜/平板哑铃卧推', machineCode: '家庭 · 哑铃凳', isPlateLoaded: false, defaultSeatNote: 'FID凳 0–30°', prescription: { sets: 5, repRange: [8, 12] } },
    },
    prescription: P(3, 8, 10, 2, 150),
    tempoGuide: T('肩胛骨后收贴死躺板，胸发力干脆推出，顶点手肘微屈不锁死', '1秒', '边抵抗边退让，下放至胸肌充分拉开位', '2秒', '🛑 核心收益点：在最底部稳稳停顿 1 秒卸掉惯性，再推起', '主攻整胸厚度与大重量安全极值'),
    media: M('chest_press', ['肩胛下沉贴板', '手肘内收30°', '底部停1秒']),
  },
  {
    id: 'leo_d3_m1b',
    user: 'leo',
    day: 3,
    order: '主项1B',
    muscleGroup: 'chest',
    category: 'compound',
    venues: ['newGym'],
    variants: {
      newGym: { name: '【图6】LIFEFIT 挂片式坐姿推胸机', machineCode: '图6 · LIFEFIT 坐姿推胸', isPlateLoaded: true, defaultSeatNote: '座椅调低 1–2 格，顺内收弧线主攻上胸' },
    },
    prescription: P(3, 10, 12, 1, 120),
    tempoGuide: T('推出并挤压中缝', '1秒', '控制下放至胸充分拉开', '2秒', '🛑 底部停 1 秒再推起', '🔥第3组离心超负荷：双手推出、单手 3 秒控制收回'),
    media: M('incline_press', ['主攻上胸中缝', '座椅调低1-2格']),
  },
  {
    id: 'leo_d3_m2',
    user: 'leo',
    day: 3,
    order: '主项2',
    muscleGroup: 'shoulders',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '坐姿推肩机', machineCode: '插销式推肩机', isPlateLoaded: false, defaultSeatNote: '握把对齐肩峰' },
      oldGym: { name: '插销坐姿推肩机', machineCode: '旧馆 · 插销推肩机', isPlateLoaded: false, defaultSeatNote: '握把对齐肩峰' },
      home: { name: '坐姿哑铃推肩', machineCode: '家庭 · 哑铃', isPlateLoaded: false, defaultSeatNote: '凳背 85°', prescription: { sets: 3, repRange: [10, 10] } },
    },
    prescription: P(3, 8, 12, 2, 120),
    tempoGuide: T('手肘向身体前方内收 30° 黄金轨迹推起，不锁死', '1秒', '放回耳侧，控制下放', '2秒', '底部停 1 秒', '避免耸肩代偿'),
    media: M('shoulder_press', ['手肘内收30°', '不锁死']),
  },
  {
    id: 'leo_d3_m3',
    user: 'leo',
    day: 3,
    order: '主项3',
    muscleGroup: 'shoulders',
    category: 'isolation',
    venues: ALL,
    variants: {
      newGym: { name: '【图4/5】INSIGHT 站立飞鸟机 · 侧平举档', machineCode: '图4/5 · LATERAL RAISE', isPlateLoaded: false, defaultSeatNote: '滚轴贴小臂，站中间' },
      oldGym: { name: '龙门架绳索侧平举', machineCode: '旧馆 · 龙门架', isPlateLoaded: false, defaultSeatNote: '绳索调中位', prescription: { sets: 4, repRange: [15, 20] } },
      home: { name: '哑铃侧平举', machineCode: '家庭 · 哑铃', isPlateLoaded: false, defaultSeatNote: '空握/掌根受力', prescription: { sets: 4, repRange: [15, 20] } },
    },
    prescription: P(4, 12, 20, 1, 75),
    tempoGuide: T('小臂顶滚轴抬至肩高，顶峰停 0.5–1 秒', '1秒', '受控落回大腿侧，全程恒定张力', '2秒', '从 0° 起保持张力', '不做超重单手下放'),
    media: M('lateral_raise', ['小臂顶滚轴', '抬至肩高', '离心2秒']),
  },
  {
    id: 'leo_d3_m4',
    user: 'leo',
    day: 3,
    order: '主项4',
    muscleGroup: 'arms',
    category: 'isolation',
    venues: ALL,
    variants: {
      newGym: { name: '龙门架三头下压', machineCode: '龙门架 · 直杆/V把', isPlateLoaded: false, defaultSeatNote: '插销档位' },
      oldGym: { name: '龙门架三头下压', machineCode: '旧馆 · 龙门架', isPlateLoaded: false, defaultSeatNote: '插销档位' },
      home: { name: '上斜凳仰卧哑铃臂屈伸', machineCode: '家庭 · 哑铃', isPlateLoaded: false, defaultSeatNote: '凳 30°', prescription: { sets: 3, repRange: [12, 15] } },
    },
    prescription: P(3, 12, 15, 1, 75),
    tempoGuide: T('伸肘到底停 1 秒', '1秒', '屈肘至三头拉到最长处', '2秒', '🛑 底部拉长位停顿 1 秒', '补齐肱三头肌长头盲区'),
    media: M('triceps', ['伸肘到底停1秒', '底部拉长停1秒']),
  },

  // ---------- Day 4 插件日（拉力） ----------
  {
    id: 'leo_d4_m1',
    user: 'leo',
    day: 4,
    order: '主项1',
    muscleGroup: 'back',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '【图10/12】挂片式长臂坐姿划船机', machineCode: '图10/12 · PLATE-LOADED SEATED ROW', isPlateLoaded: true, defaultSeatNote: '胸垫贴紧 | 握距中宽' },
      oldGym: { name: '助力引体 / 坐姿划船', machineCode: '旧馆 · 划船机', isPlateLoaded: false, defaultSeatNote: '胸垫贴紧', prescription: { sets: 4, repRange: [8, 12] } },
      home: { name: '37kg 凳 单臂哑铃划船', machineCode: '家庭 · 哑铃凳', isPlateLoaded: false, defaultSeatNote: '单手撑凳，背平行地面', prescription: { sets: 4, repRange: [10, 15] } },
    },
    prescription: P(4, 8, 12, 2, 150),
    tempoGuide: T('胸贴紧靠垫，先沉肩再用手肘向后拉，顶峰夹紧肩胛停 1 秒', '1秒', '手臂前送让肩胛骨彻底打开', '2秒', '🛑 底部拉伸位停 1 秒', '🔥第4组离心超负荷：双臂拉起、单臂 3 秒回放'),
    media: M('row', ['胸垫护腰', '沉肩用手肘拉', '底部打开肩胛']),
  },
  {
    id: 'leo_d4_m2',
    user: 'leo',
    day: 4,
    order: '主项2',
    muscleGroup: 'back',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '高位下拉', machineCode: '插销式高位下拉', isPlateLoaded: false, defaultSeatNote: '大腿卡紧，握距1.5倍肩' },
      oldGym: { name: '高位下拉', machineCode: '旧馆 · 插销高位下拉', isPlateLoaded: false, defaultSeatNote: '大腿卡紧' },
      home: { name: '门缝重型弹力带下拉', machineCode: '家庭 · 门缝弹力带', isPlateLoaded: false, defaultSeatNote: '门锚高位', prescription: { sets: 4, repRange: [12, 15] } },
    },
    prescription: P(4, 10, 12, 2, 120),
    tempoGuide: T('沉肩挺胸拉至锁骨', '1秒', '送回最高点，充分伸展背阔肌外沿', '2秒', '底部充分伸展', '避免躯干后仰借力'),
    media: M('pulldown', ['沉肩挺胸', '拉至锁骨']),
  },
  {
    id: 'leo_d4_m3',
    user: 'leo',
    day: 4,
    order: '主项3',
    muscleGroup: 'back',
    category: 'isolation',
    venues: ALL,
    variants: {
      newGym: { name: '龙门架直臂下压', machineCode: '龙门架 · 直杆', isPlateLoaded: false, defaultSeatNote: '插销档位' },
      oldGym: { name: '龙门架直臂下压', machineCode: '旧馆 · 龙门架', isPlateLoaded: false, defaultSeatNote: '插销档位' },
      home: { name: '弹力带直臂下压', machineCode: '家庭 · 弹力带', isPlateLoaded: false, defaultSeatNote: '门锚高位', prescription: { sets: 3, repRange: [15, 15] } },
    },
    prescription: P(3, 12, 15, 1, 75),
    tempoGuide: T('手肘微屈固定，压至大腿前停 1 秒', '1秒', '抬回眼部高度', '2秒', '底部停 1 秒', '孤立动作磨满 20 次再跳档'),
    media: M('straight_arm', ['手肘微屈固定', '压至大腿前']),
  },
  {
    id: 'leo_d4_m4',
    user: 'leo',
    day: 4,
    order: '主项4',
    muscleGroup: 'shoulders',
    category: 'isolation',
    venues: ALL,
    variants: {
      newGym: { name: '【图4/5】INSIGHT 站立飞鸟机 · 后束档', machineCode: '图4/5 · REAR LATERAL RAISE', isPlateLoaded: false, defaultSeatNote: '面向机器站立，小臂外侧顶滚轴' },
      oldGym: { name: '龙门架绳索面拉 Face Pull', machineCode: '旧馆 · 龙门架绳索', isPlateLoaded: false, defaultSeatNote: '绳索调至面部高度', prescription: { sets: 4, repRange: [15, 20] } },
      home: { name: '弹力带面拉 / 俯身哑铃飞鸟', machineCode: '家庭 · 弹力带', isPlateLoaded: false, defaultSeatNote: '脚踝扣绑手腕', prescription: { sets: 4, repRange: [15, 20] } },
    },
    prescription: P(4, 15, 20, 1, 75),
    tempoGuide: T('向后外展推开滚轴，顶峰停 1 秒', '1秒', '缓慢还原', '2秒', '底部充分展开', '强化肩后束与外旋链，平衡卧推张力'),
    media: M('rear_delt', ['向后外展', '顶峰停1秒']),
  },
  {
    id: 'leo_d4_m5',
    user: 'leo',
    day: 4,
    order: '主项5',
    muscleGroup: 'arms',
    category: 'isolation',
    venues: ALL,
    variants: {
      newGym: { name: '【图8】牧师凳弯举器（黄斜托）', machineCode: '图8 · 牧师凳', isPlateLoaded: false, defaultSeatNote: '腋下死贴斜托上沿' },
      oldGym: { name: '哑铃交替弯举', machineCode: '旧馆 · 哑铃', isPlateLoaded: false, defaultSeatNote: '站姿，肘固定', prescription: { sets: 3, repRange: [12, 15] } },
      home: { name: '哑铃 / 弹力带弯举', machineCode: '家庭 · 哑铃', isPlateLoaded: false, defaultSeatNote: '肘固定', prescription: { sets: 3, repRange: [15, 15] } },
    },
    prescription: P(3, 10, 15, 1, 75),
    tempoGuide: T('弯起至顶峰挤压', '1秒', '下放至接近伸直', '2秒', '🛑 底部留 10° 微屈，不暴力锁死肘关节，停半秒', '锁死大臂，吃满二头底部拉伸位肥大信号'),
    media: M('biceps', ['锁死大臂', '底部留10°微屈']),
  },

  // ---------- Day 5 第二遍扩次日 ----------
  {
    id: 'leo_d5_m1',
    user: 'leo',
    day: 5,
    order: '1 下肢推',
    muscleGroup: 'quads',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '哈克深蹲 / 腿举（85% 扩次）', machineCode: '主日 85% 重量', isPlateLoaded: false, defaultSeatNote: '同 Day1 主项1' },
      oldGym: { name: '腿举 / 哈克深蹲（85% 扩次）', machineCode: '旧馆 85% 重量', isPlateLoaded: false, defaultSeatNote: '同主日' },
      home: { name: '哑铃保加利亚分腿蹲（85% 扩次）', machineCode: '家庭 · 哑铃', isPlateLoaded: false, defaultSeatNote: '同主日', prescription: { sets: 3, repRange: [12, 16] } },
    },
    prescription: P(3, 12, 16, 2, 120, 'leo_d1_m1'),
    tempoGuide: T('积极推起，努力扩次数', '1秒', '控制下放', '2秒', '底部停 1 秒', '⚡ 不设上限，努力多做至向心速度变慢即停'),
    media: M('squat', ['85%重量', '冲12-16次']),
  },
  {
    id: 'leo_d5_m2',
    user: 'leo',
    day: 5,
    order: '2 下肢后链',
    muscleGroup: 'glutes_hams',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '坐姿/俯卧腿弯举 或 【图7】臀推机（85% 扩次）', machineCode: '主日 85%', isPlateLoaded: false, defaultSeatNote: '同主日' },
      oldGym: { name: '坐姿/俯卧腿弯举（85% 扩次）', machineCode: '旧馆 85%', isPlateLoaded: false, defaultSeatNote: '同主日' },
      home: { name: '哑铃臀推 / 滑盘腿弯举（85% 扩次）', machineCode: '家庭', isPlateLoaded: false, defaultSeatNote: '同主日' },
    },
    prescription: P(3, 12, 18, 2, 90, 'leo_d1_m3'),
    tempoGuide: T('积极勾起/顶起', '1秒', '控制下放', '2秒', '底部停 1 秒', '⚡ 今日不做 RDL，确保明天跑 HIIT 大腿后侧零酸痛'),
    media: M('leg_curl', ['85%重量', '冲12-18次', '不做RDL']),
  },
  {
    id: 'leo_d5_m3',
    user: 'leo',
    day: 5,
    order: '3 上肢推',
    muscleGroup: 'chest',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '【图2/3】水平卧推机（85% 扩次）', machineCode: '图2/3 · 85% 挂片', isPlateLoaded: true, defaultSeatNote: '同 Day3 主项1A' },
      oldGym: { name: '插销坐姿推胸机（85% 扩次）', machineCode: '旧馆 85%', isPlateLoaded: false, defaultSeatNote: '同主日' },
      home: { name: '哑铃卧推（85% 扩次）', machineCode: '家庭 · 哑铃', isPlateLoaded: false, defaultSeatNote: '同主日' },
    },
    prescription: P(3, 12, 16, 2, 120, 'leo_d3_m1a'),
    tempoGuide: T('积极推出，努力扩次', '1秒', '控制下放至胸拉开', '2秒', '🛑 底部停 1 秒', '⚡ 努力扩次至速度变慢即停'),
    media: M('chest_press', ['85%重量', '冲12-16次']),
  },
  {
    id: 'leo_d5_m4',
    user: 'leo',
    day: 5,
    order: '4 上肢拉',
    muscleGroup: 'back',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '【图9/11】UNIVERSAL ROW 插销式带胸垫划船机', machineCode: '图9/11 · 插销秒调 85%', isPlateLoaded: false, defaultSeatNote: '胸垫贴紧，插销调 85%' },
      oldGym: { name: '插销坐姿划船（85% 扩次）', machineCode: '旧馆 85%', isPlateLoaded: false, defaultSeatNote: '同主日' },
      home: { name: '单臂哑铃划船（85% 扩次）', machineCode: '家庭 · 37kg 凳', isPlateLoaded: false, defaultSeatNote: '同主日' },
    },
    prescription: P(3, 12, 16, 2, 120, 'leo_d4_m1'),
    tempoGuide: T('沉肩用手肘拉，顶峰夹紧', '1秒', '前送打开肩胛', '2秒', '🛑 底部停 1 秒', '⚡ 插销秒调重量，免搬片'),
    media: M('row', ['85%重量', '冲12-16次']),
  },
  {
    id: 'leo_d5_m5',
    user: 'leo',
    day: 5,
    order: '5 肩中束',
    muscleGroup: 'shoulders',
    category: 'isolation',
    venues: ALL,
    variants: {
      newGym: { name: '【图4/5】站立飞鸟机侧平举（100% 原重量）', machineCode: '图4/5 · LATERAL', isPlateLoaded: false, defaultSeatNote: '同 Day3' },
      oldGym: { name: '龙门架 / 哑铃侧平举（100%）', machineCode: '旧馆', isPlateLoaded: false, defaultSeatNote: '同主日' },
      home: { name: '哑铃侧平举（100%）', machineCode: '家庭 · 哑铃', isPlateLoaded: false, defaultSeatNote: '同主日' },
    },
    prescription: P(2, 12, 20, 1, 60, 'leo_d3_m3'),
    tempoGuide: T('抬至肩高，顶峰停 0.5 秒', '1秒', '控制落回', '2秒', '保持恒定张力', '孤立动作保持原重量 2 组'),
    media: M('lateral_raise', ['100%原重量', '2组']),
  },
  {
    id: 'leo_d5_m6',
    user: 'leo',
    day: 5,
    order: '6 手臂超级组',
    muscleGroup: 'arms',
    category: 'isolation',
    venues: ALL,
    variants: {
      newGym: { name: '【图8】牧师凳弯举 + 三头下压（100%）', machineCode: '图8 + 龙门架', isPlateLoaded: false, defaultSeatNote: '同主日' },
      oldGym: { name: '哑铃弯举 + 三头下压（100%）', machineCode: '旧馆', isPlateLoaded: false, defaultSeatNote: '同主日' },
      home: { name: '哑铃弯举 + 臂屈伸（100%）', machineCode: '家庭 · 哑铃', isPlateLoaded: false, defaultSeatNote: '同主日' },
    },
    prescription: P(2, 12, 15, 1, 60, 'leo_d4_m5'),
    tempoGuide: T('弯起/伸肘到底停 1 秒', '1秒', '控制还原', '2秒', '底部留 10° 微屈', '孤立动作保持原重量 2 组'),
    media: M('biceps', ['100%原重量', '2组']),
  },

  // ============================== LINDA ==============================
  // ---------- Day 1 下肢蜜桃臀重装日 ----------
  {
    id: 'linda_d1_power',
    user: 'linda',
    day: 1,
    order: '模块A',
    muscleGroup: 'quads',
    category: 'power',
    venues: ALL,
    variants: {
      newGym: { name: '坐姿腿举机 / 倒蹬机 快速蹬伸', machineCode: '🌟新馆 · 腿举机', isPlateLoaded: false, defaultSeatNote: '踏板居中' },
      oldGym: { name: '旧馆腿举机 快速蹬伸', machineCode: '🏡旧馆 · 腿举机', isPlateLoaded: false, defaultSeatNote: '踏板居中', prescription: { sets: 3 } },
      home: { name: '自重 / 哑铃快速分腿蹲起', machineCode: '家庭 · 自重/哑铃', isPlateLoaded: false, defaultSeatNote: '徒手或持铃', prescription: { sets: 3 } },
    },
    prescription: P(3, 5, 5, 3, 120),
    tempoGuide: T('全力快速蹬出，末端 15° 主动刹车不锁膝', '<1秒', '稳稳收回', '2秒', '底部停稳', '预防熟龄期步速与平衡衰退的王牌'),
    media: M('power_leg', ['爆发蹬出', '末端刹车', '不锁膝']),
  },
  {
    id: 'linda_d1_m1',
    user: 'linda',
    day: 1,
    order: '主项1 王牌',
    muscleGroup: 'glutes_hams',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '【图7】INSIGHT 专业臀推机', machineCode: '🌟图7 · HIP THRUSTER（Leo 帮挂片）', isPlateLoaded: true, defaultSeatNote: '宽软带扣好骨盆 | 斜踏板脚距与髋同宽' },
      oldGym: { name: '史密斯机臀推（垫厚垫）', machineCode: '🏡旧馆 · 史密斯机', isPlateLoaded: false, defaultSeatNote: '厚垫裹杆防压痛' },
      home: { name: '金属钩哑铃罗马尼亚硬拉 RDL', machineCode: '家庭 · 金属钩哑铃', isPlateLoaded: false, defaultSeatNote: '金属钩挂哑铃', prescription: { sets: 4, repRange: [10, 15] } },
    },
    prescription: P(5, 10, 15, 2, 120),
    tempoGuide: T('脚跟发力纯靠臀部顶起，顶峰用力夹臀停顿 1–2 秒', '1秒', '带张力落回，底部悬空半秒不砸底', '2秒', '🛑 底部悬空半秒，保持臀肌张力', '彻底告别史密斯铁杆压迫耻骨的痛感'),
    media: M('hip_thrust', ['脚跟发力', '顶峰夹臀1-2秒', '底部不砸底']),
  },
  {
    id: 'linda_d1_m2',
    user: 'linda',
    day: 1,
    order: '主项2 替山羊',
    muscleGroup: 'glutes_hams',
    category: 'isolation',
    venues: ALL,
    variants: {
      newGym: { name: '坐姿 / 俯卧腿弯举机（插销式）', machineCode: '🌟新馆 · 插销腿弯举', isPlateLoaded: false, defaultSeatNote: '滚轴压踝上，膝对齐转轴' },
      oldGym: { name: '腿弯举机（插销式）', machineCode: '🏡旧馆 · 插销腿弯举', isPlateLoaded: false, defaultSeatNote: '膝对齐转轴' },
      home: { name: '金属钩哑铃保加利亚分腿蹲', machineCode: '家庭 · 金属钩哑铃', isPlateLoaded: false, defaultSeatNote: '后脚搭凳面', prescription: { sets: 4, repRange: [8, 12] } },
    },
    prescription: P(4, 12, 15, 1, 90),
    tempoGuide: T('勾起停 1 秒', '1秒', '缓慢下放', '2–3秒', '🛑 底部充分拉开', '✅ 彻底取代伤腰头晕的山羊挺身，雕刻臀下微笑线'),
    media: M('leg_curl', ['取代山羊挺身', '勾起停1秒', '离心2-3秒']),
  },
  {
    id: 'linda_d1_m3',
    user: 'linda',
    day: 1,
    order: '主项3',
    muscleGroup: 'glutes_hams',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '坐姿倒蹬机（高脚位宽站距）', machineCode: '🌟新馆 · 插销倒蹬机', isPlateLoaded: false, defaultSeatNote: '脚踩踏板偏高偏宽处' },
      oldGym: { name: '高脚位宽距坐姿倒蹬', machineCode: '🏡旧馆 · 倒蹬机', isPlateLoaded: false, defaultSeatNote: '高脚宽距' },
      home: { name: 'RKC 主动收紧平板支撑', machineCode: '家庭 · 徒手', isPlateLoaded: false, defaultSeatNote: '收紧腹背', prescription: { sets: 3, repRange: [30, 45], restSeconds: 60 } },
    },
    prescription: P(3, 12, 15, 2, 120),
    tempoGuide: T('蹬出，避免大腿前侧过度发力', '1秒', '控制回收', '2秒', '🛑 底部停 1 秒', '高脚宽距主攻臀腿后侧，避开大腿前侧粗壮'),
    media: M('leg_press', ['高脚位', '宽站距', '主攻臀腿后侧']),
  },

  // ---------- Day 3 直角肩推力日 ----------
  {
    id: 'linda_d3_warm',
    user: 'linda',
    day: 3,
    order: '热身',
    muscleGroup: 'shoulders',
    category: 'warmup',
    venues: ALL,
    variants: {
      newGym: { name: '弹力带肩外旋 + YTWL', machineCode: '弹力带', isPlateLoaded: false, defaultSeatNote: '肘夹紧躯干' },
      oldGym: { name: '弹力带肩外旋 + YTWL', machineCode: '🏡家庭弹力带', isPlateLoaded: false, defaultSeatNote: '肘夹紧躯干' },
      home: { name: '弹力带肩外旋 + YTWL', machineCode: '🏡家庭弹力带', isPlateLoaded: false, defaultSeatNote: '肘夹紧躯干' },
    },
    prescription: P(2, 15, 15, 3, 60),
    tempoGuide: T('向心拉开', '1秒', '收回', '2秒', '开肩护肩袖', '推日前必做'),
    media: M('shoulder_health', ['开肩', '护肩袖']),
  },
  {
    id: 'linda_d3_m1',
    user: 'linda',
    day: 3,
    order: '主项1',
    muscleGroup: 'chest',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '【图4/5】站立飞鸟机 · 下斜飞鸟夹胸档', machineCode: '🌟图4/5 · DECLINE FLY（纯插销 0 搬片）', isPlateLoaded: false, defaultSeatNote: '手指悬空，用手肘内侧/小臂推软垫' },
      oldGym: { name: '蝴蝶机夹胸', machineCode: '🏡旧馆 · 蝴蝶机', isPlateLoaded: false, defaultSeatNote: '手肘推板', prescription: { sets: 5, repRange: [12, 15] } },
      home: { name: '掌根受力空握法哑铃卧推', machineCode: '家庭 · 掌根哑铃卧推', isPlateLoaded: false, defaultSeatNote: '掌根受力，空握不抓握', prescription: { sets: 5, repRange: [10, 15] } },
    },
    prescription: P(5, 12, 15, 1, 90),
    tempoGuide: T('手指完全悬空不抓握，用手肘内侧/小臂（或掌根）推软垫合拢，顶峰挤压停 1 秒', '1秒', '控制打开至胸充分拉开', '2秒', '🛑 底部打开位停 1 秒', '死手模式：金属宽钩 + 手腕直接顶软垫'),
    media: M('fly', ['手指悬空', '小臂推软垫', '顶峰挤压停1秒']),
  },
  {
    id: 'linda_d3_m2',
    user: 'linda',
    day: 3,
    order: '主项2 神机',
    muscleGroup: 'shoulders',
    category: 'isolation',
    venues: ALL,
    variants: {
      newGym: { name: '【图4/5】站立飞鸟机 · 侧平举档', machineCode: '🌟图4/5 · LATERAL RAISE（免绑脚踝扣）', isPlateLoaded: false, defaultSeatNote: '手腕背侧直接顶滚轴抬起' },
      oldGym: { name: '龙门架脚踝扣侧平举', machineCode: '🏡旧馆 · 脚踝扣', isPlateLoaded: false, defaultSeatNote: '脚踝扣绑手腕', prescription: { sets: 4, repRange: [15, 20] } },
      home: { name: '弹力带脚踝扣侧平举', machineCode: '家庭 · 弹力带', isPlateLoaded: false, defaultSeatNote: '脚踝扣绑手腕', prescription: { sets: 4, repRange: [15, 20] } },
    },
    prescription: P(4, 15, 20, 1, 75),
    tempoGuide: T('沉肩不耸肩，用肩膀带动手腕抬至肩高停 0.5 秒', '1秒', '慢放，全程恒定张力', '2秒', '从 0° 起保持张力', '打造直角肩，免绑脚踝扣'),
    media: M('lateral_raise', ['沉肩不耸肩', '手腕背侧顶滚轴', '抬至肩高']),
  },
  {
    id: 'linda_d3_m3',
    user: 'linda',
    day: 3,
    order: '主项3',
    muscleGroup: 'arms',
    category: 'isolation',
    venues: ALL,
    variants: {
      newGym: { name: '龙门架 V 型把手三头下压（插销式）', machineCode: '🌟新馆 · 插销龙门架', isPlateLoaded: false, defaultSeatNote: '手掌张开，纯用掌根下压' },
      oldGym: { name: '龙门架 V 把三头下压', machineCode: '🏡旧馆 · 龙门架', isPlateLoaded: false, defaultSeatNote: '掌根受力', prescription: { sets: 3, repRange: [15, 20] } },
      home: { name: '弹力带掌根三头下压', machineCode: '家庭 · 弹力带', isPlateLoaded: false, defaultSeatNote: '掌根受力', prescription: { sets: 3, repRange: [15, 20] } },
    },
    prescription: P(3, 15, 20, 1, 75),
    tempoGuide: T('纯用掌根向下压到底停 1 秒', '1秒', '收回，保持三头张力', '2秒', '🛑 底部停 1 秒', '专攻大臂后侧拜拜肉'),
    media: M('triceps', ['掌根下压', '到底停1秒']),
  },

  // ---------- Day 4 薄背天鹅颈日 ----------
  {
    id: 'linda_d4_m1',
    user: 'linda',
    day: 4,
    order: '主项1',
    muscleGroup: 'back',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '高位下拉（金属宽钩全挂载）', machineCode: '🌟新馆 · 插销高位下拉', isPlateLoaded: false, defaultSeatNote: '金属钩挂横杆，手掌放松' },
      oldGym: { name: '高位下拉（金属宽钩全挂载）', machineCode: '🏡旧馆 · 高位下拉', isPlateLoaded: false, defaultSeatNote: '金属宽钩', prescription: { sets: 4, repRange: [12, 12] } },
      home: { name: '门缝弹力带高位下拉（挂钩）', machineCode: '家庭 · 门缝弹力带', isPlateLoaded: false, defaultSeatNote: '门锚', prescription: { sets: 4, repRange: [12, 15] } },
    },
    prescription: P(4, 12, 15, 2, 120),
    tempoGuide: T('沉肩用手肘下拉至锁骨', '1秒', '送回，充分伸展背阔肌', '2秒', '🛑 底部停 1 秒', '全挂载死手模式，手掌放松不抓握'),
    media: M('pulldown', ['金属宽钩', '沉肩下拉至锁骨']),
  },
  {
    id: 'linda_d4_m2',
    user: 'linda',
    day: 4,
    order: '主项2 神机',
    muscleGroup: 'back',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '【图9/11】UNIVERSAL 插销式坐姿划船机', machineCode: '🌟图9/11 · 自带胸垫护腰', isPlateLoaded: false, defaultSeatNote: '胸口贴软垫，插销调重，挂金属钩' },
      oldGym: { name: '传统坐姿划船（金属宽钩）', machineCode: '🏡旧馆 · 坐姿划船', isPlateLoaded: false, defaultSeatNote: '金属宽钩', prescription: { sets: 4, repRange: [12, 12] } },
      home: { name: '37kg 凳 单臂金属钩哑铃划船', machineCode: '家庭 · 37kg 凳', isPlateLoaded: false, defaultSeatNote: '单手撑凳', prescription: { sets: 4, repRange: [10, 15] } },
    },
    prescription: P(4, 12, 15, 2, 120),
    tempoGuide: T('拉到底强制停顿 1 秒夹紧肩胛骨', '1秒', '前送打开上背', '2秒', '🛑 底部打开肩胛停 1 秒', '胸口贴住软垫卸除腰部压力'),
    media: M('row', ['胸垫护腰', '到底停1秒夹肩胛']),
  },
  {
    id: 'linda_d4_m3',
    user: 'linda',
    day: 4,
    order: '主项3 神机',
    muscleGroup: 'shoulders',
    category: 'isolation',
    venues: ALL,
    variants: {
      newGym: { name: '【图4/5】站立飞鸟机 · 后束档', machineCode: '🌟图4/5 · REAR LATERAL RAISE（免绑扣）', isPlateLoaded: false, defaultSeatNote: '面向机器，小臂外侧往后扩' },
      oldGym: { name: '龙门架脚踝扣面拉 Face Pull', machineCode: '🏡旧馆 · 龙门架', isPlateLoaded: false, defaultSeatNote: '脚踝扣绑手腕', prescription: { sets: 4, repRange: [15, 20] } },
      home: { name: '弹力带脚踝扣面拉', machineCode: '家庭 · 弹力带', isPlateLoaded: false, defaultSeatNote: '脚踝扣绑手腕', prescription: { sets: 4, repRange: [15, 20] } },
    },
    prescription: P(4, 15, 20, 1, 75),
    tempoGuide: T('向后展肩停顿 1 秒', '1秒', '缓慢还原', '2秒', '底部充分展开', '终极圆肩驼背矫正器'),
    media: M('rear_delt', ['面向机器', '小臂外侧后扩', '停1秒']),
  },
  {
    id: 'linda_d4_m4',
    user: 'linda',
    day: 4,
    order: '主项4',
    muscleGroup: 'arms',
    category: 'isolation',
    venues: ALL,
    variants: {
      newGym: { name: '龙门架脚踝扣二头弯举（插销式）', machineCode: '🌟新馆 · 插销龙门架', isPlateLoaded: false, defaultSeatNote: '腋下夹紧躯干' },
      oldGym: { name: '龙门架脚踝扣弯举', machineCode: '🏡旧馆 · 龙门架', isPlateLoaded: false, defaultSeatNote: '腋下夹紧', prescription: { sets: 3, repRange: [15, 15] } },
      home: { name: '弹力带手腕二头弯举', machineCode: '家庭 · 弹力带', isPlateLoaded: false, defaultSeatNote: '腋下夹紧', prescription: { sets: 3, repRange: [15, 15] } },
    },
    prescription: P(3, 15, 15, 1, 75),
    tempoGuide: T('弯起，顶峰挤压', '1秒', '放到底', '2秒', '底部充分拉伸二头', '腋下死死夹紧躯干'),
    media: M('biceps', ['腋下夹紧', '离心2秒']),
  },

  // ---------- Day 5 第二遍扩次日 ----------
  {
    id: 'linda_d5_m1',
    user: 'linda',
    day: 5,
    order: '1 臀部',
    muscleGroup: 'glutes_hams',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '【图7】臀推机（85% 扩次）', machineCode: '🌟图7 · 85% 挂片', isPlateLoaded: true, defaultSeatNote: '同 Day1 王牌' },
      oldGym: { name: '史密斯臀推（85% 扩次）', machineCode: '🏡旧馆 · 85%', isPlateLoaded: false, defaultSeatNote: '同主日' },
      home: { name: '哑铃臀推（85% 扩次）', machineCode: '家庭哑铃臀推', isPlateLoaded: false, defaultSeatNote: '肩胛搭凳' },
    },
    prescription: P(3, 14, 18, 2, 120, 'linda_d1_m1'),
    tempoGuide: T('积极顶起，努力扩次', '1秒', '带张力落回', '2秒', '🛑 底部悬空半秒', '⚡ 努力扩次到速度变慢即停（约 14–18 次）'),
    media: M('hip_thrust', ['85%重量', '冲14-18次']),
  },
  {
    id: 'linda_d5_m2',
    user: 'linda',
    day: 5,
    order: '2 大腿后侧',
    muscleGroup: 'glutes_hams',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '腿弯举机（85% 扩次）', machineCode: '🌟新馆 · 85% 插销', isPlateLoaded: false, defaultSeatNote: '同 Day1' },
      oldGym: { name: '腿弯举机（85% 扩次）', machineCode: '🏡旧馆 · 85%', isPlateLoaded: false, defaultSeatNote: '同主日' },
      home: { name: '弹力带腿弯举（85% 扩次）', machineCode: '🏡家庭弹力带', isPlateLoaded: false, defaultSeatNote: '同主日' },
    },
    prescription: P(3, 15, 20, 2, 90, 'linda_d1_m2'),
    tempoGuide: T('积极勾起', '1秒', '控制下放', '2秒', '🛑 底部拉开', '⚡ 努力扩次（约 15–20 次）'),
    media: M('leg_curl', ['85%重量', '冲15-20次']),
  },
  {
    id: 'linda_d5_m3',
    user: 'linda',
    day: 5,
    order: '3 胸部',
    muscleGroup: 'chest',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '【图4/5】飞鸟夹胸（85% 扩次）', machineCode: '🌟图4/5 · 85% 插销', isPlateLoaded: false, defaultSeatNote: '同 Day3' },
      oldGym: { name: '蝴蝶机夹胸（85% 扩次）', machineCode: '🏡旧馆 · 85%', isPlateLoaded: false, defaultSeatNote: '同主日' },
      home: { name: '掌根哑铃卧推（85% 扩次）', machineCode: '🏡家庭掌根哑铃卧推', isPlateLoaded: false, defaultSeatNote: '掌根受力空握' },
    },
    prescription: P(3, 14, 18, 2, 90, 'linda_d3_m1'),
    tempoGuide: T('积极合拢，努力扩次', '1秒', '控制打开', '2秒', '🛑 底部停 1 秒', '⚡ 努力扩次（约 14–18 次）'),
    media: M('fly', ['85%重量', '冲14-18次']),
  },
  {
    id: 'linda_d5_m4',
    user: 'linda',
    day: 5,
    order: '4 背部',
    muscleGroup: 'back',
    category: 'compound',
    venues: ALL,
    variants: {
      newGym: { name: '【图9/11】插销划船（85% 扩次）', machineCode: '🌟图9/11 · 85% 插销', isPlateLoaded: false, defaultSeatNote: '同 Day4' },
      oldGym: { name: '高位下拉 / 坐姿划船（85% 扩次）', machineCode: '🏡旧馆 · 85%', isPlateLoaded: false, defaultSeatNote: '同主日' },
      home: { name: '弹力带高位下拉（85% 扩次）', machineCode: '🏡家庭弹力带', isPlateLoaded: false, defaultSeatNote: '门锚高位' },
    },
    prescription: P(3, 14, 18, 2, 90, 'linda_d4_m2'),
    tempoGuide: T('沉肩拉到底夹肩胛', '1秒', '前送打开', '2秒', '🛑 底部停 1 秒', '⚡ 努力扩次（约 14–18 次）'),
    media: M('row', ['85%重量', '冲14-18次']),
  },
  {
    id: 'linda_d5_m5',
    user: 'linda',
    day: 5,
    order: '5 直角肩',
    muscleGroup: 'shoulders',
    category: 'isolation',
    venues: ALL,
    variants: {
      newGym: { name: '【图4/5】飞鸟机侧平举（100% 原重量）', machineCode: '🌟图4/5 · LATERAL', isPlateLoaded: false, defaultSeatNote: '同 Day3' },
      oldGym: { name: '龙门架脚踝扣侧平举（100%）', machineCode: '🏡旧馆', isPlateLoaded: false, defaultSeatNote: '脚踝扣' },
      home: { name: '弹力带脚踝扣侧平举（100%）', machineCode: '家庭 · 弹力带', isPlateLoaded: false, defaultSeatNote: '脚踝扣' },
    },
    prescription: P(2, 15, 20, 1, 60, 'linda_d3_m2'),
    tempoGuide: T('抬至肩高停 0.5 秒', '1秒', '慢放', '2秒', '保持张力', '孤立动作保持原重量 2 组'),
    media: M('lateral_raise', ['100%原重量', '2组']),
  },
  {
    id: 'linda_d5_m6',
    user: 'linda',
    day: 5,
    order: '6 美背体态',
    muscleGroup: 'shoulders',
    category: 'isolation',
    venues: ALL,
    variants: {
      newGym: { name: '【图4/5】飞鸟机后束（100% 原重量）', machineCode: '🌟图4/5 · REAR LATERAL', isPlateLoaded: false, defaultSeatNote: '同 Day4' },
      oldGym: { name: '龙门架脚踝扣面拉（100%）', machineCode: '🏡旧馆', isPlateLoaded: false, defaultSeatNote: '脚踝扣' },
      home: { name: '弹力带脚踝扣面拉（100%）', machineCode: '家庭 · 弹力带', isPlateLoaded: false, defaultSeatNote: '脚踝扣' },
    },
    prescription: P(2, 15, 20, 1, 60, 'linda_d4_m3'),
    tempoGuide: T('向后展肩停 1 秒', '1秒', '缓慢还原', '2秒', '底部展开', '孤立动作保持原重量 2 组'),
    media: M('rear_delt', ['100%原重量', '2组']),
  },
]

/** V2.5：统计与历史检索所需的全量动作清单（供 AnalyticsModal 使用） */
export const ALL_EXERCISES = PLAN_LIBRARY

/** 每天的元信息（Day 2 / 6 为有氧，7 / 8 为静息） */
export const DAY_META = [
  { day: 1, type: 'strength', title: '下肢重装日', sub: '爆发力 + 股四头 + 伸髋后链', emoji: '🟢' },
  { day: 2, type: 'zone2', title: '洗刷日', sub: 'Zone 2 主动恢复跑', emoji: '🔵' },
  { day: 3, type: 'strength', title: '铠甲日', sub: '推力：推胸 + 站立飞鸟 + 三头', emoji: '🟠' },
  { day: 4, type: 'strength', title: '插件日', sub: '拉力：划船 + 后束 + 二头', emoji: '🟣' },
  { day: 5, type: 'strength', title: '第二遍扩次日', sub: '85% 重量努力冲次数', emoji: '🟡' },
  { day: 6, type: 'hiit', title: '绞肉机日', sub: '4×4 HIIT 间歇', emoji: '🔴' },
  { day: 7, type: 'rest', title: '静息日', sub: '严禁摸铁，超量恢复', emoji: '⚪' },
  { day: 8, type: 'rest', title: '静息日', sub: '中枢神经与肌糖原恢复', emoji: '⚪' },
]

export const USERS = {
  leo: { key: 'leo', label: 'Leo', emoji: '🦁', accent: 'sky', avatar: '/images/leo-avatar.png' },
  linda: { key: 'linda', label: 'Linda', emoji: '🦢', accent: 'rose', avatar: '/images/linda-avatar.jpg' },
}

export const VENUE_MODES = {
  newGym: { key: 'newGym', label: '🌟乐刻新馆', hint: 'Leo帮挂片/插销神机' },
  oldGym: { key: 'oldGym', label: '🏢传统旧馆', hint: '经典插销器械 + 龙门架' },
  home: { key: 'home', label: '🏠家庭重装', hint: '37KG哑铃凳 + 弹力带/金属钩' },
}

/**
 * 根据当前用户、日期(Day 1-8) 与 场馆模式(newGym / oldGym / home)
 * 返回该场馆专属的动作列表，并合并场馆特有的组数、次数与器械信息。
 */
export function getExercisesForDayAndVenue(user, day, venueMode) {
  return PLAN_LIBRARY.filter(
    (item) => item.user === user && item.day === Number(day) && item.venues.includes(venueMode)
  ).map((item) => {
    const v = item.variants[venueMode] || item.variants.newGym
    return {
      ...item,
      activeVariant: {
        name: v.name,
        machineCode: v.machineCode,
        isPlateLoaded: Boolean(v.isPlateLoaded),
        defaultSeatNote: v.defaultSeatNote || '标准机位',
      },
      prescription: {
        ...item.prescription,
        ...(v.prescription || {}),
      },
    }
  })
}

/** 自定义计划缺失四段式口诀时的兜底节奏 */
const FALLBACK_TEMPO = {
  concentric: { time: '1秒', cue: '发力向心 1 秒' },
  topPause: { time: '0–1秒', cue: '顶点挤压' },
  eccentric: { time: '2秒', cue: '离心控制 2 秒' },
  bottomPause: { time: '1秒', cue: '底部稳停 1 秒' },
  overloadCue: '',
}

/**
 * V2.6 合并 AI 导入的自定义计划后的当日动作列表
 * - customPlan 为空 → 等价于 getExercisesForDayAndVenue（内置 ACSM 2026 计划）
 * - customPlan 中命中 user + day + venueMode 的条目按 id 覆盖或追加
 */
export function buildDayExercises(user, day, venueMode, customPlan) {
  const base = getExercisesForDayAndVenue(user, day, venueMode)
  if (!Array.isArray(customPlan) || !customPlan.length) return base

  const customForDay = customPlan.filter(
    (it) =>
      it.user === user &&
      Number(it.day) === Number(day) &&
      (!it.venues || it.venues.includes(venueMode))
  )
  if (!customForDay.length) return base

  const merged = new Map(base.map((x) => [x.id, x]))
  for (const item of customForDay) {
    const v = item.variants?.[venueMode] || item.variants?.newGym || {}
    merged.set(item.id, {
      ...item,
      activeVariant: {
        name: v.name || item.order || item.id,
        machineCode: v.machineCode || '',
        isPlateLoaded: Boolean(v.isPlateLoaded),
        defaultSeatNote: v.defaultSeatNote || '标准机位',
      },
      prescription: {
        ...(item.prescription || {}),
        ...(v.prescription || {}),
        repRange: v.repRange || item.prescription?.repRange || [8, 12],
        sets: v.sets ?? item.prescription?.sets ?? 3,
      },
      tempoGuide: item.tempoGuide || FALLBACK_TEMPO,
      media: item.media || { keyPointsOverlay: [] },
    })
  }
  return [...merged.values()]
}
