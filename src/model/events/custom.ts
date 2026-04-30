import type {
  LifeEvent,
  SimContext,
  YearImpact,
  CustomEventCurves,
  CurveAnchor,
} from '../types'

interface CustomParams extends Record<string, number | string | boolean> {
  /** 事件展示名 */
  displayName: string
  /** 时间范围（用于 timeline 上的 bar 显示） */
  startAge: number
  endAge: number
  /** 是否柔性（与生活时间共存） */
  flexible: boolean
  /** 4 条曲线的锚点（JSON-stringified） */
  curvesJson: string
}

export const EMPTY_CURVES: CustomEventCurves = {
  time: [],
  money: [],
  exp: [],
  death: [],
  flexible: false,
}

/** 线性插值，曲线外的年龄返回 0 */
function interpolateAt(anchors: CurveAnchor[], age: number): number {
  if (anchors.length === 0) return 0
  if (age < anchors[0].age) return 0
  if (age > anchors[anchors.length - 1].age) return 0
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i]
    const b = anchors[i + 1]
    if (age >= a.age && age <= b.age) {
      if (b.age === a.age) return a.value
      const t = (age - a.age) / (b.age - a.age)
      return a.value + t * (b.value - a.value)
    }
  }
  return 0
}

export function parseCurves(json: string): CustomEventCurves {
  try {
    const parsed = JSON.parse(json) as CustomEventCurves
    return {
      time: parsed.time ?? [],
      money: parsed.money ?? [],
      exp: parsed.exp ?? [],
      death: parsed.death ?? [],
      flexible: parsed.flexible ?? false,
    }
  } catch {
    return EMPTY_CURVES
  }
}

export function makeCustom(p: Partial<CustomParams> = {}, id?: string): LifeEvent {
  const params: CustomParams = {
    displayName: p.displayName ?? '自定义事件',
    startAge: p.startAge ?? 30,
    endAge: p.endAge ?? 50,
    flexible: p.flexible ?? false,
    curvesJson: p.curvesJson ?? JSON.stringify(EMPTY_CURVES),
  }
  return {
    id: id ?? `custom-${Date.now()}`,
    type: 'custom',
    name: params.displayName,
    startAge: params.startAge,
    endAge: params.endAge,
    removable: true,
    params,
    impactAt(age: number, _ctx: SimContext): YearImpact {
      const c = parseCurves(params.curvesJson)
      const timeHours = interpolateAt(c.time, age)
      const moneyFlow = interpolateAt(c.money, age)
      const expDelta = interpolateAt(c.exp, age)
      const deathAt = interpolateAt(c.death, age)
      const deathShift = deathAt !== 0 ? [{ age, weight: deathAt }] : undefined
      // 自定义事件：负向 moneyFlow 默认视为主动消费（计入生活预算）
      const consumptionFlow = moneyFlow < 0 ? -moneyFlow : 0
      return {
        timeHours,
        moneyFlow,
        consumptionFlow,
        expDelta,
        expMult: 1,
        deathShift,
        flexible: c.flexible,
      }
    },
  }
}
