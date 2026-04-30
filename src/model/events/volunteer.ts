import type { LifeEvent, SimContext, YearImpact } from '../types'

/**
 * 「公益志愿」事件
 * - 占用一些时间，钱不消耗
 * - 给予稳定的"意义感" ε
 * - 长期参与提升体验率（更通透地看人生）
 */
interface VolunteerParams extends Record<string, number | string | boolean> {
  startAge: number
  endAge: number
  /** 每周小时数 */
  hoursPerWeek: number
}

export function makeVolunteer(p: Partial<VolunteerParams> = {}): LifeEvent {
  const params: VolunteerParams = {
    startAge: p.startAge ?? 30,
    endAge: p.endAge ?? 100,
    hoursPerWeek: p.hoursPerWeek ?? 2,
  }
  return {
    id: 'volunteer',
    type: 'volunteer',
    name: '公益志愿',
    startAge: params.startAge,
    endAge: params.endAge,
    removable: true,
    params,
    impactAt(age, _ctx: SimContext): YearImpact {
      if (age < params.startAge || age >= params.endAge) return zero()

      const timeHours = params.hoursPerWeek / 7
      // 投入越多越有意义感，但有边际递减（超过 8h/周不再大幅 +）
      const expDelta = 0.15 + Math.min(0.25, params.hoursPerWeek * 0.03)
      // 长期参与 → 心智提升（小幅永久）
      const expMult = 1 + Math.min(0.04, params.hoursPerWeek * 0.005)

      return {
        timeHours,
        moneyFlow: 0,
        expDelta,
        expMult,
      }
    },
  }
}

function zero(): YearImpact {
  return { timeHours: 0, moneyFlow: 0, expDelta: 0, expMult: 1 }
}
