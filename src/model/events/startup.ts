import type { LifeEvent, SimContext, YearImpact } from '../types'

/**
 * 「创业」事件
 * - 高时间投入（默认 12h/天）→ 与原工作冲突，crowding 自动处理
 * - 启动年一次性投入 initialInvestment
 * - 退出年获得 initialInvestment × expectedReturnMultiplier
 * - 期望回报 < 1 表示亏损（多数创业现实），> 1 表示盈利
 * - 创业激情驱动每年的 ε
 * - 高强度有过劳寿命扰动
 */
interface StartupParams extends Record<string, number | string | boolean> {
  startAge: number
  endAge: number
  /** 启动投入（元） */
  initialInvestment: number
  /** 期望回报倍率：1.0 持平、0.3 大亏、3.0 翻三倍 */
  expectedReturnMultiplier: number
  /** 日均工作小时 */
  hoursPerDay: number
  /** 创业激情（满足度），决定每年的体验加成 */
  passion: number
}

export function makeStartup(p: Partial<StartupParams> = {}): LifeEvent {
  const params: StartupParams = {
    startAge: p.startAge ?? 35,
    endAge: p.endAge ?? 40,
    initialInvestment: p.initialInvestment ?? 500_000,
    expectedReturnMultiplier: p.expectedReturnMultiplier ?? 1.2,
    hoursPerDay: p.hoursPerDay ?? 12,
    passion: p.passion ?? 0.7,
  }
  return {
    id: 'startup',
    type: 'startup',
    name: '创业',
    startAge: params.startAge,
    endAge: params.endAge + 1, // 包含退出年
    removable: true,
    params,
    impactAt(age, _ctx: SimContext): YearImpact {
      if (age < params.startAge || age > params.endAge) return zero()

      let moneyFlow = 0
      if (age === params.startAge) moneyFlow -= params.initialInvestment
      if (age === params.endAge) {
        moneyFlow += params.initialInvestment * params.expectedReturnMultiplier
      }

      // 激情驱动的过程体验
      const expDelta = params.passion * 0.6

      // 长时间高强度 → 过劳寿命影响
      const deathShift: { age: number; weight: number }[] = []
      if (params.hoursPerDay > 12) {
        const w = (params.hoursPerDay - 12) * 0.001
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
