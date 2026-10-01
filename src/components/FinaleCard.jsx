/**
 * V2.5 末尾完赛祝贺卡（以 Linda 实拍头像为主视觉）
 * 继续上下滑可无缝循环回当天第 1 个动作卡
 */
export default function FinaleCard({
  currentUser,
  currentDay,
  customAvatars,
  completedSetsCount,
  totalSetsCount,
  totalVolumeKg,
  theme,
  onRestartFirstCard,
}) {
  const allDone = totalSetsCount > 0 && completedSetsCount >= totalSetsCount

  return (
    <div className={`flex flex-col h-full min-h-0 rounded-3xl border overflow-hidden ${theme.cardBg}`}>
      {/* 完赛主视觉 */}
      <div className="relative shrink-0 h-40 bg-black/40">
        <img
          src={
            currentUser === 'leo'
              ? customAvatars?.leo || '/images/leo-avatar.png'
              : customAvatars?.linda || '/images/linda-avatar.jpg'
          }
          alt="完赛"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3">
          <div className="text-lg font-extrabold">
            {allDone ? '🏆 今日全部完成！' : '👏 今日训练告一段落'}
          </div>
          <div className="text-[11px] opacity-80">
            {currentUser === 'linda' ? 'Linda' : 'Leo'} · Day {currentDay}
          </div>
        </div>
      </div>

      {/* 今日战报 */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className={`rounded-2xl border p-2.5 ${theme.subCardBg}`}>
            <div className="text-[10px] opacity-70">完成组数</div>
            <div className={`text-xl font-extrabold ${theme.accentText}`}>
              {completedSetsCount}
              <span className="text-[11px] opacity-60"> / {totalSetsCount || '—'}</span>
            </div>
          </div>
          <div className={`rounded-2xl border p-2.5 ${theme.subCardBg}`}>
            <div className="text-[10px] opacity-70">总容量 (kg)</div>
            <div className={`text-xl font-extrabold ${theme.accentText}`}>
              {totalVolumeKg || 0}
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border p-2.5 text-[11px] leading-relaxed ${theme.subCardBg}`}>
          {allDone
            ? '🎉 八天微循环今日额度已达成，超量恢复才是变强的时刻——严禁摸铁，好好吃饭睡觉！'
            : '💪 已完成部分打卡。继续上下滑可回到第 1 个动作补齐剩余组数。'}
        </div>
      </div>

      <div className="shrink-0 p-3 pt-0">
        <button
          type="button"
          onClick={onRestartFirstCard}
          className={`w-full py-2.5 rounded-2xl font-extrabold text-sm bg-gradient-to-r ${theme.accentPrimary}`}
        >
          ↩︎ 回到第 1 个动作
        </button>
        <div className="mt-1.5 text-center text-[10px] opacity-60">继续上下滑也会自动循环 ↕</div>
      </div>
    </div>
  )
}
