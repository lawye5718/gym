import { useState } from 'react'
import { USERS, VENUE_MODES } from '../data/seedPlanData'

/** 顶部：Leo / Linda 一键切换 + 三馆（新馆/旧馆/家庭）常驻切换 + 专属 Hero 标识卡 */
export default function HeaderSwitcher({ user, setUser, venueMode, setVenueMode }) {
  const [showAvatarPreview, setShowAvatarPreview] = useState(false)
  const u = USERS[user]
  const isLinda = user === 'linda'

  const heroText = {
    newGym: isLinda
      ? '✨ 乐刻新馆特权：挂片由 Leo 全程代劳，尽享图4/5 免绑扣飞鸟机与图7 臀推神机！'
      : '🌟 乐刻新馆：挂片神机 + INSIGHT 飞鸟/臀推，主攻大重量安全极值。',
    oldGym: isLinda
      ? '🏢 传统旧馆模式：全插销器械 + 金属宽钩/脚踝扣挂载，0 搬片独立优雅完成。'
      : '🏢 传统旧馆：经典插销器械 + 龙门架外挂，稳扎稳打。',
    home: isLinda
      ? '🏠 家庭重装模式：37KG 哑铃凳 + 掌根空握/弹力带脚踝扣，足不出户高效塑形。'
      : '🏠 家庭重装：37KG 哑铃凳 + 弹力带/金属钩，零通勤自由练。',
  }[venueMode]

  return (
    <div className="sticky top-0 z-30 bg-ink-900/95 backdrop-blur border-b border-slate-800 safe-top">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex bg-ink-700 rounded-xl p-0.5 flex-1">
          {Object.values(USERS).map((usr) => {
            const active = user === usr.key
            return (
              <button
                key={usr.key}
                onClick={() => setUser(usr.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition ${
                  active
                    ? usr.key === 'linda'
                      ? 'bg-rose-500 text-white shadow'
                      : 'bg-sky-500 text-white shadow'
                    : 'text-slate-400'
                }`}
              >
                <img
                  src={usr.avatar}
                  alt={usr.label}
                  className="w-5 h-5 rounded-full object-cover border border-white/60 shadow-sm"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                {usr.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Hero 标识卡：随当前人物与场馆动态变化 */}
      <div className="px-3 pb-2.5">
        <div
          className={`flex items-center gap-3 p-2.5 rounded-2xl border shadow-lg ${
            isLinda
              ? 'bg-gradient-to-r from-rose-950/60 via-orange-950/40 to-slate-900 border-rose-500/30'
              : 'bg-gradient-to-r from-sky-950/60 via-indigo-950/40 to-slate-900 border-sky-500/30'
          }`}
        >
          <div
            onClick={() => setShowAvatarPreview(true)}
            className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-300/70 shadow-md shrink-0 cursor-pointer group"
          >
            <img src={u.avatar} alt={u.label} className="w-full h-full object-cover group-hover:scale-105 transition" />
            <span className="absolute bottom-0 inset-x-0 bg-black/50 text-[8px] text-center text-amber-200">点看大图</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-amber-200 truncate">{u.label} 战术卡</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-white/10 border border-white/20 font-bold shrink-0">
                {isLinda ? '🧤 死手模式' : '🦁 重装模式'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{heroText}</p>
          </div>
        </div>

        {/* 三馆切换（Leo & Linda 通用常驻） */}
        <div className="mt-2.5 grid grid-cols-3 gap-1.5 bg-ink-900/90 p-1 rounded-xl border border-slate-800/90">
          {Object.values(VENUE_MODES).map((v) => {
            const active = venueMode === v.key
            return (
              <button
                key={v.key}
                onClick={() => setVenueMode(v.key)}
                className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                  active
                    ? isLinda
                      ? 'bg-rose-500/20 border border-rose-500/50 text-rose-200 shadow-sm'
                      : 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-200 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="text-xs font-bold leading-tight">{v.label}</div>
                <div className="text-[9px] opacity-75 truncate mt-0.5">{v.hint}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 头像放大预览 */}
      {showAvatarPreview && (
        <div
          onClick={() => setShowAvatarPreview(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <div className="max-w-xs w-full bg-slate-900 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl p-3 text-center">
            <img src={u.avatar} alt={u.label} className="w-full rounded-2xl object-cover" />
            <div className="mt-3 text-sm font-bold text-amber-200">{u.label} 专属训练图腾</div>
            <div className="text-xs text-slate-400 mt-0.5">科学渐进超负荷 · 轻点任意处关闭</div>
          </div>
        </div>
      )}
    </div>
  )
}
