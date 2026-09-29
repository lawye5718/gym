/**
 * V2.5 冷暖双色温全屏主题配置
 * Leo  → 极夜深海钛蓝（冷色调）
 * Linda → 晨曦琥珀玫瑰（暖色调）
 */
export const THEMES = {
  leo: {
    id: 'leo',
    name: 'Leo',
    avatar: '/images/leo-avatar.png',
    // 冷色调底色：深海极夜钛蓝渐变
    appBg: 'bg-gradient-to-b from-[#050c18] via-[#0a1628] to-[#07101e] text-slate-100',
    headerBg: 'bg-[#071120]/90 border-cyan-500/20',
    cardBg:
      'bg-gradient-to-br from-[#0e1e36]/95 via-[#0b172a]/95 to-[#081120]/95 border-cyan-500/30 shadow-2xl shadow-cyan-950/50',
    subCardBg: 'bg-[#06101e]/85 border-sky-500/20',
    accentPrimary: 'from-cyan-500 to-blue-600 text-white shadow-cyan-500/25',
    accentBadge: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
    accentText: 'text-cyan-400',
    repSliderBg: 'bg-[#081526] border-cyan-500/30',
    doneRowBg: 'bg-teal-950/55 border-teal-400/50',
    doneBtn: 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 shadow-cyan-400/30',
    dotActive: 'bg-cyan-400 h-5 w-1.5',
    dotInactive: 'bg-slate-700 h-1.5 w-1.5',
  },
  linda: {
    id: 'linda',
    name: 'Linda',
    avatar: '/images/linda-avatar.jpg',
    // 暖色调底色：晨曦暖可可 / 琥珀玫瑰渐变
    appBg: 'bg-gradient-to-b from-[#241115] via-[#2f171c] to-[#1f0e12] text-amber-50',
    headerBg: 'bg-[#261216]/90 border-amber-400/25',
    cardBg:
      'bg-gradient-to-br from-[#3b1c22]/95 via-[#31171c]/95 to-[#261115]/95 border-amber-400/35 shadow-2xl shadow-rose-950/60',
    subCardBg: 'bg-[#1f0d11]/80 border-rose-400/25',
    accentPrimary: 'from-rose-500 via-orange-400 to-amber-400 text-slate-950 shadow-rose-500/30',
    accentBadge: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    accentText: 'text-amber-300',
    repSliderBg: 'bg-[#220f13] border-amber-400/35',
    doneRowBg: 'bg-amber-950/50 border-amber-400/55',
    doneBtn: 'bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 shadow-amber-400/30',
    dotActive: 'bg-amber-400 h-5 w-1.5',
    dotInactive: 'bg-rose-950 h-1.5 w-1.5',
  },
}

export default THEMES
