/**
 * V2.6 「AI 训练计划格式生成固定 Prompt」
 * 用户在「训练计划导入 & 自定义头像中心」点击一键复制后，
 * 发给任意 AI（豆包 / DeepSeek / Gemini / ChatGPT），
 * AI 会输出标准 JSON，再粘贴回 App 即可生效（支持 patch 局部修改 / full 全量替换）。
 */
export const AI_PLAN_COMPILER_PROMPT = `你现在是《八天无极微循环》健身 App 的训练计划数据编译器。
请将我接下来提供的「训练计划自然语言描述或修改要求」，严格编译为 App 可直接导入的 JSON 格式（只输出纯 JSON 代码块，不要任何多余解释）。

### 黄金编译规则（必须严格遵守）：
1. **模式选择 (\`mode\`)**：
   - 如果我只要求修改某个人（Leo 或 Linda）的某几天（如只改 Day 3），请设 "mode": "patch"，并在 "targetUsers" 和 "targetDays" 中标明，App 会只覆盖那几天的动作，保留其余天数不变；
   - 如果我提供了完整的循环计划，请设 "mode": "full"。
2. **三馆拆分规则 (\`venues\` 与 \`variants\`)**：
   - 场馆枚举值固定为：["newGym", "oldGym", "home"]（🌟乐刻新馆 / 🏢传统旧馆 / 🏠家庭重装）。
   - 如果描述中用 / 分隔了 3 个动作名（如 "【图10/12】挂片长臂坐姿划船/助力引体/单臂哑铃划船"），请自动拆分为：newGym 对应第1个，oldGym 对应第2个，home 对应第3个。
   - 如果括号里单独注明了某场馆的独立动作集（如 "家庭版为4组臀推+4组RDL+4组保加利亚分腿蹲"），请为 "home" 单独生成独立的动作对象（设 "venues": ["home"]），而场馆动作设 "venues": ["newGym", "oldGym"]。
   - 凡是名称含“挂片”、“奥杆”、“臀推机(图7)”、“水平卧推(图2/3)”、“坐姿推胸(图6)”、“长臂划船(图10/12)”的器械，必须设 "isPlateLoaded": true。
3. **ACSM 2026 科学参数自动补全**：
   - 若我未明确写出休息秒数（restSeconds）和向心/离心口诀（tempoGuide），请你根据运动生物力学自动补全：
     - 爆发力动作 (category: "power")：休 120 秒，向心 "<1秒"（前2/3全力加速，末端15°主动减速不锁死），离心 "2秒"；
     - 大复合动作 (category: "compound")：休 120~150 秒，向心 "1秒"，离心 "2秒"，底部停顿 "底部拉伸位稳停1秒卸除反弹"；
     - 孤立小动作 (category: "isolation")：休 60~90 秒，向心 "1秒"，离心 "2秒"，顶峰/底部停顿 "顶峰挤压1秒，出现速度变慢即停"。
   - 若为 Day 5 的 85%扩次 动作，请将 "isDay5RepPush": true 写入 prescription，并自动填写 "day5SourceMuscle" 以便自动按主日 85% 折算重量。
4. **肌群分类枚举 (\`muscleGroup\`)**：
   - 必须严格从以下 6 个值中选择一个："quads" (股四头/下肢前链)、"glutes_hams" (臀大肌/腘绳后链)、"chest" (胸)、"back" (背)、"shoulders" (肩)、"arms" (二头/三头/核心)。
5. **V2.8 拆分铁律与默认值要求（必须遵守）**：
   - 凡是两个动作可能使用不同重量（如哈克深蹲 vs 45度倒蹬机、奥杆 RDL vs 哑铃 RDL、器械推肩 vs 哑铃推肩、插销划船 vs 高位下拉），一律拆分为拥有独立 id 的独立卡片，不要把“或者”写在同一张卡里。
   - 每个 variants 的每个场馆（newGym / oldGym / home）都必须输出：
     - defaultWeight：该场馆初始默认重量（严禁 0kg，自重动作如平板支撑除外）；
     - sets：默认组数；
     - defaultRepsList：每组默认次数数组，须带合理递减阶梯（如 [12, 10, 10, 8]）。

### 标准输出 JSON Schema 模板：
{
  "version": "2.6",
  "mode": "patch",
  "targetUsers": ["leo", "linda"],
  "targetDays": [1, 3, 4, 5],
  "exercises": [
    {
      "id": "leo_d1_e1",
      "user": "leo",
      "day": 1,
      "order": "模块A",
      "muscleGroup": "quads",
      "category": "power",
      "venues": ["newGym", "oldGym", "home"],
      "variants": {
        "newGym": { "name": "哈克/腿举快速蹬伸", "machineCode": "商业器械 · 50%正式重", "isPlateLoaded": true, "sets": 3, "repRange": [5, 5], "defaultSeatNote": "脚踏居中" },
        "oldGym": { "name": "腿举机快速蹬伸", "machineCode": "插销器械 · 50%正式重", "isPlateLoaded": false, "sets": 3, "repRange": [5, 5] },
        "home":   { "name": "哑铃壶铃摆荡/快速分腿蹲", "machineCode": "家庭爆发力前置", "isPlateLoaded": false, "sets": 3, "repRange": [5, 5] }
      },
      "prescription": { "sets": 3, "repRange": [5, 5], "targetRIR": 3, "restSeconds": 120, "isDay5RepPush": false },
      "tempoGuide": {
        "concentric": { "time": "<1秒", "cue": "前2/3程全力爆发蹬出，末端15°主动减速刹车不锁膝" },
        "eccentric": { "time": "2秒", "cue": "稳稳控制回收，底部停稳再发力" },
        "bottomPause": { "cue": "总次数≤24次，追求神经放电速度而非力竭" },
        "overloadCue": "不做离心超负荷"
      }
    }
  ]
}

---
【以下是我的训练计划修改需求】：
（在此处粘贴你的训练计划文字，例如：把 Leo Day 3 的坐姿推肩改成史密斯推肩 4组×8-10次，或者粘贴整套 Leo 和 Linda 的计划）`

export default AI_PLAN_COMPILER_PROMPT
