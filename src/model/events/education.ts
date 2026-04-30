import type { LifeEvent, SimContext, YearImpact } from '../types'
import { getBaselineCost } from '../types'
import { moneyToExp } from '../../data/money-exp'

/**
 * 「上学」事件
 *
 *  - 在校期间（startAge ≤ age < endAge）：占用 8h/天，缴学费，无收入
 *  - 毕业后终身：体验率 +expMultBoost（书读得越久，越能享受人生）
 *  - 默认 6-22 岁，覆盖大部分用户已完成的学历
 */
interface EducationParams extends Record<string, number | string | boolean> {
  startAge: number
  endAge: number
  /** 在校年学费（元） */
  yearlyTuition: number
  /** 毕业后终身体验率乘子（默认 1.10 = +10%） */
  expMultBoost: number
}

export function makeEducation(p: Partial<EducationParams> = {}): LifeEvent {
  const params: EducationParams = {
    startAge: p.startAge ?? 6,
    endAge: p.endAge ?? 22,
    yearlyTuition: p.yearlyTuition ?? 20_000,
    expMultBoost: p.expMultBoost ?? 1.1,
  }
  return {
    id: 'education',
    type: 'education',
    name: '上学',
    startAge: params.startAge,
    endAge: params.endAge,
    removable: true,
    params,
    impactAt(age: number, ctx: SimContext): YearImpact {
      if (age < params.startAge) return zero()

      // 在校期间
      if (age < params.endAge) {
        const baseline = getBaselineCost(ctx)
        // 学费 → 饱和体验（学得贵则体验高，比如出国留学）
        const expFromTuition =
          params.yearlyTuition > 0
            ? moneyToExp(params.yearlyTuition + baseline, baseline)
            : 0
        return {
          timeHours: 8,
          moneyFlow: -params.yearlyTuition,
          consumptionFlow: params.yearlyTuition,
          expDelta: 0.05 + expFromTuition, // 求学愉悦 + 学费体验
          expMult: 1,
        }
      }

      // 毕业之后终身：乘性体验加成
      return {
        timeHours: 0,
        moneyFlow: 0,
        expDelta: 0,
        expMult: params.expMultBoost,
      }
    },
  }
}

function zero(): YearImpact {
  return { timeHours: 0, moneyFlow: 0, expDelta: 0, expMult: 1 }
}
