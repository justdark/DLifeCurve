import type { LifeEvent, SimContext, YearImpact } from '../types'
import { getBaselineCost } from '../types'
import { DEFAULT_SHARED_COST_MULTIPLIER } from '../../data/defaults'

interface MarriageParams extends Record<string, number | string | boolean> {
  startAge: number
  /** 婚后共同消费倍率（相对单身基线） */
  sharedCostMultiplier: number
  /** 婚姻幸福度 0 ~ 1 */
  happiness: number
}

export function makeMarriage(p: Partial<MarriageParams> = {}): LifeEvent {
  const params: MarriageParams = {
    startAge: p.startAge ?? 30,
    sharedCostMultiplier: p.sharedCostMultiplier ?? DEFAULT_SHARED_COST_MULTIPLIER,
    happiness: p.happiness ?? 0.6,
  }
  return {
    id: 'marriage',
    type: 'marriage',
    name: '结婚',
    startAge: params.startAge,
    endAge: 'lifetime',
    removable: true,
    params,
    impactAt(age: number, ctx: SimContext): YearImpact {
      if (age < params.startAge) return zero()
      const baseline = getBaselineCost(ctx)
      const extra = baseline * (params.sharedCostMultiplier - 1)
      const moneyFlow = -extra

      // 幸福度 → 加性 ε（情绪体验）+ 乘性 μ（长期稳态加成）
      const yearsMarried = age - params.startAge
      const decay = Math.exp(-yearsMarried / 60)
      const expDelta = (params.happiness - 0.3) * 0.5 * decay
      const expMult = 1 + Math.max(0, params.happiness - 0.3) * 0.18

      return {
        timeHours: 1,
        moneyFlow,
        expDelta,
        expMult,
      }
    },
  }
}

function zero(): YearImpact {
  return { timeHours: 0, moneyFlow: 0, expDelta: 0, expMult: 1 }
}
