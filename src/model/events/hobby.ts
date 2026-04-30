import type { LifeEvent, YearImpact } from '../types'
import { getBaselineCost } from '../types'
import { moneyToExp } from '../../data/money-exp'

/**
 * 「兴趣爱好」事件
 * - 中等时间投入
 * - 钱投入越多体验越好（饱和函数）
 * - 强度高的兴趣会提升终身体验率
 */
interface HobbyParams extends Record<string, number | string | boolean> {
  /** 自定义名字（如：摄影、音乐） */
  displayName: string
  startAge: number
  endAge: number
  hoursPerDay: number
  annualCost: number
  /** 沉浸度 0-1，决定 ε 和 mu 加成 */
  intensity: number
}

export function makeHobby(p: Partial<HobbyParams> = {}): LifeEvent {
  const params: HobbyParams = {
    displayName: p.displayName ?? '兴趣爱好',
    startAge: p.startAge ?? 25,
    endAge: p.endAge ?? 100,
    hoursPerDay: p.hoursPerDay ?? 1,
    annualCost: p.annualCost ?? 6_000,
    intensity: p.intensity ?? 0.6,
  }
  return {
    id: 'hobby',
    type: 'hobby',
    name: params.displayName,
    startAge: params.startAge,
    endAge: params.endAge,
    removable: true,
    params,
    impactAt(age, ctx): YearImpact {
      if (age < params.startAge || age >= params.endAge) return zero()
      const baseline = getBaselineCost(ctx)

      const expFromCost = moneyToExp(params.annualCost + baseline, baseline)
      const intensityJoy = params.intensity * 0.4
      const expDelta = expFromCost + intensityJoy
      // 沉浸度高的兴趣 → 终身体验率小幅 +（兴趣丰富人生）
      const expMult = 1 + params.intensity * 0.06

      return {
        timeHours: params.hoursPerDay,
        moneyFlow: -params.annualCost,
        consumptionFlow: params.annualCost,
        expDelta,
        expMult,
      }
    },
  }
}

function zero(): YearImpact {
  return { timeHours: 0, moneyFlow: 0, expDelta: 0, expMult: 1 }
}
