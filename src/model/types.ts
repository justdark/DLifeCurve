import type { Gender } from '../data/death-table'

export type { Gender }

export type Marriage = 'single' | 'married' | 'divorced'
export type Health = 'healthy' | 'sub-healthy' | 'chronic'

/* ---------- 用户画像（Onboarding 产出） ---------- */
export interface UserProfile {
  birthYear: number
  gender: Gender
  /** 当前年到手收入（元） */
  currentIncome: number
  /** 起始资产（元） */
  initialWealth: number
  /** 期望日均睡眠时长（小时） */
  sleepHours: number
  /** 名义投资收益率（小数，0.04 = 4%） */
  investmentReturn: number
  /** 通胀率（小数，0.02 = 2%） */
  inflationRate: number

  marriage: Marriage
  childrenCount: 0 | 1 | 2 | 3
  hasHouse: boolean
  health: Health

  /** onboarding 时的初值；之后由对应事件持有 */
  initWorkSatisfaction: number
  initMarriageHappiness: number
  /** onboarding 时的初值；存到 living 事件 */
  initBaselineCost: number

  completedAt: number
  version: number
}

/* ---------- 全局参数 ---------- */
export interface GlobalParams {
  currentAge: number
  initialWealth: number
  gender: Gender
  /** 当前年到手收入（元），work 事件按此外推 */
  currentIncome: number
  /** 真实回报 = investmentReturn - inflationRate，每年财富复利用 */
  realReturn: number
  /** 名义投资收益率（仅记录展示用） */
  investmentReturn: number
  /** 通胀率（仅记录展示用） */
  inflationRate: number
}

/* ---------- 事件类型 ---------- */
export type EventType =
  | 'living'      // 基础事件：保命的硬支出（不可删）
  | 'sleep'       // 基础事件：睡眠（不可删）
  | 'life'        // 基础事件：享受生活，最低优先级（不可删）
  | 'education'   // 上学（毕业后终身体验率加成）
  | 'work'
  | 'marriage'
  | 'children'
  | 'house'
  | 'world-travel'
  | 'exercise'    // 锻炼：延寿、提升体验能力
  | 'startup'     // 创业：高时间投入 + 期望回报
  | 'hobby'       // 兴趣爱好：长期体验加成
  | 'illness'     // 重大疾病：负面事件
  | 'volunteer'   // 公益志愿：意义感
  | 'custom'      // 用户自定义事件（曲线驱动）

/** 单年事件影响 */
export interface YearImpact {
  /** 时间占用（小时/天） */
  timeHours: number
  /** 净现金流（元/年，正=收入） */
  moneyFlow: number
  /**
   * 主动消费（元/年，>0）：算作"生活预算"参与 spendExp 计算
   * 比如旅行/学习的开支 = 消费类；房贷/抚养费 = 不算（不是用来享受的）
   */
  consumptionFlow?: number
  /** 体验加成（加性） */
  expDelta: number
  /** 体验乘子（默认 1） */
  expMult: number
  /** 对死亡分布的扰动 */
  deathShift?: { age: number; weight: number }[]
  /** 是否柔性事件（可与生活时间共存，时间占用不计入 dedicated 总和） */
  flexible?: boolean
}

export interface LifeEvent {
  id: string
  type: EventType
  name: string
  startAge: number
  endAge: number | 'lifetime'
  /** 是否可删除（基础事件 false） */
  removable: boolean
  /** 事件类型决定的可调参数 */
  params: Record<string, number | string | boolean>
  /** 计算单年影响 */
  impactAt(age: number, ctx: SimContext): YearImpact
}

/** 模拟上下文 */
export interface SimContext {
  profile: UserProfile
  global: GlobalParams
  /** 当前 scenario 的事件列表（用于事件间互查，如 living 查询是否退休） */
  events: LifeEvent[]
}

/** 从 ctx 取出 baselineCost（来自 living 事件）；找不到时回退到默认 80000 */
export function getBaselineCost(ctx: SimContext): number {
  const living = ctx.events.find((e) => e.type === 'living')
  if (!living) return 80_000
  const v = living.params.baselineCost as number | undefined
  return typeof v === 'number' ? v : 80_000
}

/* ---------- 自定义事件曲线 ---------- */
export interface CurveAnchor {
  age: number
  value: number
}

export interface CustomEventCurves {
  /** 时间占用 (age, hours) */
  time: CurveAnchor[]
  /** 现金流 (age, yuan/year) */
  money: CurveAnchor[]
  /** 体验加成 (age, delta) */
  exp: CurveAnchor[]
  /** 寿命扰动 (age, weight)，Σ 应为 0 */
  death: CurveAnchor[]
  flexible: boolean
}

/* ---------- 场景 ---------- */
export interface Scenario {
  id: string
  name: string
  isBaseline: boolean
  globalParams: GlobalParams
  events: LifeEvent[]
  createdAt: number
  updatedAt: number
}

/* ---------- 模拟结果 ---------- */
export interface SimWarning {
  type: 'time-overload' | 'wealth-depleted' | 'sleep-short'
  age: number
  message: string
}

/** 单个事件按年的影响分解（用于"图表放大"分解视图） */
export interface PerEventSeries {
  id: string
  type: EventType
  name: string
  /** 时间占用 h/天 */
  time: number[]
  /** 现金流 元/年（折扣后实际值） */
  money: number[]
  /** 体验加成 ε（折扣后实际计入的值） */
  exp: number[]
  /** 体验率乘子 - 1（=0 表示无乘性影响） */
  muDelta: number[]
  /** 死亡分布扰动权重（按年龄索引），>0 增 / <0 减 */
  deathShift: number[]
}

export interface SimResult {
  ages: number[]
  M: number[]
  P: number[]
  V: number[]
  EV: number[]
  cumL: number[]
  /** 体验率 = f(t) × prodMu(t)：年龄+事件综合后的体验能力系数 */
  expRate: number[]
  /** f(t) 单独：年龄基线体验能力 */
  fT: number[]
  /** 每年理财收益（=年初财富 × realReturn，元） */
  investmentIncome: number[]
  /** 生活时间小时 / 天 */
  leisure: number[]
  /** 拥挤度（>1 时间冲突）*/
  crowding: number[]
  /** 各事件按年的影响分解 */
  perEvent: PerEventSeries[]
  L: number
  expectedLifespan: number
  peakYears: [number, number]
  warnings: SimWarning[]
}
