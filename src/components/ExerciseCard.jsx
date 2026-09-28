import { useState } from 'react'
import { Check, ImageIcon, Minus, Plus, X } from 'lucide-react'
import { calculatePlatesPerSide } from '../utils/overloadEngine'

const QUICK_TAGS = [
  '⚡1.5s减速停(RIR2)',
  '🛑底部停1秒极稳',
  '🔥末组双起单下',
  '🧤死手模式零抓握',
  '⚠️关节微紧',
]

export default function ExerciseCard({
  exercise,
  venueMode,
  smartData,
  seatMemory,
  onSaveSeatMemory,
  onSetComplete,
  onUpdateSetData,
}) {
  const [sets, setSets] = useState(smartData.prefillSets)
  const [selectedTags, setSelectedTags] = useState([])
  const [showMedia, setShowMedia] = useState(false)
  const [editingSeat, setEditingSeat] = useState(false)
  const [seatText, setSeatText] = useState(
    seatMemory || exercise.variants[venueMode]?.defaultSeatNote || '点击记录座椅/插销格数'
  )

  const variant = exercise.variants[venueMode] || exercise.variants.newGym
  const { tempoGuide, prescription, media } = exercise
  const [minReps, maxReps] = prescription.repRange

  const handleFieldChange = (idx, field, val) => {
    const next = sets.map((s, i) => (i === idx ? { ...s, [field]: Number(val) } : s))
    setSets(next)
    onUpdateSetData(exercise.id, next, selectedTags)
  }

  const toggleSetDone = (idx) => {
    const next = sets.map((s, i) => (i === idx ? { ...s, completed: !s.completed } : s))
    setSets(next)
    onUpdateSetData(exercise.id, next, selectedTags)
    if (!sets[idx].completed) onSetComplete(prescription.restSeconds, variant.name)
  }

  const toggleTag = (tag) => {
    const next = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag]
    setSelectedTags(next)
    onUpdateSetData(exercise.id, sets, next)
  }

  const bannerStyle =
    smartData.overloadBanner?.level === 'gold'
      ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
      : smartData.overloadBanner?.level === 'emerald'
      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
      : 'bg-sky-500/15 border-sky-500/40 text-sky-200'

  return (
    <div className="bg-ink-800 border border-slate-700 rounded-2xl p-3.5 mb-3.5 shadow-lg">
      {smartData.overloadBanner && (
        <div className={`mb-3 p-2.5 rounded-xl border text-xs flex items-start gap-2 ${bannerStyle}`}>
          <div className="flex-1">
            <div className="font-bold text-[13px] mb-0.5">{smartData.overloadBanner.title}</div>
            <div className="opacity-90 leading-relaxed">{smartData.overloadBanner.message}</div>
          </div>
        </div>
      )}

      {/* 头部 */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {exercise.order}
            </span>
            <span className="text-[10px] text-slate-400 font-medium truncate">{variant.machineCode}</span>
          </div>
          <h3 className="text-base font-extrabold mt-1 text-white tracking-tight leading-snug">
            {variant.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300 flex-wrap">
            <span className="font-semibold text-emerald-400">
              {prescription.sets} 组 × {minReps}–{maxReps} 次
            </span>
            <span className="text-slate-600">•</span>
            <span>RIR {prescription.targetRIR}</span>
            <span className="text-slate-600">•</span>
            <span>⏱️ 休 {prescription.restSeconds}s</span>
          </div>
        </div>

        <button
          onClick={() => setShowMedia(true)}
          className="w-14 h-14 rounded-xl bg-ink-700 border border-slate-600 flex flex-col items-center justify-center text-[9px] text-slate-400 shrink-0 relative overflow-hidden"
        >
          {media?.machinePhotoUrl ? (
            <img src={media.machinePhotoUrl} alt="" className="w-full h-full object-cover opacity-80" />
          ) : (
            <>
              <ImageIcon size={18} />
              <span className="mt-0.5">图解</span>
            </>
          )}
          <span className="absolute bottom-0 inset-x-0 bg-black/60 text-center py-0.5 text-indigo-300">
            {media?.version === 2 ? 'V2高清' : '点看要领'}
          </span>
        </button>
      </div>

      {/* 💺 机位记忆 */}
      <div className="mt-2.5 flex items-center bg-ink-700/60 px-2.5 py-1.5 rounded-lg text-[11px]">
        {editingSeat ? (
          <input
            type="text"
            value={seatText}
            onChange={(e) => setSeatText(e.target.value)}
            onBlur={() => {
              setEditingSeat(false)
              onSaveSeatMemory(exercise.id, seatText)
            }}
            autoFocus
            className="bg-transparent border-b border-indigo-400 text-white w-full text-xs focus:outline-none"
          />
        ) : (
          <div
            onClick={() => setEditingSeat(true)}
            className="flex items-center gap-1.5 text-slate-300 cursor-pointer w-full"
          >
            <span>💺 机位记忆：</span>
            <span className="text-amber-300 font-medium underline decoration-dotted">{seatText}</span>
            <span className="ml-auto text-[9px] text-slate-500">点击修改</span>
          </div>
        )}
      </div>

      {/* 四段式节奏 */}
      <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
        <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-2">
          <div className="font-bold text-rose-300 flex justify-between items-center">
            <span>🔥 向心</span>
            <span className="bg-rose-500/20 px-1 rounded">{tempoGuide.concentric.time}</span>
          </div>
          <p className="text-slate-300 mt-1 leading-snug">{tempoGuide.concentric.cue}</p>
        </div>
        <div className="bg-sky-500/10 border border-sky-500/25 rounded-xl p-2">
          <div className="font-bold text-sky-300 flex justify-between items-center">
            <span>❄️ 离心</span>
            <span className="bg-sky-500/20 px-1 rounded">{tempoGuide.eccentric.time}</span>
          </div>
          <p className="text-slate-300 mt-1 leading-snug">{tempoGuide.eccentric.cue}</p>
        </div>
        <div className="col-span-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-2.5 py-1.5">
          <div className="text-amber-200 leading-snug">
            <span className="font-bold text-amber-300">⏱️ 底部停顿：</span>
            {tempoGuide.bottomPause.cue}
            {tempoGuide.overloadCue && (
              <span className="block mt-0.5 text-indigo-300">💡 {tempoGuide.overloadCue}</span>
            )}
          </div>
        </div>
      </div>

      {/* 极速打卡 */}
      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between items-center text-[10px] text-slate-400 px-1">
          <span className="w-6">组</span>
          <span className="flex-1 text-center">
            {variant.isPlateLoaded ? '单边 (kg)' : '配重 (kg)'}
            {smartData.lastDate && <span className="ml-1 text-slate-500">继承 {smartData.lastDate.slice(5)}</span>}
          </span>
          <span className="flex-1 text-center">次数</span>
          <span className="w-10 text-center">✓</span>
        </div>

        {sets.map((s, idx) => (
          <div
            key={s.setNo}
            className={`flex items-center gap-1.5 p-1.5 rounded-xl border transition ${
              s.completed ? 'bg-emerald-950/40 border-emerald-600/40' : 'bg-ink-700/40 border-slate-700'
            }`}
          >
            <span className="w-6 h-6 rounded bg-ink-700 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
              {s.setNo}
            </span>

            <div className="flex-1 flex flex-col items-center">
              <div className="flex items-center bg-ink-900 rounded-lg border border-slate-700 overflow-hidden w-full">
                <button
                  onClick={() => handleFieldChange(idx, 'weight', Math.max(0, Number(s.weight) - 2.5))}
                  className="px-1.5 py-1.5 text-slate-400 active:bg-slate-700"
                >
                  <Minus size={12} />
                </button>
                <input
                  type="number"
                  step="0.5"
                  value={s.weight}
                  onChange={(e) => handleFieldChange(idx, 'weight', e.target.value)}
                  className="flex-1 min-w-0 text-center bg-transparent font-bold text-sm text-white focus:outline-none"
                />
                <button
                  onClick={() => handleFieldChange(idx, 'weight', Number(s.weight) + 2.5)}
                  className="px-1.5 py-1.5 text-slate-400 active:bg-slate-700"
                >
                  <Plus size={12} />
                </button>
              </div>
              {variant.isPlateLoaded && Number(s.weight) > 0 && (
                <span className="text-[9px] text-indigo-300 mt-0.5">{calculatePlatesPerSide(Number(s.weight))}</span>
              )}
            </div>

            <div className="flex-1 flex items-center bg-ink-900 rounded-lg border border-slate-700 overflow-hidden">
              <button
                onClick={() => handleFieldChange(idx, 'reps', Math.max(1, Number(s.reps) - 1))}
                className="px-1.5 py-1.5 text-slate-400 active:bg-slate-700"
              >
                <Minus size={12} />
              </button>
              <input
                type="number"
                value={s.reps}
                onChange={(e) => handleFieldChange(idx, 'reps', e.target.value)}
                className="flex-1 min-w-0 text-center bg-transparent font-bold text-sm text-emerald-400 focus:outline-none"
              />
              <button
                onClick={() => handleFieldChange(idx, 'reps', Number(s.reps) + 1)}
                className="px-1.5 py-1.5 text-slate-400 active:bg-slate-700"
              >
                <Plus size={12} />
              </button>
            </div>

            <button
              onClick={() => toggleSetDone(idx)}
              className={`w-10 h-9 rounded-xl font-bold flex items-center justify-center shrink-0 transition ${
                s.completed
                  ? 'bg-emerald-500 text-ink-900 shadow shadow-emerald-500/25'
                  : 'bg-slate-700 text-slate-300 active:bg-slate-600'
              }`}
            >
              <Check size={16} strokeWidth={3} />
            </button>
          </div>
        ))}
      </div>

      {/* 快捷标签 */}
      <div className="mt-2.5 pt-2 border-t border-slate-700/70 flex flex-wrap gap-1.5">
        {QUICK_TAGS.map((tag) => {
          const active = selectedTags.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2 py-1 rounded-full text-[10px] font-medium transition ${
                active ? 'bg-indigo-600 text-white' : 'bg-ink-700 text-slate-400'
              }`}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {/* V2 图解占位弹窗 */}
      {showMedia && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowMedia(false)}>
          <div
            className="bg-ink-800 border border-slate-700 rounded-2xl p-4 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-bold text-white">{variant.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{variant.machineCode}</div>
              </div>
              <button onClick={() => setShowMedia(false)} className="text-slate-500">
                <X size={18} />
              </button>
            </div>

            <div className="aspect-square rounded-xl bg-ink-700 border border-slate-600 flex items-center justify-center mb-3">
              {media?.machinePhotoUrl ? (
                <img src={media.machinePhotoUrl} alt="" className="w-full h-full object-contain rounded-xl" />
              ) : (
                <div className="text-center text-slate-500">
                  <ImageIcon size={40} className="mx-auto mb-2 opacity-50" />
                  <div className="text-xs">器械要领与 V2 图解占位</div>
                  <div className="text-[10px] mt-1">上传新馆实拍后自动显示</div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              {(media?.keyPointsOverlay || []).map((pt, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                  <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center text-[9px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {pt}
                </div>
              ))}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-700 text-[10px] text-slate-500 leading-relaxed">
              向心 {tempoGuide.concentric.time} · 顶峰 {tempoGuide.topPause.time} · 离心 {tempoGuide.eccentric.time} · 底部停 {tempoGuide.bottomPause.time}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
