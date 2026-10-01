/**
 * DeckStepper.jsx —— V2.9.1 迷你点阵进度条（Mini Deck Stepper）
 *
 * 背景：彻底落实「不同重量动作严格拆卡」后，单日牌堆膨胀到 10~12 张，
 *      用户在健身房高疲劳状态下连续滑屏容易产生「还要滑多久」的迷失感。
 *
 * 能力：
 *  ① 当前卡片 → 拉长的高亮条
 *  ② 该动作所有组已完成 → 翠绿实心点（半格加宽）
 *  ③ 欢迎卡 / 清算卡 / 完赛卡 → 白色半透明小点
 *  ④ 未完成动作 → 暗色小点（hover 提亮）
 *  ⑤ 横向点按任意点 → 直接跳转该卡片，避免重复单向滑屏
 */
export default function DeckStepper({ cards, activeIndex, onSelectCard, theme }) {
  if (!cards || cards.length <= 1) return null

  return (
    <div className="w-full flex items-center justify-center gap-1.5 py-1 select-none overflow-x-auto no-scrollbar">
      {cards.map((c, idx) => {
        const isCurrent = idx === activeIndex
        const isCompleted = c.type === 'exercise' && c.data?.allCompleted
        const isAuxCard = c.type === 'welcome' || c.type === 'summary' || c.type === 'finale'

        return (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectCard(idx)}
            className={`transition-all duration-200 rounded-full ${
              isCurrent
                ? `w-6 h-1.5 ${theme.dotActive || theme.accentDotActive || 'bg-amber-400'}`
                : isCompleted
                ? 'w-2.5 h-1.5 bg-emerald-400/90'
                : isAuxCard
                ? 'w-1.5 h-1.5 bg-white/40'
                : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
            }`}
            title={
              c.type === 'welcome'
                ? '欢迎卡'
                : c.type === 'summary'
                ? '当日清算卡'
                : c.type === 'finale'
                ? '完赛卡'
                : isCompleted
                ? `动作 #${idx} 已完成`
                : `动作 #${idx}`
            }
          />
        )
      })}
    </div>
  )
}
