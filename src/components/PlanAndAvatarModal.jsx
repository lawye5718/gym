import { useRef, useState } from 'react'
import {
  Check,
  Copy,
  FileJson,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { AI_PLAN_COMPILER_PROMPT } from '../utils/aiPlanPrompt'

/**
 * 将用户上传的照片通过离屏 Canvas 居中裁剪并压缩为 256×256 JPEG Base64（约 20–35KB）
 * 防止大图直接存 localStorage 触发 QuotaExceededError
 */
function compressAvatarImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = 256
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        const minSide = Math.min(img.width, img.height)
        const sx = (img.width - minSide) / 2
        const sy = (img.height - minSide) / 2
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * V2.6 训练计划导入 & 自定义头像中心
 * 同时解决：用户自行上传更换头像（问题 4）与训练计划上传修改入口 + AI 固定 Prompt（问题 7）
 */
export default function PlanAndAvatarModal({
  customAvatars,
  onSaveAvatar,
  onResetAvatar,
  onImportCustomPlanJson,
  onResetPlanToDefault,
  theme,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('plan') // plan | avatar
  const [jsonInput, setJsonInput] = useState('')
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [statusMsg, setStatusMsg] = useState(null)

  const leoFileRef = useRef(null)
  const lindaFileRef = useRef(null)
  const jsonFileRef = useRef(null)

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PLAN_COMPILER_PROMPT)
      setCopiedPrompt(true)
      setTimeout(() => setCopiedPrompt(false), 2500)
    } catch {
      setStatusMsg({ type: 'error', text: '复制失败，请手动全选复制' })
    }
  }

  const handleAvatarUpload = async (userKey, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const base64 = await compressAvatarImage(file)
      onSaveAvatar?.(userKey, base64)
      setStatusMsg({
        type: 'ok',
        text: `✅ ${userKey === 'leo' ? 'Leo' : 'Linda'} 头像已更新！`,
      })
    } catch {
      setStatusMsg({ type: 'error', text: '图片解析失败，请重试' })
    }
  }

  const handleApplyPlanJson = () => {
    try {
      const cleaned = jsonInput.trim().replace(/^```json\s*/i, '').replace(/```$/i, '')
      const parsed = JSON.parse(cleaned)
      if (!parsed.exercises || !Array.isArray(parsed.exercises)) {
        throw new Error('缺少 exercises 数组字段')
      }
      const res = onImportCustomPlanJson?.(parsed) || { updatedCount: 0 }
      setStatusMsg({
        type: 'ok',
        text: `🎉 导入成功！已应用 ${
          parsed.mode === 'patch' ? '局部修改' : '全量计划'
        }（共更新 ${res.updatedCount} 个动作卡片）`,
      })
      setJsonInput('')
    } catch (err) {
      setStatusMsg({ type: 'error', text: `❌ JSON 格式有误：${err.message}` })
    }
  }

  const handleJsonFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setJsonInput(String(ev.target.result || ''))
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3">
      <div
        className={`w-full max-w-md max-h-[92dvh] rounded-3xl border-2 p-4 flex flex-col justify-between overflow-hidden ${theme.cardBg}`}
      >
        {/* 顶部栏 */}
        <div>
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-black flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>训练计划导入 &amp; 自定义头像中心</span>
            </h3>
            <button type="button" onClick={onClose} className="p-1.5 rounded-xl bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab 切换 */}
          <div className="grid grid-cols-2 gap-1.5 bg-black/35 p-1 rounded-xl mt-3">
            <button
              type="button"
              onClick={() => setActiveTab('plan')}
              className={`py-1.5 rounded-lg text-xs font-extrabold transition ${
                activeTab === 'plan' ? `bg-gradient-to-r ${theme.accentPrimary}` : 'text-slate-400'
              }`}
            >
              📋 上传/AI修改训练计划
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('avatar')}
              className={`py-1.5 rounded-lg text-xs font-extrabold transition ${
                activeTab === 'avatar' ? `bg-gradient-to-r ${theme.accentPrimary}` : 'text-slate-400'
              }`}
            >
              🖼️ 更换 Leo/Linda 头像
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className="my-3 flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          {statusMsg && (
            <div
              className={`p-2.5 rounded-xl border font-bold ${
                statusMsg.type === 'ok'
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                  : 'bg-rose-500/20 border-rose-400/50 text-rose-200'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          {activeTab === 'plan' ? (
            <>
              {/* 第 1 步：复制固定 AI Prompt */}
              <div className={`p-3 rounded-2xl border ${theme.subCardBg}`}>
                <div className="font-black text-amber-300 mb-1">
                  第 1 步：复制「AI 格式转换固定 Prompt」
                </div>
                <p className="text-[11px] opacity-85 leading-relaxed mb-2">
                  无论你想改某几天的动作、还是重写整套 8 天计划（Leo 或 Linda），点击下方按钮复制固定
                  Prompt 发给任意 AI，AI 会自动生成标准格式数据。
                </p>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="w-full py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center gap-1.5 shadow active:scale-[0.98]"
                >
                  {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>
                    {copiedPrompt ? '✅ 已复制固定 Prompt！快去发给 AI 吧' : '一键复制 AI 计划生成固定 Prompt'}
                  </span>
                </button>
              </div>

              {/* 第 2 步：粘贴 JSON 或上传文件 */}
              <div className={`p-3 rounded-2xl border ${theme.subCardBg}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-cyan-300">第 2 步：粘贴 AI 生成的 JSON 或上传文件</span>
                  <button
                    type="button"
                    onClick={() => jsonFileRef.current?.click()}
                    className="px-2 py-1 rounded-lg bg-white/10 text-[10px] font-bold flex items-center gap-1"
                  >
                    <FileJson className="w-3 h-3" />
                    <span>上传.json文件</span>
                  </button>
                  <input
                    ref={jsonFileRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleJsonFileSelect}
                    className="hidden"
                  />
                </div>

                <textarea
                  rows={6}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='在此粘贴 AI 输出的 JSON 代码块（支持 "mode": "patch" 局部修改某天，或 "mode": "full" 全量替换）...'
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/15 font-mono text-[11px] text-emerald-300 focus:outline-none focus:border-amber-400"
                />

                <div className="flex gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={onResetPlanToDefault}
                    className="px-3 py-2.5 rounded-xl bg-white/10 text-[11px] font-bold flex items-center gap-1 shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>恢复默认计划</span>
                  </button>
                  <button
                    type="button"
                    disabled={!jsonInput.trim()}
                    onClick={handleApplyPlanJson}
                    className={`flex-1 py-2.5 rounded-xl bg-gradient-to-r font-black text-xs shadow-lg disabled:opacity-40 ${theme.accentPrimary}`}
                  >
                    🚀 立即生效新训练计划
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {[
                {
                  key: 'leo',
                  name: 'Leo 头像（冷色主题标识）',
                  defaultImg: '/images/leo-avatar.png',
                  ref: leoFileRef,
                },
                {
                  key: 'linda',
                  name: 'Linda 头像（暖色主题 & 完赛尾卡标识）',
                  defaultImg: '/images/linda-avatar.jpg',
                  ref: lindaFileRef,
                },
              ].map((u) => (
                <div
                  key={u.key}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${theme.subCardBg}`}
                >
                  <img
                    src={customAvatars?.[u.key] || u.defaultImg}
                    alt={u.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-300/60 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm">{u.name}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">
                      自动裁剪压缩至高清 256×256，断网永久保存
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => u.ref.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>从手机相册上传</span>
                      </button>
                      {customAvatars?.[u.key] && (
                        <button
                          type="button"
                          onClick={() => onResetAvatar?.(u.key)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/10 text-[10px] font-bold"
                        >
                          恢复默认
                        </button>
                      )}
                      <input
                        ref={u.ref}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAvatarUpload(u.key, e)}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-white/10 text-xs font-bold"
        >
          关闭返回
        </button>
      </div>
    </div>
  )
}
