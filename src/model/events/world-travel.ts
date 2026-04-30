import type { LifeEvent, YearImpact, SimContext } from '../types'
import { getBaselineCost } from '../types'
import { moneyToExp } from '../../data/money-exp'

interface TravelParams extends Record<string, number | string | boolean> {
  age: number
  durationYears: number
  totalCost: number
}

export function makeWorldTravel(p: Partial<TravelParams> = {}): LifeEvent {
  const params: TravelParams = {
    age: p.age ?? 45,
    durationYears: p.durationYears ?? 0.5,
    totalCost: p.totalCost ?? 500_000,
  }
  return {
    id: 'world-travel',
    type: 'world-travel',
    name: '环球旅行',
    startAge: params.age,
    endAge: Math.ceil(params.age + params.durationYears),
    removable: true,
    params,
    impactAt(age: number, ctx: SimContext): YearImpact {
      if (age !== params.age) return zero()
      const baseline = getBaselineCost(ctx)
      // 体验直接来自饱和函数：花的钱越多越好（10×→3.14× 上限）
      const expDelta = moneyToExp(params.totalCost + baseline, baseline)
      return {
        timeHours: 0,
        moneyFlow: -params.totalCost,
        consumptionFlow: params.totalCost,
        expDelta,
        expMult: 1,
        flexible: true,
      }
    },
  }
}

function zero(): YearImpact {
  return { timeHours: 0, moneyFlow: 0, expDelta: 0, expMult: 1 }
}
