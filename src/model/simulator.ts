import type {
  Scenario,
  SimResult,
  SimWarning,
  UserProfile,
  SimContext,
  YearImpact,
  PerEventSeries,
} from './types'
import {
  T_MAX,
  type DeathTable,
  buildBaseDeathDist,
  applyDeathShift,
  buildSurvival,
  expectedLifespan,
} from '../data/death-table'
import { expCapacity } from '../data/exp-capacity'

const HOURS_PER_DAY = 24

/**
 * 模拟主入口（v0.2 新模型）
 *
 * 核心公式：
 *   时间预算：dedicated 时间 = Σ(非柔性事件 timeHours)
 *   crowding = max(1, dedicated / 24)
 *   折扣 = 1 / crowding （时间冲突时所有产出按比例打折）
 *   生活时间 leisure = max(0, 24 - dedicated)
 *   钱 → 体验：g(年消费, baseline)，饱和上限 2.14
 *   V(t) = f(t) · ε_total
 *   ε_total = baseEps(1) + g(spend) · leisureFactor + Σ(ε_j · 折扣)
 *   leisureFactor = leisure/15  (15h 是默认满满生活时间的参考；不足则按比例)
 */
export function simulate(
  scenario: Scenario,
  profile: UserProfile,
  table: DeathTable,
): SimResult {
  const { globalParams: g, events } = scenario
  const t0 = g.currentAge
  const ages = range(t0, T_MAX + 1)
  const N = ages.length

  const ctx: SimContext = { profile, global: g, events }

  /* ---------- 1. 死亡分布扰动 → 生存概率 ---------- */
  const baseDist = buildBaseDeathDist(table, t0, g.gender)
  const shift = new Float64Array(T_MAX + 1)

  // 先一次扫一遍：获得每年的 yearImpacts，复用到第 2 阶段
  const impactCache: YearImpact[][] = []
  for (let i = 0; i < N; i++) {
    const age = ages[i]
    const list: YearImpact[] = events.map((ev) => ev.impactAt(age, ctx))
    impactCache.push(list)
    // 计算时间冲突折扣（仅作用于死亡扰动权重）
    const crowding = computeCrowding(list)
    const factor = 1 / crowding
    for (const yi of list) {
      if (yi.deathShift) {
        for (const ds of yi.deathShift) {
          if (ds.age >= 0 && ds.age <= T_MAX) shift[ds.age] += ds.weight * factor
        }
      }
    }
  }
  zeroNormalize(shift)
  const dist = applyDeathShift(baseDist, shift)
  const survivalFull = buildSurvival(dist, t0)
  const expLife = expectedLifespan(dist)

  /* ---------- 2. 财富 + 体验 按年迭代 ---------- */
  const M = new Float64Array(N)
  const P = new Float64Array(N)
  const V = new Float64Array(N)
  const EV = new Float64Array(N)
  const expRateArr = new Float64Array(N)
  const fTArr = new Float64Array(N)
  const invIncome = new Float64Array(N)
  const leisure = new Float64Array(N)
  const crowdingArr = new Float64Array(N)
  const warnings: SimWarning[] = []

  // 每事件按年的影响（用于图表放大分解）
  const perEvent: PerEventSeries[] = events.map((ev) => ({
    id: ev.id,
    type: ev.type,
    name: ev.name,
    time: new Array(N).fill(0),
    money: new Array(N).fill(0),
    exp: new Array(N).fill(0),
    muDelta: new Array(N).fill(0),
    deathShift: new Array(T_MAX + 1).fill(0),
  }))

  for (let i = 0; i < N; i++) {
    const age = ages[i]
    P[i] = survivalFull[age]
    const list = impactCache[i]

    // 时间冲突
    const crowding = computeCrowding(list)
    crowdingArr[i] = crowding
    const factor = 1 / crowding
    const dedicatedHours = list
      .filter((yi) => !yi.flexible)
      .reduce((s, yi) => s + yi.timeHours, 0)
    const leisureHours = Math.max(0, HOURS_PER_DAY - dedicatedHours)
    leisure[i] = leisureHours

    if (crowding > 1.001 && !warnings.some((w) => w.type === 'time-overload')) {
      warnings.push({
        type: 'time-overload',
        age,
        message: `${age} 岁起一天事件总占用超过 24 小时，所有事件产出按 ${(factor * 100).toFixed(0)}% 折扣`,
      })
    }

    // 优先级：生存（必需）+ 工作/婚姻/生娃/买房/旅行（中）+ 生活（最低）
    // 钱不够时先砍"生活"预算；生活事件的体验会按砍后比例缩水
    let nonLifeFlow = 0
    let lifeRequest = 0
    let lifeMaxExpDelta = 0 // 生活事件"满预算"时的体验贡献
    let sumEpsEvents = 0
    let prodMu = 1.0
    let lifeIdx = -1
    for (let k = 0; k < list.length; k++) {
      const yi = list[k]
      const ev = events[k]
      // 收集 per-event 序列（只读快照）
      perEvent[k].time[i] = yi.timeHours * factor
      perEvent[k].muDelta[i] = yi.expMult - 1
      if (ev.type === 'life') {
        lifeIdx = k
        lifeRequest = -yi.moneyFlow * factor
        lifeMaxExpDelta = yi.expDelta * factor
        // 钱和 exp 等下用 feasibility ratio 算实际值再写回
      } else {
        nonLifeFlow += yi.moneyFlow * factor
        sumEpsEvents += yi.expDelta * factor
        perEvent[k].money[i] = yi.moneyFlow * factor
        perEvent[k].exp[i] = yi.expDelta * factor
      }
      prodMu *= yi.expMult
    }

    // 生活预算可花量 = min(请求, 非生活流之后的剩余财富)
    const startWealth = i === 0 ? g.initialWealth : M[i - 1]
    const wealthAfterCommitments = startWealth + nonLifeFlow
    const lifeFeasible = Math.max(0, Math.min(lifeRequest, wealthAfterCommitments))
    const totalMoney = nonLifeFlow - lifeFeasible

    // 财富迭代：透支期间不计理财收益（负债的利息不归本模型管）
    if (i === 0) {
      M[0] = g.initialWealth + totalMoney
      invIncome[0] = 0
    } else {
      const after = M[i - 1] + totalMoney
      const interest = after > 0 ? after * g.realReturn : 0
      invIncome[i] = interest
      M[i] = after + interest
    }
    if (M[i] < 0 && !warnings.some((w) => w.type === 'wealth-depleted')) {
      warnings.push({
        type: 'wealth-depleted',
        age,
        message: `${age} 岁起财富开始透支（即便已砍掉生活预算）`,
      })
    }

    // 生活时间因子：8h 是"满足生活"的参考；不足则压缩；超过略增（log）
    const leisureFactor =
      leisureHours <= 0
        ? 0
        : leisureHours <= 8
        ? leisureHours / 8
        : 1 + Math.log(leisureHours / 8) * 0.4

    // 生活体验 = 满预算时贡献 × 砍预算比例 × 生活时间因子
    const lifeFeasibilityRatio = lifeRequest > 0 ? lifeFeasible / lifeRequest : 1
    const lifeExp = lifeMaxExpDelta * lifeFeasibilityRatio * leisureFactor

    // 把 life 事件的实际值写回 perEvent
    if (lifeIdx >= 0) {
      perEvent[lifeIdx].money[i] = -lifeFeasible
      perEvent[lifeIdx].exp[i] = lifeExp
    }

    // 不再加 baseEps（活着的基线体验由 living 事件自己贡献 +1 ε）
    const epsTotal = sumEpsEvents + lifeExp
    const fT = expCapacity(age)
    fTArr[i] = fT

    // 财富透支惩罚：M 越负，体验越差（防止透支换体验）
    // 缓和曲线：M=-1×baseline：0.91；-5×baseline：0.67；-10×baseline：0.50；-30×baseline：0.25
    const livingEv = events.find((e) => e.type === 'living')
    const baseline = (livingEv?.params.baselineCost as number | undefined) ?? 80_000
    const wealthPenalty =
      M[i] < 0 ? 1 / (1 + Math.abs(M[i]) / (10 * baseline)) : 1
    const finalEps = epsTotal * wealthPenalty

    V[i] = Math.max(0, fT * prodMu * finalEps)
    EV[i] = V[i] * P[i]
    expRateArr[i] = fT * prodMu
  }

  // 收集每事件的 deathShift（按目标年龄索引）
  for (let k = 0; k < events.length; k++) {
    for (let i = 0; i < N; i++) {
      const age = ages[i]
      const yi = impactCache[i][k]
      const c = computeCrowding(impactCache[i])
      const f = 1 / c
      if (yi.deathShift) {
        for (const ds of yi.deathShift) {
          if (ds.age >= 0 && ds.age <= T_MAX) {
            perEvent[k].deathShift[ds.age] += ds.weight * f
          }
        }
      }
      void age
    }
  }

  /* ---------- 3. 累积分 + 归一化 ---------- */
  const cumL = new Float64Array(N)
  let acc = 0
  for (let i = 0; i < N; i++) {
    acc += EV[i]
    cumL[i] = acc
  }
  const L = acc
  const peakYears = findPeak(EV, ages)

  return {
    ages,
    M: Array.from(M),
    P: Array.from(P),
    V: Array.from(V),
    EV: Array.from(EV),
    expRate: Array.from(expRateArr),
    fT: Array.from(fTArr),
    investmentIncome: Array.from(invIncome),
    leisure: Array.from(leisure),
    crowding: Array.from(crowdingArr),
    perEvent,
    cumL: Array.from(cumL),
    L,
    expectedLifespan: expLife,
    peakYears,
    warnings,
  }
}

/* ---------- 工具 ---------- */
function computeCrowding(list: YearImpact[]): number {
  // 只计入非柔性事件
  const dedicated = list
    .filter((yi) => !yi.flexible)
    .reduce((s, yi) => s + yi.timeHours, 0)
  return Math.max(1, dedicated / HOURS_PER_DAY)
}

function range(start: number, end: number): number[] {
  const out: number[] = []
  for (let i = start; i < end; i++) out.push(i)
  return out
}

function zeroNormalize(arr: Float64Array): void {
  let sum = 0
  for (let i = 0; i < arr.length; i++) sum += arr[i]
  if (Math.abs(sum) < 1e-9) return
  const correction = sum / arr.length
  for (let i = 0; i < arr.length; i++) arr[i] -= correction
}

function findPeak(EV: Float64Array, ages: number[]): [number, number] {
  const window = 5
  if (EV.length < window) return [ages[0], ages[ages.length - 1]]
  let bestSum = -Infinity
  let bestStart = 0
  for (let i = 0; i + window <= EV.length; i++) {
    let s = 0
    for (let j = 0; j < window; j++) s += EV[i + j]
    if (s > bestSum) {
      bestSum = s
      bestStart = i
    }
  }
  return [ages[bestStart], ages[bestStart + window - 1]]
}
