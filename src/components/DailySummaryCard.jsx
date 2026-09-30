import { ArrowRight, Calculator } from 'lucide-react'
import SwipeNumberControl from './SwipeNumberControl'

/**
 * V2.7 每日训练清算卡
 * 实时汇总结算当日所有动作的重量、组数与次数；
 * 用户可在训练中途随时打开手调（改重量/次数/勾选），改动即时双向同步回动作卡并落库。
 */
export default function DailySummaryCard({
  currentDay,
  currentUser,
  venueMode,
  dayExercises,
  todayLog,
  theme,
  onUpdateSingleSet, // (exerciseId, setIndex, field, value) => void
  onToggleSetDone, // (exerciseId, setIndex) => void
  onFinishWorkout, // 核对无误 → 进入完赛卡
  onReturnToDeck, // 返回动作卡片流
}) {
  let totalVolumeKg = 0
  let totalPlannedSets = 0
  let totalCompletedSets = 0

  dayExercises.forEach((ex) => {
    const exLog = todayLog?.exercises?.find((e) => e.exerciseId === ex.id)
    const planned = ex.prescription?.sets || exLog?.sets?.length || 0
    totalPlannedSets += planned
    const sets = exLog?.sets || []
    sets.forEach((s) => {
      if (s.completed) {
        totalCompletedSets += 1
        totalVolumeKg += (Number(s.weight) || 0) * (Number(s.reps) || 0)
      }
    })
  })

  const percent =
    totalPlannedSets > 0 ? Math.round((totalCompletedSets / totalPlannedSets) * 100) : 0

  return (
    <div
      className={`w-full h-full rounded-3xl border-2 p-3.5 flex flex-col justify-between select-none ${theme.cardBg}`}
    >
      {/* 顶部统计胶囊 */}
      <div>
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-1.5">
            <Calculator className={`w-4 h-4 ${theme.accentText}`} />
            <span className="text-xs font-black uppercase tracking-wider">
              🧾 Day {currentDay} 任务结算与清算卡
            </span>
          </div>
          <span className="text-[10px] text-amber-300 font-bold">可直接点击修改任意项</span>
        </div>

        {/* 仪表盘三联卡 */}
        <div className="grid grid-cols-3 gap-1.5 my-2">
          <div className={`p-2 rounded-xl border text-center ${theme.subCardBg}`}>
            <div className="text-[10px] opacity-70">已完成组数</div>
            <div className="text-base font-black text-emerald-400">
              {totalCompletedSets}/{totalPlannedSets}
            </div>
          </div>
          <div className={`p-2 rounded-xl border text-center ${theme.subCardBg}`}>
            <div className="text-[10px] opacity-70">总负荷吨位</div>
            <div className={`text-base font-black ${theme.accentText}`}>
              {Math.round(totalVolumeKg)} <span className="text-[10px]">kg</span>
            </div>
          </div>
          <div className={`p-2 rounded-xl border text-center ${theme.subCardBg}`}>
            <div className="text-[10px] opacity-70">达成率</div>
            <div className="text-base font-black text-white">{percent}%</div>
          </div>
        </div>
      </div>

      {/* 中部：全部动作分组清单滚动视窗 */}
      {/* 阻断手势冒泡：避免上下滚动查看清算列表时误触发外层翻牌 */}
      <div
        className="flex-1 my-1 overflow-y-auto no-scrollbar space-y-2 pr-1"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {dayExercises.map((ex) => {
          const variant = ex.activeVariant || ex.variants?.[venueMode] || ex.variants?.newGym || {}
          const exLog = todayLog?.exercises?.find((e) => e.exerciseId === ex.id)
          // 尚未打卡时以智能预填值起底，保证每组都可直接在清算卡录入 / 修改
          const sets = exLog?.sets || ex.prefillSets || []

          return (
            <div key={ex.id} className={`p-2.5 rounded-2xl border ${theme.subCardBg}`}>
              <div className="flex items-baseline justify-between mb-1.5">
                <div className="font-black text-xs text-white truncate max-w-[13rem]">
                  {variant.name || ex.order || ex.id}
                </div>
                <span className="text-[10px] opacity-70">{variant.machineCode}</span>
              </div>

              {sets.length === 0 ? (
                <div className="text-[10px] opacity-60 px-1 py-1">
                  尚未开始（计划 {ex.prescription?.sets || 0} 组）
                </div>
              ) : (
                <div className="space-y-1">
                  {sets.map((s, sIdx) => (
                    <div
                      key={sIdx}
                      className={`flex items-center justify-between gap-1.5 px-2 py-1 rounded-xl border text-xs ${
                        s.completed ? theme.doneRowBg : 'bg-black/35'
                      }`}
                    >
                      <span className="font-mono font-bold opacity-80 w-6">
                        #{s.setNo ?? sIdx + 1}
                      </span>

                      <SwipeNumberControl
                        value={s.weight}
                        step={Number(s.weight) >= 20 ? 2.5 : 1}
                        min={0}
                        unit="kg"
                        theme={theme}
                        onChange={(val) => onUpdateSingleSet?.(ex.id, sIdx, 'weight', val)}
                      />

                      <SwipeNumberControl
                        value={s.reps}
                        step={1}
                        min={1}
                        unit="次"
                        theme={theme}
                        highlightColor="text-emerald-400"
                        onChange={(val) => onUpdateSingleSet?.(ex.id, sIdx, 'reps', val)}
                      />

                      <button
                        type="button"
                        onClick={() => onToggleSetDone?.(ex.id, sIdx)}
                        className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center transition ${
                          s.completed ? theme.doneBtn : 'bg-white/10 text-white/40'
                        }`}
                      >
                        ✓
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 底部操作区 */}
      <div className="pt-2 border-t border-white/10 flex gap-2">
        <button
          type="button"
          onClick={onReturnToDeck}
          className="w-1/3 py-2.5 rounded-xl bg-white/10 text-xs font-bold"
        >
          返回动作卡
        </button>
        <button
          type="button"
          onClick={onFinishWorkout}
          className={`flex-1 py-2.5 rounded-xl bg-gradient-to-r font-black text-xs flex items-center justify-center gap-1 shadow-lg ${theme.accentPrimary}`}
        >
          <span>核对无误 · 结算入库</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
