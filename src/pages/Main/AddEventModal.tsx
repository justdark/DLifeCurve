import { useUIStore } from '../../store/ui'
import { useScenarioStore } from '../../store/scenario'
import { ADDABLE_EVENT_DEFS, rehydrateEvent } from '../../model/event-factory'
import type { EventType } from '../../model/types'
import { EMPTY_CURVES } from '../../model/events/custom'

export default function AddEventModal() {
  const open = useUIStore((s) => s.showAddEvent)
  const setOpen = useUIStore((s) => s.openAddEvent)
  const scenario = useScenarioStore((s) => s.scenario)
  const addEvent = useScenarioStore((s) => s.addEvent)
  const selectEvent = useUIStore((s) => s.selectEvent)

  if (!open || !scenario) return null

  const existingTypes = new Set(scenario.events.map((e) => e.type))
  const t0 = scenario.globalParams.currentAge

  const livingEv = scenario.events.find((e) => e.type === 'living')
  const baseline = (livingEv?.params.baselineCost as number | undefined) ?? 80_000

  const handleAdd = (type: EventType) => {
    const id = type === 'custom' ? `custom-${Date.now()}` : `${type}-${Date.now()}`
    const ev = rehydrateEvent({ id, type, params: defaultParams(type, t0) }, baseline)
    if (!ev) return
    addEvent({ ...ev, id })
    setOpen(false)
    selectEvent(id)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/30 flex items-center justify-center p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-lift max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-1">添加事件</h3>
        <p className="text-sm text-slate-500 mb-5">
          选一个预设事件，或定制完全属于你的人生事件
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ADDABLE_EVENT_DEFS.map((d) => {
            // 工作/婚姻/生娃/买房：每个 scenario 只允许一个
            const singleton =
              d.type === 'work' ||
              d.type === 'marriage' ||
              d.type === 'children' ||
              d.type === 'house'
            const taken = singleton && existingTypes.has(d.type)
            return (
              <button
                key={d.type}
                disabled={taken}
                onClick={() => handleAdd(d.type)}
                className="text-left p-3 rounded-xl border-2 border-slate-200 hover:border-ink hover:shadow-soft transition-all disabled:opacity-30 disabled:hover:border-slate-200"
              >
                <span className="text-2xl mr-2">{d.emoji}</span>
                <span className="font-medium">{d.label}</span>
                {taken && <span className="ml-2 text-xs text-slate-400">已添加</span>}
              </button>
            )
          })}
        </div>
        <button onClick={() => setOpen(false)} className="btn-ghost w-full mt-4">
          取消
        </button>
      </div>
    </div>
  )
}

function defaultParams(type: EventType, t0: number): Record<string, number | string | boolean> {
  switch (type) {
    case 'education':
      return { startAge: 6, endAge: 22, yearlyTuition: 20_000, expMultBoost: 1.1 }
    case 'work':
      return { startAge: Math.min(23, t0), endAge: 62, hoursPerDay: 8, salaryMultiplier: 1.0 }
    case 'marriage':
      return { startAge: Math.max(t0 + 1, 30), sharedCostMultiplier: 0.85 }
    case 'children':
      return { startAge: Math.max(t0 + 1, 32), count: 1, raiseUntil: 22, filialSupport: 0.5 }
    case 'house':
      return {
        buyAge: Math.max(t0 + 1, 35),
        totalPrice: 3_500_000,
        downPaymentRatio: 0.3,
        loanYears: 30,
        interestRate: 0.04,
      }
    case 'world-travel':
      return { age: Math.max(t0 + 1, 45), durationYears: 0.5, totalCost: 500_000 }
    case 'exercise':
      return { startAge: Math.max(t0, 25), endAge: 70, hoursPerWeek: 4, annualCost: 5_000 }
    case 'startup':
      return {
        startAge: Math.max(t0 + 1, 35),
        endAge: Math.max(t0 + 5, 40),
        initialInvestment: 500_000,
        expectedReturnMultiplier: 1.2,
        hoursPerDay: 12,
        passion: 0.7,
      }
    case 'hobby':
      return {
        displayName: '兴趣爱好',
        startAge: Math.max(t0, 25),
        endAge: 100,
        hoursPerDay: 1,
        annualCost: 6_000,
        intensity: 0.6,
      }
    case 'illness':
      return {
        age: Math.max(t0 + 1, 60),
        durationYears: 3,
        treatmentCost: 300_000,
        yearlyCareCost: 30_000,
        severity: 0.6,
        lifespanAfter: 3,
      }
    case 'volunteer':
      return { startAge: Math.max(t0, 30), endAge: 100, hoursPerWeek: 2 }
    case 'custom':
      return {
        displayName: '我的事件',
        startAge: t0,
        endAge: t0 + 10,
        flexible: false,
        curvesJson: JSON.stringify(EMPTY_CURVES),
      }
    case 'living':
    case 'sleep':
    case 'life':
      return {} // 基础事件由系统创建，不通过此入口
    default: {
      const _exhaustive: never = type
      throw new Error(`unhandled type: ${_exhaustive}`)
    }
  }
}
