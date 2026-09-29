/**
 * V2.5 Day 1~8 胶囊导航 + Day5 后「+1 弹性静息日」开关
 */
export default function DaySwiper({
  currentDay,
  dayMeta,
  theme,
  extraRestInserted,
  onSelectDay,
  onToggleExtraRest,
}) {
  const today = dayMeta.find((d) => d.day === currentDay)

  return (
    <div className="shrink-0 px-3 py-1.5">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {(dayMeta || []).map((d) => {
          const active = currentDay === d.day
          return (
            <button
              key={d.day}
              type="button"
              onClick={() => onSelectDay(d.day)}
              className={`shrink-0 min-w-[3.4rem] px-2 py-1 rounded-xl border text-[11px] font-bold transition ${
                active ? `bg-gradient-to-r ${theme.accentPrimary}` : `${theme.subCardBg} opacity-70`
              }`}
            >
              <div className="flex items-center justify-center gap-0.5">
                <span>{d.emoji}</span>
                <span>D{d.day}</span>
              </div>
              <div className="text-[9px] opacity-80 truncate max-w-[4rem]">{d.title}</div>
            </button>
          )
        })}
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="text-[10px] opacity-70 truncate">
          {today ? `${today.title} · ${today.sub}` : ''}
        </div>
        <button
          type="button"
          onClick={onToggleExtraRest}
          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
            extraRestInserted
              ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
              : `${theme.subCardBg} opacity-70`
          }`}
        >
          {extraRestInserted ? '✅ 已加 +1 静息日' : '＋ 弹性静息日'}
        </button>
      </div>
    </div>
  )
}
