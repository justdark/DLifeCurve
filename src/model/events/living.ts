import type { LifeEvent, SimContext, YearImpact } from '../types'

/**
 * 「生存」基础事件（不可删）
 *
 * 全程激活：
 *  - 消耗 baselineCost（年基础生存费）
 *  - 时间占用：基础生活活动 ~1 小时/天
 *  - 体验加成：本身无加成（baseline ε 由 simulator 兜底为 1）
 */
interface LivingParams extends Record<string, number | string | boolean> {
  /** 年基础生存费（元/年）—— 整个模型的消费基准锚点 */
  baselineCost: number
  /** 基础生活时间占用（小时/天） */
  baseHoursPerDay: number
}

export function makeLiving(p: Partial<LivingParams> = {}): LifeEvent {
  const params: LivingParams = {
    baselineCost: p.baselineCost ?? 80_000,
    baseHoursPerDay: p.baseHoursPerDay ?? 1,
  }
  return {
    id: 'living',
    type: 'living',
    name: '生存',
    startAge: 0,
    endAge: 'lifetime',
    removable: false,
    params,
    impactAt(_age: number, _ctx: SimContext): YearImpact {
      // "活着"本身的基础体验感 = +1（之前在 simulator 里以 baseEps=1 兜底）
      return {
        timeHours: params.baseHoursPerDay,
        moneyFlow: -params.baselineCost,
        expDelta: 1,
        expMult: 1,
      }
    },
  }
}
