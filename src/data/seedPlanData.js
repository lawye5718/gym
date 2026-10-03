/**
 * 《8天循环训练计划 V6》训练计划数据库（V3.0 课表 · 四维双目标版）
 *
 * 依据：`v3.0.pdf`（V6 体系规范）+《增肌 8 天循环训练计划 v3》表格
 *
 * 结构（V6 修正骨架）：
 *   D1 下肢A（股四主导+臀）  D2 上肢A（推优先+背宽）  D3 Zone 2 低强心肺
 *   D4 下肢B（后链+手臂）    D5 上肢B（拉优先+胸+后束）  D6 4×4 HIIT
 *   D7 / D8 主动休整（散步打卡）
 *
 * 铁律：
 *  - Leo / Linda 共用同一课表；Linda 通过「器械版 + 金属宽面钩」完成死手适配
 *  - 每张卡写入三个场馆的 defaultWeight / sets / defaultRepsList，彻底消灭初始 0kg
 *  - 首个复合动作标 isFirstCompound → 绿灯日触发「爆发向心(~1s)」提示
 *  - 复合主项标 freeEquiv / lindaAllowedFree → 绿灯日可切换自由版，黄灯日强制器械版
 *
 * 字段：
 *  - venues        该动作出现的场馆
 *  - variants[v]   name / machineCode / isPlateLoaded / defaultWeight / sets / defaultRepsList / defaultSeatNote
 *  - prescription  sets / repRange / targetRIR / restSeconds
 *  - v6            isFirstCompound / freeEquiv / lindaAllowedFree / targetRPE
 *  - type          'superset' 时内嵌 subExercises: [A, B]
 */
import { V6_DAY_META } from './v6-workout-data'
import { flattenDayExercises } from '../utils/deckFlattener'

/* ─────────────── 基础工厂 ─────────────── */

const P = (sets, min, max, rir, rest) => ({
  sets,
  repRange: [min, max],
  targetRIR: rir,
  restSeconds: rest,
  day5SourceId: null,
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

const V = (name, machineCode, defaultWeight, sets, reps, opts = {}) => ({
  name,
  machineCode,
  defaultWeight,
  sets,
  defaultRepsList: reps,
  repRange: opts.repRange || [Math.min(...reps), Math.max(...reps)],
  isPlateLoaded: Boolean(opts.plate),
  defaultSeatNote: opts.seat || '标准机位',
})

const ALL = ['newGym', 'oldGym', 'home']

/* ─────────────── 四段式节奏模板 ─────────────── */
const TEMPO_EXPLOSIVE = T(
  '最大意图最快速度蹬起／推起（前 2 次 ~1s）',
  '<1秒',
  '稳稳下放 2-3 秒，底部停稳再发力',
  '2-3秒',
  '底部停稳卸掉惯性，严禁锁死弹震',
  '追求神经放电速度，前 2 次爆发后恢复常规节奏'
)
const TEMPO_COMPOUND = T('发力向心 1 秒，顶点微屈不锁死', '1秒', '控制下放至拉伸位', '2秒', '🛑 底部稳停 1 秒卸掉反弹力', '向心速度变慢即停，不硬撑力竭')
const TEMPO_ISO = T('顶峰挤压 1 秒', '1秒', '缓慢还原，离心 3 秒', '3秒', '顶峰/底部停顿 1 秒', '出现速度变慢即停，保持代谢压力')

/* ═══════════════════════════════════════════════════════════════════
 * V6 逐日动作规格（v3 修正骨架）
 * 每个 spec: { key, order, mg, cat, first?, free?, lindaFree?, sets, reps, rir, rest, v(user), media, tempo }
 * ss: 超级组，内嵌 [subA, subB]
 * ═══════════════════════════════════════════════════════════════════ */
const SPEC = {
  // ── D1 下肢 A（股四主导 + 臀）· 73 分钟 ──
  1: [
    {
      key: 'haack',
      order: '1 哈克深蹲机',
      mg: 'quads',
      cat: 'compound',
      first: true,
      free: '史密斯机深蹲 / 六角杠硬拉',
      lindaFree: true,
      sets: 4,
      reps: [8, 10],
      rir: 2,
      rest: 150,
      tempo: TEMPO_EXPLOSIVE,
      media: M('squat', ['背部贴死靠背', '踩踏板中下部', '下放到大腿平行']),
      v: (u) => ({
        newGym: V('哈克深蹲机', '新馆 · 哈克机', u === 'linda' ? 30 : 50, 4, [10, 10, 8, 8]),
        oldGym: V(u === 'linda' ? '哈克深蹲机（旧馆）' : '史密斯机深蹲', '旧馆 · 史密斯/哈克', u === 'linda' ? 30 : 50, 4, [10, 10, 8, 8]),
        home: V('哑铃保加利亚分腿蹲', '家庭 · 哑铃', u === 'linda' ? 12.5 : 15, 4, [10, 10, 8, 8]),
      }),
    },
    {
      key: 'legpress',
      order: '2 挂片倒蹬机（常规位）',
      mg: 'quads',
      cat: 'compound',
      sets: 3,
      reps: [10, 12],
      rir: 2,
      rest: 120,
      tempo: TEMPO_COMPOUND,
      media: M('legpress', ['下放贴近躯干不塌腰', '膝与脚尖同向', '不锁死膝']),
      v: (u) => ({
        newGym: V('挂片倒蹬机（常规位）', '新馆 · 挂片', u === 'linda' ? 60 : 90, 3, [12, 10, 10], { plate: true }),
        oldGym: V('45°挂片倒蹬机（常规位）', '旧馆 · 挂片', u === 'linda' ? 60 : 100, 3, [12, 10, 10], { plate: true }),
        home: V('宽距酒杯深蹲', '家庭 · 哑铃', u === 'linda' ? 15 : 22.5, 3, [12, 10, 10]),
      }),
    },
    {
      key: 'legext',
      order: '3 坐姿腿屈伸',
      mg: 'quads',
      cat: 'isolation',
      sets: 3,
      reps: [12, 15],
      rir: 1,
      rest: 90,
      tempo: TEMPO_ISO,
      media: M('legext', ['顶峰停 1 秒', '离心 3 秒', '重量宁轻勿重']),
      v: (u) => ({
        newGym: V('坐姿腿屈伸机', '新馆 · 插销器械', u === 'linda' ? 25 : 45, 3, [15, 12, 12]),
        oldGym: V('坐姿腿屈伸机', '旧馆 · 插销器械', u === 'linda' ? 25 : 45, 3, [15, 12, 12]),
        home: V('靠墙静蹲夹球 / 慢速深蹲', '家庭 · 徒手', u === 'linda' ? 10 : 15, 3, [15, 12, 12]),
      }),
    },
    {
      key: 'legcurl',
      order: '4 腿弯举',
      mg: 'glutes_hams',
      cat: 'isolation',
      sets: 4,
      reps: [10, 12],
      rir: 2,
      rest: 90,
      tempo: TEMPO_ISO,
      media: M('legcurl', ['离心 3 秒', '髋部贴垫不抬起', '不靠弹震']),
      v: (u) => ({
        newGym: V('坐姿腿弯举机', '新馆 · 插销器械', u === 'linda' ? 25 : 40, 4, [12, 12, 10, 10]),
        oldGym: V('坐姿腿弯举机', '旧馆 · 插销器械', u === 'linda' ? 25 : 40, 4, [12, 12, 10, 10]),
        home: V('仰卧滑盘双腿弯举', '家庭 · 滑盘', 0, 4, [12, 12, 10, 10]),
      }),
    },
    {
      key: 'hipthrust',
      order: '5 臀推机 INSIGHT',
      mg: 'glutes_hams',
      cat: 'compound',
      sets: 5,
      reps: [10, 12],
      rir: 2,
      rest: 90,
      tempo: TEMPO_COMPOUND,
      media: M('hip_thrust', ['肩胛下缘靠垫', '脚跟蹬地夹臀', '顶点后倾停 1 秒']),
      v: (u) => ({
        newGym: V('臀推机 INSIGHT', '新馆 · 插销器械', u === 'linda' ? 40 : 60, 5, [12, 12, 10, 10, 10]),
        oldGym: V('史密斯臀推', '旧馆 · 史密斯', u === 'linda' ? 40 : 60, 5, [12, 12, 10, 10, 10]),
        home: V('哑铃臀推', '家庭 · 哑铃', u === 'linda' ? 15 : 20, 5, [12, 12, 10, 10, 10]),
      }),
    },
  ],

  // ── D2 上肢 A（推优先 + 背宽）· 72 分钟 ──
  2: [
    {
      key: 'chestpress',
      order: '1 挂片坐姿推胸机 LIFEFIT',
      mg: 'chest',
      cat: 'compound',
      first: true,
      free: '平凳杠铃卧推 / 哑铃卧推（Linda禁用）',
      lindaFree: false,
      sets: 4,
      reps: [8, 10],
      rir: 2,
      rest: 120,
      tempo: TEMPO_EXPLOSIVE,
      media: M('chest_press', ['手腕与肩同高', '肩胛后收下沉', '顶点不锁死肘']),
      v: (u) => ({
        newGym: V('挂片坐姿推胸机 LIFEFIT', '新馆 · 挂片', u === 'linda' ? 20 : 40, 4, [10, 10, 8, 8], { plate: true }),
        oldGym: V('插销坐姿推胸机', '旧馆 · 插销', u === 'linda' ? 20 : 40, 4, [10, 10, 8, 8]),
        home: V('掌根哑铃卧推（单只计）', '家庭 · 哑铃', u === 'linda' ? 10 : 17.5, 4, [10, 10, 8, 8]),
      }),
    },
    {
      key: 'pecdeck',
      order: '2 蝴蝶机夹胸',
      mg: 'chest',
      cat: 'isolation',
      sets: 4,
      reps: [12, 15],
      rir: 1,
      rest: 60,
      tempo: TEMPO_ISO,
      media: M('fly', ['肘推挡板手不抓握', '顶峰停 1 秒', '离心 3 秒']),
      v: (u) => ({
        newGym: V('蝴蝶机夹胸', '新馆 · 插销器械', u === 'linda' ? 15 : 30, 4, [15, 15, 12, 12]),
        oldGym: V('蝴蝶机夹胸', '旧馆 · 插销器械', u === 'linda' ? 15 : 30, 4, [15, 15, 12, 12]),
        home: V('弹力带夹胸', '家庭 · 弹力带', u === 'linda' ? 8 : 12.5, 4, [15, 15, 12, 12]),
      }),
    },
    {
      key: 'shoulderpress',
      order: '3 坐姿推肩机',
      mg: 'shoulders',
      cat: 'compound',
      free: '站姿杠铃/哑铃推举（Linda禁用）',
      lindaFree: false,
      sets: 3,
      reps: [10, 12],
      rir: 2,
      rest: 90,
      tempo: TEMPO_COMPOUND,
      media: M('shoulder_press', ['手肘前收 30 度', '全程不耸肩', '顶点不锁死']),
      v: (u) => ({
        newGym: V('坐姿推肩机', '新馆 · 插销器械', u === 'linda' ? 15 : 30, 3, [12, 10, 10]),
        oldGym: V('坐姿推肩机', '旧馆 · 插销器械', u === 'linda' ? 15 : 30, 3, [12, 10, 10]),
        home: V('掌根哑铃坐姿推举（单只计）', '家庭 · 哑铃', u === 'linda' ? 8 : 12.5, 3, [12, 10, 10]),
      }),
    },
    {
      key: 'pulldown',
      order: '4 高位下拉机',
      mg: 'back',
      cat: 'compound',
      free: '助力引体 / 自体重引体（Linda禁用）',
      lindaFree: false,
      sets: 3,
      reps: [10, 12],
      rir: 2,
      rest: 90,
      tempo: TEMPO_COMPOUND,
      media: M('pulldown', ['先沉肩再拉', '肘向下向后走', '离心 3 秒']),
      v: (u) =>
        u === 'linda'
          ? {
              newGym: V('高位下拉机（窄对握 + 金属宽钩）', '新馆 · 金属宽钩零抓握', 30, 3, [12, 10, 10], { seat: '金属宽面钩' }),
              oldGym: V('高位下拉机（窄对握 + 金属宽钩）', '旧馆 · 金属宽钩零抓握', 30, 3, [12, 10, 10], { seat: '金属宽面钩' }),
              home: V('弹力带高位下拉（手腕套扣）', '家庭 · 脚踝扣套腕', 15, 3, [12, 10, 10], { seat: '手腕套扣' }),
            }
          : {
              newGym: V('高位下拉机（宽握）', '新馆 · 插销器械', 55, 3, [12, 10, 10]),
              oldGym: V('高位下拉机（宽握）', '旧馆 · 插销器械', 50, 3, [12, 10, 10]),
              home: V('弹力带高位下拉', '家庭 · 弹力带', 20, 3, [12, 10, 10]),
            },
    },
    {
      key: 'row',
      order: '5 坐姿划船机 UNIVERSAL',
      mg: 'back',
      cat: 'compound',
      free: '哑铃单臂划船 / 杠铃俯身划船（Linda禁用）',
      lindaFree: false,
      sets: 3,
      reps: [10, 12],
      rir: 2,
      rest: 90,
      tempo: TEMPO_COMPOUND,
      media: M('row', ['胸垫贴紧不顶死', '肘往后捅', '顶峰停 1 秒']),
      v: (u) =>
        u === 'linda'
          ? {
              newGym: V('挂片坐姿划船机（胸垫 + 金属钩）', '新馆 · 胸垫零剪切', 30, 3, [12, 10, 10], { seat: '胸垫贴紧' }),
              oldGym: V('挂片坐姿划船机（胸垫 + 金属钩）', '旧馆 · 胸垫零剪切', 30, 3, [12, 10, 10], { seat: '胸垫贴紧' }),
              home: V('弹力带胸垫划船（手腕套扣）', '家庭 · 脚踝扣', 15, 3, [12, 10, 10], { seat: '手腕套扣' }),
            }
          : {
              newGym: V('坐姿划船机 UNIVERSAL', '新馆 · 插销器械', 50, 3, [12, 10, 10]),
              oldGym: V('坐姿划船机 UNIVERSAL', '旧馆 · 插销器械', 50, 3, [12, 10, 10]),
              home: V('金属钩哑铃划船（单只计）', '家庭 · 哑铃', 20, 3, [12, 10, 10]),
            },
    },
    {
      key: 'lateral',
      order: '6 多功能飞鸟 · 侧平举',
      mg: 'shoulders',
      cat: 'isolation',
      sets: 4,
      reps: [12, 15],
      rir: 1,
      rest: 60,
      tempo: TEMPO_ISO,
      media: M('lateral_raise', ['肘略高于腕', '顶峰停 1 秒', '不耸肩']),
      v: (u) =>
        u === 'linda'
          ? {
              newGym: V('免绑扣侧平举（手腕套扣）', '新馆 · 脚踝扣套腕', 5, 4, [15, 15, 12, 12], { seat: '手腕套扣' }),
              oldGym: V('脚踝扣侧平举', '旧馆 · 脚踝扣', 5, 4, [15, 15, 12, 12], { seat: '手腕套扣' }),
              home: V('弹力带侧平举', '家庭 · 弹力带', 3, 4, [15, 15, 12, 12]),
            }
          : {
              newGym: V('多功能飞鸟 · 侧平举', '新馆 · 插销器械', 10, 4, [15, 15, 12, 12]),
              oldGym: V('飞鸟机侧平举', '旧馆 · 插销器械', 8, 4, [15, 15, 12, 12]),
              home: V('哑铃侧平举（单只计）', '家庭 · 哑铃', 5, 4, [15, 15, 12, 12]),
            },
    },
  ],

  // ── D4 下肢 B（后链：臀与腘绳 + 手臂）· 73 分钟 ──
  4: [
    {
      key: 'rdl',
      order: '1 杠铃罗马尼亚硬拉（当日第一个）',
      mg: 'glutes_hams',
      cat: 'compound',
      first: true,
      free: null,
      lindaFree: true,
      sets: 3,
      reps: [8, 10],
      rir: 2,
      rest: 150,
      tempo: TEMPO_EXPLOSIVE,
      media: M('rdl', ['膝微屈固定', '髋向后推', '杠贴腿下行不反弓']),
      v: (u) => ({
        newGym: V('杠铃罗马尼亚硬拉 RDL', '新馆 · 奥杆（RIR2）', u === 'linda' ? 30 : 60, 3, [10, 10, 8], { seat: u === 'linda' ? '金属宽面钩' : '标准站位' }),
        oldGym: V('杠铃罗马尼亚硬拉 RDL', '旧馆 · 奥杆（RIR2）', u === 'linda' ? 30 : 60, 3, [10, 10, 8], { seat: u === 'linda' ? '金属宽面钩' : '标准站位' }),
        home: V('双手哑铃罗马尼亚硬拉（单只计）', '家庭 · 哑铃', u === 'linda' ? 12.5 : 22.5, 3, [10, 10, 8]),
      }),
    },
    {
      key: 'hipthrust',
      order: '2 臀推机 INSIGHT',
      mg: 'glutes_hams',
      cat: 'compound',
      sets: 4,
      reps: [10, 12],
      rir: 2,
      rest: 90,
      tempo: TEMPO_COMPOUND,
      media: M('hip_thrust', ['顶点夹臀停 1 秒', '脚跟蹬地非挺腰', '不塌腰']),
      v: (u) => ({
        newGym: V('臀推机 INSIGHT', '新馆 · 插销器械', u === 'linda' ? 40 : 60, 4, [12, 12, 10, 10]),
        oldGym: V('史密斯臀推', '旧馆 · 史密斯', u === 'linda' ? 40 : 60, 4, [12, 12, 10, 10]),
        home: V('哑铃臀推', '家庭 · 哑铃', u === 'linda' ? 15 : 20, 4, [12, 12, 10, 10]),
      }),
    },
    {
      key: 'legpress',
      order: '3 挂片倒蹬机（脚踩偏高偏宽）',
      mg: 'quads',
      cat: 'compound',
      sets: 3,
      reps: [10, 12],
      rir: 2,
      rest: 120,
      tempo: TEMPO_COMPOUND,
      media: M('legpress', ['脚踩偏高偏宽', '力量传导到臀与后侧', '膝不内扣']),
      v: (u) => ({
        newGym: V('挂片倒蹬机（脚偏高偏宽）', '新馆 · 挂片', u === 'linda' ? 60 : 90, 3, [12, 10, 10], { plate: true }),
        oldGym: V('45°挂片倒蹬机（脚偏高偏宽）', '旧馆 · 挂片', u === 'linda' ? 60 : 100, 3, [12, 10, 10], { plate: true }),
        home: V('宽距酒杯深蹲', '家庭 · 哑铃', u === 'linda' ? 15 : 22.5, 3, [12, 10, 10]),
      }),
    },
    {
      key: 'legcurl',
      order: '4 腿弯举',
      mg: 'glutes_hams',
      cat: 'isolation',
      sets: 5,
      reps: [12, 15],
      rir: 1,
      rest: 90,
      tempo: TEMPO_ISO,
      media: M('legcurl', ['离心 3 秒', '髋部不抬离垫', '不靠弹震']),
      v: (u) => ({
        newGym: V('坐姿腿弯举机', '新馆 · 插销器械', u === 'linda' ? 25 : 40, 5, [15, 15, 12, 12, 12]),
        oldGym: V('坐姿腿弯举机', '旧馆 · 插销器械', u === 'linda' ? 25 : 40, 5, [15, 15, 12, 12, 12]),
        home: V('仰卧滑盘双腿弯举', '家庭 · 滑盘', 0, 5, [15, 15, 12, 12, 12]),
      }),
    },
    {
      key: 'ss_arm',
      order: '5 手臂超级组（牧师凳弯举 + 三头下压）',
      mg: 'arms',
      cat: 'superset',
      sets: 3,
      reps: [12, 15],
      rir: 1,
      rest: 60,
      tempo: TEMPO_ISO,
      media: M('superset_arm', ['超级组 A→B 连做', '组内不停', '大臂锁死贴垫']),
      ss: [
        {
          key: 'ss_arm_a',
          order: '超级组A 牧师凳弯举',
          mg: 'arms',
          cat: 'isolation',
          sets: 3,
          reps: [12, 15],
          rir: 1,
          tempo: TEMPO_ISO,
          media: M('biceps', ['大臂锁死贴垫', '离心 3 秒', '底部留 10° 微屈']),
          v: (u) =>
            u === 'linda'
              ? {
                  newGym: V('龙门架脚踝扣弯举', '新馆 · 脚踝扣套腕', 7.5, 3, [15, 15, 12], { seat: '手腕套扣' }),
                  oldGym: V('龙门架脚踝扣弯举', '旧馆 · 脚踝扣套腕', 7.5, 3, [15, 15, 12], { seat: '手腕套扣' }),
                  home: V('牧师凳虚握弯举（单只计）', '家庭 · 哑铃', 5, 3, [15, 15, 12], { seat: '虚握护腕' }),
                }
              : {
                  newGym: V('牧师凳弯举', '新馆 · 奥杆', 15, 3, [15, 15, 12]),
                  oldGym: V('牧师凳弯举', '旧馆 · 奥杆', 15, 3, [15, 15, 12]),
                  home: V('哑铃弯举（单只计）', '家庭 · 哑铃', 8, 3, [15, 15, 12]),
                },
        },
        {
          key: 'ss_arm_b',
          order: '超级组B 龙门架三头下压',
          mg: 'arms',
          cat: 'isolation',
          sets: 3,
          reps: [12, 15],
          rir: 1,
          tempo: TEMPO_ISO,
          media: M('triceps', ['肘夹紧不下滑', '掌根压到底', '不耸肩']),
          v: (u) =>
            u === 'linda'
              ? {
                  newGym: V('掌根三头下压（金属钩 V 把）', '新馆 · 金属钩 V 把', 12.5, 3, [15, 15, 12], { seat: '金属宽面钩' }),
                  oldGym: V('掌根三头下压（金属钩 V 把）', '旧馆 · 金属钩 V 把', 12.5, 3, [15, 15, 12], { seat: '金属宽面钩' }),
                  home: V('弹力带掌根下压', '家庭 · 弹力带', 8, 3, [15, 15, 12]),
                }
              : {
                  newGym: V('龙门架三头下压 V 把', '新馆 · 龙门架', 20, 3, [15, 15, 12]),
                  oldGym: V('龙门架三头下压 V 把', '旧馆 · 龙门架', 20, 3, [15, 15, 12]),
                  home: V('哑铃颈后臂屈伸（单只计）', '家庭 · 哑铃', 10, 3, [15, 15, 12]),
                },
        },
      ],
    },
    {
      key: 'calf',
      order: '6 站姿提踵',
      mg: 'calves',
      cat: 'isolation',
      sets: 3,
      reps: [15, 20],
      rir: 1,
      rest: 60,
      tempo: TEMPO_ISO,
      media: M('calf', ['顶峰停 1 秒', '脚跟充分下落拉伸', '不弹震']),
      v: (u) => ({
        newGym: V('站姿器械提踵', '新馆 · 插销器械', u === 'linda' ? 40 : 60, 3, [20, 18, 15]),
        oldGym: V('史密斯提踵', '旧馆 · 史密斯', u === 'linda' ? 40 : 50, 3, [20, 18, 15]),
        home: V('单腿台阶哑铃提踵', '家庭 · 哑铃', u === 'linda' ? 8 : 12.5, 3, [20, 18, 15]),
      }),
    },
  ],

  // ── D5 上肢 B（拉优先 + 胸厚度 + 后束）· 71 分钟 ──
  5: [
    {
      key: 'pulldown',
      order: '1 高位下拉机',
      mg: 'back',
      cat: 'compound',
      first: true,
      free: '助力引体 / 自体重引体（Linda禁用）',
      lindaFree: false,
      sets: 4,
      reps: [8, 10],
      rir: 2,
      rest: 150,
      tempo: TEMPO_EXPLOSIVE,
      media: M('pulldown', ['先沉肩再拉', '肘向下向后走', '离心 3 秒']),
      v: (u) =>
        u === 'linda'
          ? {
              newGym: V('高位下拉机（窄对握 + 金属宽钩）', '新馆 · 金属宽钩零抓握', 30, 4, [10, 10, 8, 8], { seat: '金属宽面钩' }),
              oldGym: V('高位下拉机（窄对握 + 金属宽钩）', '旧馆 · 金属宽钩零抓握', 30, 4, [10, 10, 8, 8], { seat: '金属宽面钩' }),
              home: V('弹力带高位下拉（手腕套扣）', '家庭 · 脚踝扣套腕', 15, 4, [10, 10, 8, 8], { seat: '手腕套扣' }),
            }
          : {
              newGym: V('高位下拉机（宽握）', '新馆 · 插销器械', 55, 4, [10, 10, 8, 8]),
              oldGym: V('高位下拉机（宽握）', '旧馆 · 插销器械', 50, 4, [10, 10, 8, 8]),
              home: V('弹力带高位下拉', '家庭 · 弹力带', 20, 4, [10, 10, 8, 8]),
            },
    },
    {
      key: 'row',
      order: '2 挂片坐姿划船机 LIFEFIT（胸垫支撑）',
      mg: 'back',
      cat: 'compound',
      sets: 3,
      reps: [10, 12],
      rir: 2,
      rest: 90,
      tempo: TEMPO_COMPOUND,
      media: M('row', ['胸垫顶死护腰椎', '肘往后捅', '顶峰停 1 秒']),
      v: (u) => ({
        newGym: V('挂片坐姿划船机 LIFEFIT（胸垫）', '新馆 · 挂片', u === 'linda' ? 30 : 50, 3, [12, 10, 10], { plate: true, seat: '胸垫顶死' }),
        oldGym: V('挂片坐姿划船机（胸垫）', '旧馆 · 挂片', u === 'linda' ? 30 : 50, 3, [12, 10, 10], { plate: true, seat: '胸垫顶死' }),
        home: V('金属钩哑铃划船（单只计）', '家庭 · 哑铃', u === 'linda' ? 12.5 : 20, 3, [12, 10, 10]),
      }),
    },
    {
      key: 'bench',
      order: '3 水平卧推机 HORIZONTAL',
      mg: 'chest',
      cat: 'compound',
      sets: 4,
      reps: [8, 10],
      rir: 2,
      rest: 120,
      tempo: TEMPO_COMPOUND,
      media: M('chest_press', ['座椅调至手腕与肩同高', '顶点不锁死肘', '肩胛后收']),
      v: (u) => ({
        newGym: V('水平卧推机 HORIZONTAL', '新馆 · 挂片', u === 'linda' ? 20 : 40, 4, [10, 10, 8, 8], { plate: true }),
        oldGym: V('水平卧推机', '旧馆 · 挂片', u === 'linda' ? 20 : 40, 4, [10, 10, 8, 8], { plate: true }),
        home: V('掌根哑铃卧推（单只计）', '家庭 · 哑铃', u === 'linda' ? 10 : 17.5, 4, [10, 10, 8, 8]),
      }),
    },
    {
      key: 'reardelt',
      order: '4 多功能飞鸟 · 俯身侧平举',
      mg: 'shoulders',
      cat: 'isolation',
      sets: 5,
      reps: [12, 15],
      rir: 1,
      rest: 60,
      tempo: TEMPO_ISO,
      media: M('rear_delt', ['胸贴靠垫', '肘领先于手', '离心 3 秒']),
      v: (u) =>
        u === 'linda'
          ? {
              newGym: V('免绑扣俯身侧平举（手腕套扣）', '新馆 · 脚踝扣套腕', 5, 5, [15, 15, 12, 12, 12], { seat: '手腕套扣' }),
              oldGym: V('脚踝扣俯身侧平举', '旧馆 · 脚踝扣', 5, 5, [15, 15, 12, 12, 12], { seat: '手腕套扣' }),
              home: V('弹力带俯身侧平举', '家庭 · 弹力带', 3, 5, [15, 15, 12, 12, 12]),
            }
          : {
              newGym: V('多功能飞鸟 · 俯身侧平举', '新馆 · 插销器械', 10, 5, [15, 15, 12, 12, 12]),
              oldGym: V('飞鸟机俯身侧平举', '旧馆 · 插销器械', 8, 5, [15, 15, 12, 12, 12]),
              home: V('哑铃俯身侧平举（单只计）', '家庭 · 哑铃', 5, 5, [15, 15, 12, 12, 12]),
            },
    },
    {
      key: 'ss_arm',
      order: '5 手臂超级组（牧师凳弯举 + 三头下压）',
      mg: 'arms',
      cat: 'superset',
      sets: 3,
      reps: [12, 15],
      rir: 1,
      rest: 60,
      tempo: TEMPO_ISO,
      media: M('superset_arm', ['超级组 A→B 连做', '组内不停', '大臂锁死贴垫']),
      ss: [
        {
          key: 'ss_arm_a',
          order: '超级组A 牧师凳弯举',
          mg: 'arms',
          cat: 'isolation',
          sets: 3,
          reps: [12, 15],
          rir: 1,
          tempo: TEMPO_ISO,
          media: M('biceps', ['大臂锁死贴垫', '离心 3 秒', '底部留 10° 微屈']),
          v: (u) =>
            u === 'linda'
              ? {
                  newGym: V('龙门架脚踝扣弯举', '新馆 · 脚踝扣套腕', 7.5, 3, [15, 15, 12], { seat: '手腕套扣' }),
                  oldGym: V('龙门架脚踝扣弯举', '旧馆 · 脚踝扣套腕', 7.5, 3, [15, 15, 12], { seat: '手腕套扣' }),
                  home: V('牧师凳虚握弯举（单只计）', '家庭 · 哑铃', 5, 3, [15, 15, 12], { seat: '虚握护腕' }),
                }
              : {
                  newGym: V('牧师凳弯举', '新馆 · 奥杆', 15, 3, [15, 15, 12]),
                  oldGym: V('牧师凳弯举', '旧馆 · 奥杆', 15, 3, [15, 15, 12]),
                  home: V('哑铃弯举（单只计）', '家庭 · 哑铃', 8, 3, [15, 15, 12]),
                },
        },
        {
          key: 'ss_arm_b',
          order: '超级组B 龙门架三头下压',
          mg: 'arms',
          cat: 'isolation',
          sets: 3,
          reps: [12, 15],
          rir: 1,
          tempo: TEMPO_ISO,
          media: M('triceps', ['肘夹紧不下滑', '掌根压到底', '不耸肩']),
          v: (u) =>
            u === 'linda'
              ? {
                  newGym: V('掌根三头下压（金属钩 V 把）', '新馆 · 金属钩 V 把', 12.5, 3, [15, 15, 12], { seat: '金属宽面钩' }),
                  oldGym: V('掌根三头下压（金属钩 V 把）', '旧馆 · 金属钩 V 把', 12.5, 3, [15, 15, 12], { seat: '金属宽面钩' }),
                  home: V('弹力带掌根下压', '家庭 · 弹力带', 8, 3, [15, 15, 12]),
                }
              : {
                  newGym: V('龙门架三头下压 V 把', '新馆 · 龙门架', 20, 3, [15, 15, 12]),
                  oldGym: V('龙门架三头下压 V 把', '旧馆 · 龙门架', 20, 3, [15, 15, 12]),
                  home: V('哑铃颈后臂屈伸（单只计）', '家庭 · 哑铃', 10, 3, [15, 15, 12]),
                },
        },
      ],
    },
    {
      key: 'calf',
      order: '6 倒蹬机提踵',
      mg: 'calves',
      cat: 'isolation',
      sets: 3,
      reps: [15, 20],
      rir: 1,
      rest: 60,
      tempo: TEMPO_ISO,
      media: M('calf', ['顶峰停 1 秒', '脚跟充分下落拉伸', '与站姿提踵可互换']),
      v: (u) => ({
        newGym: V('倒蹬机提踵', '新馆 · 挂片', u === 'linda' ? 60 : 100, 3, [20, 18, 15], { plate: true }),
        oldGym: V('倒蹬机提踵', '旧馆 · 挂片', u === 'linda' ? 60 : 90, 3, [20, 18, 15], { plate: true }),
        home: V('单腿台阶哑铃提踵', '家庭 · 哑铃', u === 'linda' ? 8 : 12.5, 3, [20, 18, 15]),
      }),
    },
  ],
}

/* ─────────────── 构建 PLAN_LIBRARY ─────────────── */

function buildVariants(spec, user) {
  return spec.v(user)
}

function mkItem(user, day, spec) {
  const isSS = spec.cat === 'superset' && Array.isArray(spec.ss)
  const sets = spec.sets
  const [minR, maxR] = spec.reps
  const item = {
    id: `${user}_d${day}_${spec.key}`,
    user,
    day,
    order: spec.order,
    muscleGroup: spec.mg,
    category: spec.cat,
    venues: ALL,
    prescription: P(sets, minR, maxR, spec.rir, spec.rest),
    tempoGuide: spec.tempo,
    media: spec.media,
    v6: {
      isFirstCompound: Boolean(spec.first),
      freeEquiv: spec.free || null,
      lindaAllowedFree: Boolean(spec.lindaFree),
      targetRPE: spec.cat === 'isolation' ? '8-9' : 8,
    },
  }

  if (isSS) {
    item.type = 'superset'
    item.subExercises = spec.ss.map((sub) => ({
      id: `${user}_d${day}_${sub.key}`,
      user,
      day,
      order: sub.order,
      muscleGroup: sub.mg,
      category: sub.cat,
      venues: ALL,
      variants: sub.v(user),
      prescription: P(sub.sets, sub.reps[0], sub.reps[1], sub.rir, sub.rest),
      tempoGuide: sub.tempo,
      media: sub.media,
      v6: { isFirstCompound: false, freeEquiv: null, lindaAllowedFree: false, targetRPE: '8-9' },
    }))
  } else {
    item.variants = buildVariants(spec, user)
  }
  return item
}

function buildLibrary() {
  const out = []
  for (const user of ['leo', 'linda']) {
    for (const dayKey of Object.keys(SPEC)) {
      const day = Number(dayKey)
      for (const spec of SPEC[day]) {
        out.push(mkItem(user, day, spec))
      }
    }
  }
  return out
}

export const PLAN_LIBRARY = buildLibrary()

/** 统计与历史检索所需的全量动作清单（含超级组展开由 flattenDayExercises 负责） */
export const ALL_EXERCISES = PLAN_LIBRARY

/** V6 8 天课表元信息（供 DaySwiper / WelcomeCard / CardioPanel / Analytics 使用） */
export const DAY_META = V6_DAY_META

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
 * 根据当前用户、日期(Day 1-8) 与场馆模式，返回该场馆专属的动作列表，
 * 并合并场馆特有的组数、次数与器械信息。
 */
export function getExercisesForDayAndVenue(user, day, venueMode) {
  return PLAN_LIBRARY.filter(
    (item) => item.user === user && item.day === Number(day) && item.venues.includes(venueMode)
  ).map((item) => {
    const v = item.variants?.[venueMode] || item.variants?.newGym || {}
    return {
      ...item,
      activeVariant: {
        name: v.name || item.order || item.id,
        machineCode: v.machineCode || '',
        isPlateLoaded: Boolean(v.isPlateLoaded),
        defaultSeatNote: v.defaultSeatNote || '标准机位',
      },
      prescription: {
        ...item.prescription,
        ...(v.prescription || {}),
        repRange: v.repRange || item.prescription?.repRange || [10, 12],
        sets: v.sets ?? item.prescription?.sets ?? 3,
      },
    }
  })
}

/**
 * 合并 AI 导入的自定义计划后的当日动作列表
 * - customPlan 为空 → 等价于 getExercisesForDayAndVenue（内置 V6 计划）
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
      tempoGuide: item.tempoGuide || TEMPO_COMPOUND,
      media: item.media || { keyPointsOverlay: [] },
      v6: item.v6 || { isFirstCompound: false, freeEquiv: null, lindaAllowedFree: false, targetRPE: 8 },
    })
  }
  return [...merged.values()]
}

/* V2.9：超级组展开逻辑独立为 utils/deckFlattener.js（清算卡与 ACSM 周容量审计共用） */
export { flattenDayExercises }

export const ALL_FLATTENED_EXERCISES = flattenDayExercises(PLAN_LIBRARY)
