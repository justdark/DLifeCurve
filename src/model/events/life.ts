import type { LifeEvent, SimContext, YearImpact } from '../types'
import { getBaselineCost } from '../types'
import { moneyToExp } from '../../data/money-exp'

/**
 * 「生活」基础事件（不可删）
 *
 *  优先级最低：只用其他事件占完后剩下的时间
 *  - 时间：在 simulator 中作为"剩余时间"自动获得
 *    （事件本身报 0 dedicated hours）
 *  - 金钱：用户设"年生活预算"，按 consumptionFlow 计入
 *  - 体验：spendExp(baseline + 生活预算) × 生活时间因子（核心体验来源）
 */
interface LifeParams extends Record<string, number | string | boolean> {
  /** 年生活预算（元/年）：除基础生存外，主动花在享受生活上的钱 */
  yearlyBudget: number
}

export function makeLife(p: Partial<LifeParams> = {}): LifeEvent {
  const params: LifeParams = {
    yearlyBudget: p.yearlyBudget ?? 50_000, // 默认 5 万/年用于"生活"
  }
  return {
    id: 'life',
    type: 'life',
    name: '生活',
    startAge: 0,
    endAge: 'lifetime',
    removable: false,
    params,
    impactAt(_age: number, ctx: SimContext): YearImpact {
      const baseline = getBaselineCost(ctx)
      // 生活事件的体验来自"金钱→饱和函数"：生活预算越足，spendExp 越高
      // 注意：simulator 还会再乘"生活时间因子"（leisureHours/8）来反映时间压缩
      // 这里报告的是"满 leisure 时的潜在体验"
      const spendExp = moneyToExp(baseline + params.yearlyBudget, baseline)
      return {
        timeHours: 0,
        moneyFlow: -params.yearlyBudget,
        consumptionFlow: params.yearlyBudget,
        expDelta: spendExp,
        expMult: 1,
        flexible: true,
      }
    },
  }
}
