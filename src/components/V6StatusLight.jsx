import { V6_STATUS_LIGHTS } from '../data/v6-workout-data'

const ORDER = ['green', 'yellow', 'red']

/**
 * V6 红黄绿灯状态机（常驻紧凑条）
 * 绿灯：自由=器械等效 + 首项爆发向心
 * 黄灯：锁死自由版 + 跳过爆发 + 容量下调 1-2 组
 * 红灯：主课表折叠，替换为主动恢复卡
 */
export default function V6StatusLight({ statusLight, onChange, theme }) {
  const cur = V6_STATUS_LIGHTS[statusLight] || V6_STATUS_LIGHTS.green

  return (
    <div className={`shrink-0 mx-3 mt-1.5 rounded-2xl border p-2 ${theme.subCardBg}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-black tracking-wide opacity-80">
          今日身体就绪状态灯
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cur.card} ${cur.text}`}>
          {cur.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mt-1.5">
        {ORDER.map((k) => {
          const s = V6_STATUS_LIGHTS[k]
          const on = statusLight === k
          return (
            <button
              key={k}
              type="button"
              onClick={() => onChange(k)}
              className={`px-1.5 py-1 rounded-xl border text-left transition-all ${
                on ? `ring-2 ${s.ring} ${s.card}` : 'opacity-55 border-white/10'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />
                <span className="text-[10px] font-black truncate">{s.short}</span>
              </div>
              <div className="text-[9px] opacity-75 leading-tight mt-0.5 line-clamp-2">
                {s.desc}
              </div>
            </button>
          )
        })}
      </div>

      <div className={`mt-1.5 text-[10px] leading-snug ${cur.text}`}>💡 {cur.tip}</div>
    </div>
  )
}
