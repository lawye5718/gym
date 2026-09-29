import { ArrowDown, Dumbbell, Flame, ShieldCheck } from 'lucide-react'

/**
 * V2.7 每日开篇「加油欢迎卡」（牌堆第 0 张）
 * 展示：用户头像、当日战术主题、ACSM 周容量纪律、热身提示与当前场馆
 */
export default function WelcomeCard({
  currentDay,
  currentUser,
  venueMode,
  dayMeta,
  theme,
  customAvatars,
  onStartFirstExercise,
}) {
  const meta = dayMeta?.[currentDay] || {}
  const avatarUrl =
    customAvatars?.[currentUser] ||
    (currentUser === 'leo' ? '/images/leo-avatar.png' : '/images/linda-avatar.jpg')

  const venueLabel =
    venueMode === 'newGym' ? '🌟乐刻新馆' : venueMode === 'oldGym' ? '🏢传统旧馆' : '🏠家庭重装'

  return (
    <div
      className={`w-full h-full rounded-3xl border-2 p-5 flex flex-col justify-between select-none ${theme.cardBg}`}
    >
      {/* 头部：用户专属问候 */}
      <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
        <img
          src={avatarUrl}
          alt={currentUser}
          className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-300 shadow-md"
        />
        <div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${theme.accentBadge}`}>
            ACSM 2026 · 无极微循环
          </span>
          <h2 className="text-xl font-black mt-1">
            {currentUser === 'leo' ? '🦁 Leo，蓄势待发！' : '🦢 Linda，优雅开练！'}
          </h2>
          <div className="text-[11px] opacity-75 mt-0.5">当前场馆：{venueLabel}</div>
        </div>
      </div>

      {/* 中部：今日训练科目标签 */}
      <div className="my-auto space-y-3">
        <div className={`p-4 rounded-2xl border ${theme.subCardBg}`}>
          <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black">
            <Flame className="w-4 h-4 fill-amber-300" />
            <span>DAY {currentDay} · 核心战术主题</span>
          </div>
          <h3 className="text-lg font-black text-white mt-1">{meta.name || '核心训练日'}</h3>
          <p className="text-xs opacity-85 mt-1 leading-relaxed">
            {meta.focus || '按高神经放电速度与离心控制完成每组动作，向心变慢即停！'}
          </p>
        </div>

        {/* ACSM 2026 增肌纪律提醒 */}
        <div className="p-3.5 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 text-xs space-y-1.5">
          <div className="font-black text-indigo-300 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span>ACSM 2026 执行纪律</span>
          </div>
          <div className="text-[11px] opacity-90 leading-relaxed">
            • 重点肌群冲击每周期 <b className="text-amber-200">11~12 组有效组</b>；
            <br />• 离心阶段刹车 2 秒，底部拉伸位停顿 1 秒卸掉反弹力；
            <br />• 动作间严格执行组间休息长响铃，满血开推。
          </div>
        </div>
      </div>

      {/* 底部启动大键 */}
      <div>
        <button
          type="button"
          onClick={onStartFirstExercise}
          className={`w-full py-3.5 rounded-2xl bg-gradient-to-r font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] ${theme.accentPrimary}`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>进入第 1 项训练卡片</span>
          <ArrowDown className="w-4 h-4" />
        </button>
        <div className="text-center text-[10px] opacity-60 mt-2">
          轻点按钮或向上滑动即可翻入动作卡片
        </div>
      </div>
    </div>
  )
}
