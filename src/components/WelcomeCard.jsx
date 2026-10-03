import { ArrowDown, Dumbbell, Flame, ShieldCheck } from 'lucide-react'
import WarmupBalanceCard from './WarmupBalanceCard'
import V6MetricsPanel from './V6MetricsPanel'

/**
 * V2.7 / V3.0(V6) 每日开篇「加油欢迎卡」（牌堆第 0 张）
 * 展示：用户头像、当日战术主题、V6 执行纪律、完整热身打卡、功能性防衰指标与当前场馆
 */
export default function WelcomeCard({
  currentDay,
  currentUser,
  venueMode,
  dayMeta,
  theme,
  customAvatars,
  statusLight = 'green',
  warmupChecked,
  onToggleWarmup,
  metrics,
  onMetricChange,
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

      {/* 中部：主题 + V6 纪律 + 完整热身打卡 + 功能性指标（可滚动） */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar my-2 space-y-2.5">
        <div className={`p-3.5 rounded-2xl border ${theme.subCardBg}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black">
              <Flame className="w-4 h-4 fill-amber-300" />
              <span>
                DAY {currentDay} · {meta.title || '核心训练日'}
              </span>
            </div>
            {meta.duration && <span className="text-[10px] opacity-70 shrink-0">⏱ {meta.duration}</span>}
          </div>
          <h3 className="text-base font-black text-white mt-1">{meta.sub || '核心训练日'}</h3>
          <p className="text-[11px] opacity-85 mt-1 leading-relaxed">
            {meta.focus || '按高神经放电速度与离心控制完成每组动作，向心变慢即停！'}
          </p>
        </div>

        {/* V6 四维执行纪律 */}
        <div className="p-3 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 text-[11px] space-y-1">
          <div className="font-black text-indigo-300 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span>V6 四维执行纪律</span>
          </div>
          <div className="opacity-90 leading-relaxed">
            • 四维目标：<b className="text-amber-200">增肌 · 心肺 · 爆发力 · 骨密度平衡</b>；
            <br />• 每肌群每循环 <b className="text-amber-200">≥12 组</b>；离心刹车 2 秒、底部停 1 秒；
            <br />• 双阈值铁律：次数到上限再加重 2.5-5%，做不到区间下限立即退回原重量。
          </div>
        </div>

        {/* 完整热身（不可压缩铁律 3） */}
        <WarmupBalanceCard
          currentDay={currentDay}
          theme={theme}
          checked={warmupChecked}
          onToggle={onToggleWarmup}
        />

        {/* 功能性防衰指标追踪 */}
        <V6MetricsPanel
          theme={theme}
          metrics={metrics}
          currentUser={currentUser}
          onChange={onMetricChange}
        />
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
