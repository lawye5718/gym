import { BarChart3 } from 'lucide-react'
import { THEMES } from '../utils/themeConfig'
import { USERS, VENUE_MODES } from '../data/seedPlanData'

/**
 * V2.5 精简顶栏
 * Leo / Linda 头像切换 + 三馆（新馆 / 旧馆 / 家庭）常驻切换 + 统计入口
 */
export default function HeaderSwitcher({
  currentUser,
  onSelectUser,
  venueMode,
  onSelectVenue,
  onOpenAnalytics,
}) {
  const theme = THEMES[currentUser] || THEMES.leo

  return (
    <div className={`shrink-0 border-b safe-top ${theme.headerBg}`}>
      <div className="flex items-center gap-2 px-3 py-2">
        {/* 双人头像切换 */}
        <div className="flex bg-black/30 rounded-xl p-0.5">
          {Object.values(USERS).map((u) => {
            const active = currentUser === u.key
            return (
              <button
                key={u.key}
                type="button"
                onClick={() => onSelectUser(u.key)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                  active ? `bg-gradient-to-r ${theme.accentPrimary}` : 'text-slate-400'
                }`}
              >
                <img src={u.avatar} alt={u.label} className="w-5 h-5 rounded-full object-cover" />
                <span>{u.label}</span>
              </button>
            )
          })}
        </div>

        {/* 统计入口 */}
        <button
          type="button"
          onClick={onOpenAnalytics}
          className={`ml-auto flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[11px] font-bold ${theme.subCardBg}`}
        >
          <BarChart3 size={14} />
          统计
        </button>
      </div>

      {/* 三馆切换 */}
      <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto no-scrollbar">
        {Object.values(VENUE_MODES).map((v) => {
          const active = venueMode === v.key
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => onSelectVenue(v.key)}
              title={v.hint}
              className={`shrink-0 px-2 py-1 rounded-lg text-[11px] font-bold border transition ${
                active ? theme.accentBadge : 'text-slate-500 border-transparent'
              }`}
            >
              {v.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
