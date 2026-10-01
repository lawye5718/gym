# 八天无极微循环 · 打卡小程序（WeApp 版 v1.0）

与仓库中的 Web 版（Vite + React，V2.9.1）同源，复用同一套训练计划数据与算法，
供 Leo（管理员）与 Linda（成员）两人在手机端使用。

## 目录结构

```
weapp/
├── app.js / app.json / app.wxss     全局入口、路由、样式
├── project.config.json              小程序项目配置（appid 为占位 YOUR_APPID_HERE）
├── sitemap.json
├── pages/
│   ├── index/      主牌堆：欢迎卡 → 动作卡 → 当日清算 → 完赛卡（上下滑翻牌 + 点阵跳转）
│   ├── members/    成员与权限：Leo 审核 / 邀请码 / 激活 / 撤销
│   └── audit/      ACSM 2026 周容量审计（各肌群 ≥10 组）
└── utils/
    ├── planData.js   移植自 src/data/seedPlanData.js（74 个动作、三场馆、科学默认值）
    ├── engine.js     移植自 src/utils/overloadEngine.js（预填 / 超负荷 / Day5 85% / 画像步进）
    ├── deck.js       移植自 src/utils/deckFlattener.js（超级组展开）
    ├── store.js      存储适配（wx.setStorageSync，key 前缀 acsm2026_*）
    ├── logs.js       打卡与配置落库
    ├── members.js    身份与权限架构
    └── device.js     设备能力（震动响铃 / 常亮）
```

## 权限架构

| 身份 | 角色 | 使用方式 |
|---|---|---|
| Leo | 管理员（admin） | 默认永久可用；可「直接激活」成员、生成邀请码、撤销成员 |
| Linda | 成员（member） | 初始为「待激活」，需管理员授权后可用 |

Linda 获得使用权的三条路径（任选）：

1. **管理员直接激活**（推荐）：Leo 在「成员」页对 Linda 点「直接激活」。
2. **邀请码激活**：Leo 点「生成邀请码」得到 `GMT-LINDA-XXXX`（含签名，无法随意拼造），
   通过微信发给 Linda；Linda 在「成员」页输入即可激活。
3. **官方体验成员**：Leo 在微信公众平台「管理 → 成员管理」把 Linda 加为体验成员，
   Linda 扫体验版二维码打开后，再由 Leo 在应用内激活（或输入邀请码）。

> 当前版本为纯本地存储（无自建后端），授权状态保存在各自手机本地；
> 管理员身份由 `ADMIN_ID = 'leo'` 锁定，不会因清缓存把 Leo 锁在门外。

## 与 Web 版的一致性

- 训练计划数据、Day5「85% 扩次」同源回退链、用户画像增重步进
  （Linda 肩臂孤立 0.5kg / 胸背复合 1.25kg；Leo 复合 2.5kg）完全一致。
- 休息计时基于**绝对时间戳**（`Date.now() + 时长`），息屏/切后台不丢秒；
  归零后 10 秒响铃（循环震动 + 可选音频），点击任意处即停并推进，超时自动前进。
- 存储 key 沿用 `acsm2026_*`，便于日后与 Web 版互通。

## 本地验证（已执行）

- 全部 JS 通过 `node --check` 语法校验。
- 模拟 `wx` 环境跑通核心逻辑自测：
  - 权限：管理员授权 / 成员待激活 / 激活 / 撤销 / 错误邀请码被拒
  - 画像步进：Linda 0.5 / 1.25 / 2.5，Leo 2.5
  - 超级组展开：Leo Day5 九张卡 → 展开十条
  - Day5 回退链：主源无记录时取并列源（腿举 60kg → 85% = 50kg）

> 真机预览需在「微信开发者工具」中导入 `weapp` 目录（填入真实 AppID）。

## 上线清单（交付 Work Buddy）

1. 注册微信小程序账号（Leo 名下），完成主体备案。
2. 类目建议：工具 → 效率（或 健康 / 健身）。
3. 把 `project.config.json` 的 `appid` 替换为真实 AppID。
4. 「成员管理」添加 Linda 为体验成员 → 生成体验版二维码。
5. Leo 扫码体验版 → 在「成员」页激活 Linda → Linda 扫码即可开始打卡。
6. 提交审核并发布；版本号建议 `1.0.0`（对应 Web 版 V2.9.1）。
