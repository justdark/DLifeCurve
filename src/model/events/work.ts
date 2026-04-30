import type { LifeEvent, SimContext, YearImpact } from '../types'
import { salaryAt } from '../../data/salary-curve'

interface WorkParams extends Record<string, number | string | boolean> {
  startAge: number
  endAge: number
  hoursPerDay: number
  salaryMultiplier: number
  /** 工作满足度 -1 ~ +1 */
  satisfaction: number
}

export function makeWork(p: Partial<WorkParams> = {}): LifeEvent {
  const params: WorkParams = {
    startAge: p.startAge ?? 23,
    endAge: p.endAge ?? 62,
    hoursPerDay: p.hoursPerDay ?? 8,
    salaryMultiplier: p.salaryMultiplier ?? 1.0,
    satisfaction: p.satisfaction ?? 0.2,
  }
  return {
    id: 'work',
    type: 'work',
    name: '工作',
    startAge: params.startAge,
    endAge: params.endAge,
    removable: true,
    params,
    impactAt(age: number, ctx: SimContext): YearImpact {
      if (age < params.startAge || age >= params.endAge) {
        return zero()
      }
      const baseSalary =
        salaryAt(ctx.global.currentAge, ctx.profile.currentIncome, age) *
        params.salaryMultiplier
      const intensityFactor =
        params.hoursPerDay <= 8 ? 0.85 :
        params.hoursPerDay <= 10 ? 1.0 :
        params.hoursPerDay <= 12 ? 1.1 :
        1.15
      const moneyFlow = baseSalary * intensityFactor

      // 满足度直接转 ε：±0.3
      const expDelta = params.satisfaction * 0.3

      // 高强度过劳 → 寿命扰动
      const deathShift: { age: number; weight: number }[] = []
      if (params.hoursPerDay > 11) {
        const w = (params.hoursPerDay - 11) * 0.001
        for (let a = 50; a <= 70; a++) deathShift.push({ age: a, weight: w })
        for (let a = 75; a <= 100; a++) deathShift.push({ age: a, weight: -w })
      }

      return {
        timeHours: params.hoursPerDay,
        moneyFlow,
        expDelta,
        expMult: 1,
        deathShift,
      }
    },
  }
}

function zero(): YearImpact {
  return { timeHours: 0, moneyFlow: 0, expDelta: 0, expMult: 1 }
}
