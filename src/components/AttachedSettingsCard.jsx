import { useState } from 'react'
import { ArrowLeft, RotateCcw, Save } from 'lucide-react'

/**
 * V2.5 附随动作分组的背面设置卡
 * 可修改：器械默认重量 / 总组数 / 每组默认次数 / 休息秒数 / 机位记忆
 * 并提供「按 ACSM 八天计划重置」
 */
export default function AttachedSettingsCard({
  exercise,
  venueMode,
  customConfig,
  theme,
  onSave,
  onReset,
  onBack,
}) {
  const { prescription } = exercise
  const [minReps] = prescription.repRange
  const defaultSets = customConfig?.sets || prescription.sets

  const [weight, setWeight] = useState(customConfig?.defaultWeight ?? '')
  const [sets, setSets] = useState(defaultSets)
  const [repsText, setRepsText] = useState(
    (customConfig?.defaultRepsList || []).join(',') ||
      Array.from({ length: defaultSets }, () => minReps).join(',')
  )
  const [restSec, setRestSec] = useState(customConfig?.restSeconds || prescription.restSeconds)
  const [seatNote, setSeatNote] = useState(customConfig?.seatNote || '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    const repsList = repsText
      .split(/[,，\s]+/)
      .map((s) => Number(s))
      .filter((n) => !Number.isNaN(n) && n > 0)
    const finalSets = Number(sets) || prescription.sets
    onSave?.({
      defaultWeight: Number(weight) || 0,
      sets: finalSets,
      defaultRepsList: repsList.length
        ? repsList
        : Array.from({ length: finalSets }, () => minReps),
      restSeconds: Number(restSec) || prescription.restSeconds,
      seatNote,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }

  const variant = exercise.variants?.[venueMode] || exercise.variants?.newGym

  return (
    <div
      className={`flex flex-col h-full min-h-0 rounded-3xl border p-3 ${theme.cardBg}`}
    >
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold ${theme.subCardBg}`}
        >
          <ArrowLeft size={13} /> 返回
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-extrabold truncate">⚙️ 器械设置</div>
          <div className="text-[10px] opacity-70 truncate">{variant?.name}</div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar mt-2.5 space-y-2.5">
        <label className="block">
          <span className="text-[11px] opacity-80">基准重量 (kg)</span>
          <input
            type="number"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="如 40"
            className={`mt-1 w-full rounded-xl border px-2.5 py-2 text-sm font-bold bg-black/30 ${theme.repSliderBg}`}
          />
        </label>

        <label className="block">
          <span className="text-[11px] opacity-80">总组数</span>
          <input
            type="number"
            min="1"
            max="10"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            className={`mt-1 w-full rounded-xl border px-2.5 py-2 text-sm font-bold bg-black/30 ${theme.repSliderBg}`}
          />
        </label>

        <label className="block">
          <span className="text-[11px] opacity-80">每组默认次数（逗号分隔）</span>
          <input
            type="text"
            value={repsText}
            onChange={(e) => setRepsText(e.target.value)}
            placeholder="如 12,10,8"
            className={`mt-1 w-full rounded-xl border px-2.5 py-2 text-sm font-bold bg-black/30 ${theme.repSliderBg}`}
          />
          <span className="text-[10px] opacity-60">计划标准：{minReps}–{prescription.repRange[1]} 次</span>
        </label>

        <label className="block">
          <span className="text-[11px] opacity-80">组间休息 (秒)</span>
          <input
            type="number"
            step="5"
            value={restSec}
            onChange={(e) => setRestSec(e.target.value)}
            className={`mt-1 w-full rounded-xl border px-2.5 py-2 text-sm font-bold bg-black/30 ${theme.repSliderBg}`}
          />
        </label>

        <label className="block">
          <span className="text-[11px] opacity-80">💺 机位 / 孔位记忆</span>
          <input
            type="text"
            value={seatNote}
            onChange={(e) => setSeatNote(e.target.value)}
            placeholder="如 座椅3档 / 插销第5格"
            className={`mt-1 w-full rounded-xl border px-2.5 py-2 text-sm bg-black/30 ${theme.repSliderBg}`}
          />
        </label>
      </div>

      <div className="shrink-0 mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl font-extrabold text-sm bg-gradient-to-r ${theme.accentPrimary}`}
        >
          <Save size={14} /> {saved ? '已保存 ✓' : '保存设置'}
        </button>
        <button
          type="button"
          onClick={onReset}
          className={`px-2.5 py-2.5 rounded-xl border text-[11px] font-bold ${theme.subCardBg}`}
          title="清除自定义，回到 ACSM 八天计划标准"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  )
}
