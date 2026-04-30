import type { LifeEvent, SimContext, YearImpact } from '../types'
import { getBaselineCost } from '../types'
import { defaultChildCost } from '../../data/defaults'
import { moneyToExp } from '../../data/money-exp'

interface ChildrenParams extends Record<string, number | string | boolean> {
  startAge: number
  count: number
  raiseUntil: number
  filialSupport: number // 0 ~ 1
}

export function makeChildren(p: Partial<ChildrenParams> = {}): LifeEvent {
  const params: ChildrenParams = {
    startAge: p.startAge ?? 32,
    count: p.count ?? 1,
    raiseUntil: p.raiseUntil ?? 22,
    filialSupport: p.filialSupport ?? 0.5,
  }
  return {
    id: 'children',
    type: 'children',
    name: '生娃',
    startAge: params.startAge,
    endAge: 'lifetime',
    removable: true,
    params,
    impactAt(age: number, ctx: SimContext): YearImpact {
      if (age < params.startAge) return zero()
      const baseline = getBaselineCost(ctx)
      const yearsSince = age - params.startAge
      const raising = yearsSince < params.raiseUntil

      const childYearCost = defaultChildCost(baseline) * params.count

      let moneyFlow = 0
      let timeHours = 0
      let consumption = 0
      let expDelta = 0

      if (raising) {
        moneyFlow = -childYearCost
        consumption = childYearCost
        timeHours = 2 * params.count
        // 抚养消费 → 饱和体验加成
        const expFromConsumption = moneyToExp(childYearCost + baseline, baseline)
        // 抚养的情感价值（按阶段）
        const phaseFactor = yearsSince < 6 ? 1.2 : yearsSince < 18 ? 1.0 : 0.5
        const emotionalDelta = 0.15 * params.count * phaseFactor
        expDelta = expFromConsumption + emotionalDelta
      } else {
        timeHours = 0.5 * params.count
        expDelta = 0.15 * params.count
        if (age >= 65) {
          moneyFlow = childYearCost * 0.1 * params.filialSupport
          expDelta += 0.2 * params.filialSupport * params.count
        }
      }

      return {
        timeHours,
        moneyFlow,
        consumptionFlow: consumption,
        expDelta,
        expMult: 1,
      }
    },
  }
}

function zero(): YearImpact {
  return { timeHours: 0, moneyFlow: 0, expDelta: 0, expMult: 1 }
}
