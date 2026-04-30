import type { LifeEvent, SimContext, YearImpact } from '../types'

/**
 * 「重大疾病」事件
 * - 一次性大额治疗费 + 数年医疗护理消耗
 * - 病期占用时间、降低体验
 * - 严重程度提升后续若干年的死亡概率
 */
interface IllnessParams extends Record<string, number | string | boolean> {
  age: number
  /** 病程年数 */
  durationYears: number
  /** 一次性治疗费（元） */
  treatmentCost: number
  /** 后续年医疗（元/年） */
  yearlyCareCost: number
  /** 严重度 0-1，影响 ε 和寿命扰动 */
  severity: number
  /** 致命级（severity ≥ 0.85）时：预计存活年限 */
  lifespanAfter: number
}

export function makeIllness(p: Partial<IllnessParams> = {}): LifeEvent {
  const params: IllnessParams = {
    age: p.age ?? 60,
    durationYears: p.durationYears ?? 3,
    treatmentCost: p.treatmentCost ?? 300_000,
    yearlyCareCost: p.yearlyCareCost ?? 30_000,
    severity: p.severity ?? 0.6,
    lifespanAfter: p.lifespanAfter ?? 3,
  }
  return {
    id: 'illness',
    type: 'illness',
    name: '重大疾病',
    startAge: params.age,
    endAge: params.age + params.durationYears,
    removable: true,
    params,
    impactAt(age, _ctx: SimContext): YearImpact {
      if (age < params.age || age >= params.age + params.durationYears) return zero()
      const isFirstYear = age === params.age

      const moneyFlow =
        (isFirstYear ? -params.treatmentCost : 0) - params.yearlyCareCost
      // 病期降低体验
      const expDelta = -params.severity * 0.8
      // 病期占用大量时间（休养、治疗）
      const timeHours = params.severity * 6

      // 寿命扰动
      const deathShift: { age: number; weight: number }[] = []
      if (isFirstYear) {
        if (params.severity >= 0.85) {
          // 致命：把死亡集中到 [age, age + lifespanAfter] 区间
          const T_MAX = 100
          const lifeAfter = Math.max(1, params.lifespanAfter)
          const concentrate = 1.5 // 强权重，让该区间死亡概率主导
          for (let a = params.age; a < params.age + lifeAfter && a <= T_MAX; a++) {
            deathShift.push({ age: a, weight: concentrate })
          }
          // 远期年龄强力削减（让其他区间死亡概率几乎归零）
          for (let a = params.age + lifeAfter; a <= T_MAX; a++) {
            deathShift.push({ age: a, weight: -concentrate * 5 })
          }
        } else {
          // 非致命：病期后 5 年死亡概率小幅上升
          const w = params.severity * 0.005
          const startA = params.age + params.durationYears
          for (let a = startA; a < startA + 5 && a <= 100; a++) {
            deathShift.push({ age: a, weight: w })
          }
          for (let a = 90; a <= 100; a++) {
            deathShift.push({ age: a, weight: -w / 2 })
          }
        }
      }

      return {
        timeHours,
        moneyFlow,
        expDelta,
        expMult: 1,
        deathShift: deathShift.length ? deathShift : undefined,
      }
    },
  }
}

function zero(): YearImpact {
  return { timeHours: 0, moneyFlow: 0, expDelta: 0, expMult: 1 }
}
