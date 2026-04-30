import type { Scenario, SimResult, LifeEvent } from '../../model/types'
import { useUIStore } from '../../store/ui'
import { ALL_EVENT_LABELS } from '../../model/event-factory'

interface Props {
  scenario: Scenario
  result: SimResult
}

const T_END = 100

function eventLabel(type: LifeEvent['type']): { emoji: string; label: string } {
  return ALL_EVENT_LABELS[type] ?? { emoji: '⚙️', label: type }
}

export default function EventTimeline({ scenario, result }: Props) {
  const t0 = result.ages[0]
  const range = T_END - t0
  const selected = useUIStore((s) => s.selectedEventId)
  const selectEvent = useUIStore((s) => s.selectEvent)
  const openAdd = useUIStore((s) => s.openAddEvent)
  const hint = !useUIStore((s) => s.hasSeenDragHint)
  const markSeen = useUIStore((s) => s.markHintSeen)

  return (
    <section className="card p-5 flex flex-col w-full min-h-0">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-base font-semibold">人生事件</h3>
        <button
          onClick={() => openAdd(true)}
          className="text-sm text-slate-500 hover:text-ink transition-colors"
        >
          + 添加事件
        </button>
      </div>

      {/* 年龄刻度 */}
      <div className="relative h-5 mb-2 text-xs text-slate-400 tabular-nums shrink-0">
        {[t0, ...tickMarks(t0)].map((age) => (
          <span
            key={age}
            className="absolute -translate-x-1/2"
            style={{ left: `${((age - t0) / range) * 100}%` }}
          >
            {age}
          </span>
        ))}
      </div>
      <div className="relative h-px bg-slate-200 mb-3 shrink-0" />

      {/* 事件条 — 超出滚动 */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
        {scenario.events.map((ev) => {
          const rawStart = ev.startAge
          const rawEnd = ev.endAge === 'lifetime' ? T_END : ev.endAge
          const isPast = rawEnd <= t0
          const isSelected = selected === ev.id
          const { emoji, label } = eventLabel(ev.type)
          const displayLabel = ev.type === 'custom' ? ev.name : label

          // 已完成事件（如已毕业的"上学"）：渲染为左侧灰色 pill，可点击编辑
          if (isPast) {
            return (
              <div key={ev.id} className="relative flex items-center group">
                <div className="w-20 text-sm text-slate-400 shrink-0 truncate">
                  <span className="mr-1">{emoji}</span>
                  {displayLabel}
                </div>
                <div className="flex-1 relative h-7">
                  <div className="absolute inset-y-0 inset-x-0 rounded bg-slate-100" />
                  <button
                    onClick={() => selectEvent(ev.id)}
                    className={`absolute top-0 bottom-0 left-0 rounded-md transition-all duration-200 px-2 ${
                      isSelected
                        ? 'bg-slate-700 text-white shadow-lift'
                        : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                    }`}
                    style={{ lineHeight: '1.6rem' }}
                    title="已完成事件，点击查看 / 编辑"
                  >
                    <span className="text-xs tabular-nums">
                      ✓ {rawStart}-{rawEnd}
                    </span>
                  </button>
                </div>
              </div>
            )
          }

          // 正常事件
          const start = clamp(rawStart, t0, T_END)
          const end = clamp(rawEnd, t0, T_END)
          const left = ((start - t0) / range) * 100
          const width = Math.max(2, ((end - start) / range) * 100)
          // 基础/终生事件实际从 t0 之前就开始 → 显示真实起始年龄
          const labelStart = rawStart < t0 ? rawStart : start
          const labelEnd = rawEnd === T_END ? '∞' : rawEnd
          const startedBeforeT0 = rawStart < t0

          return (
            <div key={ev.id} className="relative flex items-center group">
              <div className="w-20 text-sm text-slate-600 shrink-0 truncate">
                <span className="mr-1">{emoji}</span>
                {displayLabel}
              </div>
              <div className="flex-1 relative h-7">
                <div className="absolute inset-y-0 inset-x-0 rounded bg-slate-100" />
                <button
                  onClick={() => {
                    selectEvent(ev.id)
                    if (hint) markSeen()
                  }}
                  className={`absolute top-0 bottom-0 rounded-md transition-all duration-200 ${
                    isSelected
                      ? 'bg-ink text-white shadow-lift'
                      : 'bg-white border-2 border-slate-300 hover:border-ink hover:shadow-soft'
                  }`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${labelStart} - ${labelEnd === '∞' ? '终生' : labelEnd} 岁`}
                >
                  <span
                    className={`text-xs px-1.5 truncate block tabular-nums ${
                      isSelected ? 'text-white' : 'text-slate-500'
                    }`}
                    style={{ lineHeight: '1.6rem' }}
                  >
                    {startedBeforeT0 && '◀ '}
                    {labelStart}-{labelEnd}
                  </span>
                  {hint && ev.id === scenario.events[0]?.id && (
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs bg-ink text-white px-2 py-1 rounded whitespace-nowrap animate-pulse">
                      点我看看 ↓
                    </span>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-xs text-slate-400 shrink-0">点击事件 → 拖动参数即时查看影响</p>
    </section>
  )
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}

function tickMarks(t0: number): number[] {
  // 每 10 年一个刻度
  const start = Math.ceil(t0 / 10) * 10
  const out: number[] = []
  for (let a = start; a < T_END; a += 10) out.push(a)
  out.push(T_END)
  return out
}
