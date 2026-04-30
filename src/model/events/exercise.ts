import type { LifeEvent, YearImpact } from '../types'
import { getBaselineCost } from '../types'
import { moneyToExp } from '../../data/money-exp'

/**
 * 「锻炼」事件
 * - 占用时间但小（按周折算）
 * - 健身花费有体验加成（饱和函数）
 * - 持续锻炼 → 中老年死亡概率下降（医学证据强）
 * - 终身体验率小幅 +
 */
interface ExerciseParams extends Record<string, number | string | boolean> {
  startAge: number
  endAge: number
  /** 每周锻炼小时数，1-15 */
  hoursPerWeek: number
  /** 年花费（健身房 / 装备等） */
  annualCost: number
}

export function makeExercise(p: Partial<ExerciseParams> = {}): LifeEvent {
  const params: ExerciseParams = {
    startAge: p.startAge ?? 25,
    endAge: p.endAge ?? 70,
    hoursPerWeek: p.hoursPerWeek ?? 4,
    annualCost: p.annualCost ?? 5_000,
  }
  return {
    id: 'exercise',
    type: 'exercise',
    name: '锻炼',
    startAge: params.startAge,
    endAge: params.endAge,
    removable: true,
    params,
    impactAt(age, ctx): YearImpact {
      if (age < params.startAge || age >= params.endAge) return zero()
      const baseline = getBaselineCost(ctx)

      const timeHours = params.hoursPerWeek / 7
      const moneyFlow = -params.annualCost
      // 健身花费 → 体验（小消费但确实是品质投入）
      const expFromCost = moneyToExp(params.annualCost + baseline, baseline)
      // 锻炼本身的愉悦（运动后 endorphin），随强度小幅增长
      const exerciseJoy = Math.min(0.3, params.hoursPerWeek * 0.04)
      const expDelta = expFromCost + exerciseJoy
      // 健康习惯 → 体验率小幅 +
      const expMult = 1 + Math.min(0.05, params.hoursPerWeek * 0.005)

      // 死亡分布：规律锻炼适度延寿（医学证据 1-3 年差异，比之前减半）
      const deathShift: { age: number; weight: number }[] = []
      const w = Math.min(0.0006, params.hoursPerWeek * 0.00012)
      for (let a = 50; a <= 75; a++) deathShift.push({ age: a, weight: -w })
      for (let a = 80; a <= 100; a++) deathShift.push({ age: a, weight: w })

      return {
        timeHours,
        moneyFlow,
        consumptionFlow: params.annualCost,
        expDelta,
        expMult,
        deathShift,
      }
    },
  }
}

function zero(): YearImpact {
  return { timeHours: 0, moneyFlow: 0, expDelta: 0, expMult: 1 }
}
