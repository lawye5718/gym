import { Building2, Home, Users } from 'lucide-react'
import { USERS, VENUE_MODES } from '../data/seedPlanData'

/** 顶部：Leo / Linda 一键切换 + Linda 专属场馆子开关 */
export default function HeaderSwitcher({ user, setUser, venueMode, setVenueMode }) {
  const isLinda = user === 'linda'
  const accent = isLinda ? 'rose' : 'sky'

  return (
    <div className="sticky top-0 z-30 bg-ink-900/95 backdrop-blur border-b border-slate-800 safe-top">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex bg-ink-700 rounded-xl p-0.5 flex-1">
          {Object.values(USERS).map((u) => {
            const active = user === u.key
            return (
              <button
                key={u.key}
                onClick={() => setUser(u.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition ${
                  active
                    ? u.key === 'linda'
                      ? 'bg-rose-500 text-white shadow'
                      : 'bg-sky-500 text-white shadow'
                    : 'text-slate-400'
                }`}
              >
                <span>{u.emoji}</span>
                {u.label}
              </button>
            )
          })}
        </div>
      </div>

      {isLinda && (
        <div className="px-3 pb-2.5">
          <div className="flex items-center gap-1.5 bg-ink-800 rounded-xl p-1 border border-slate-700">
            <Users size={13} className="text-slate-500 ml-1 mr-0.5 shrink-0" />
            {Object.values(VENUE_MODES).map((v) => {
              const active = venueMode === v.key
              return (
                <button
                  key={v.key}
                  onClick={() => setVenueMode(v.key)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                    active ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40' : 'text-slate-400'
                  }`}
                >
                  {v.key === 'newGym' ? <Building2 size={12} /> : <Home size={12} />}
                  <span className="truncate">{v.label}</span>
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 px-1">
            {VENUE_MODES[venueMode].hint}
          </p>
        </div>
      )}
    </div>
  )
}
