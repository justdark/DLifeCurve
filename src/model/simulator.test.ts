import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  parseDeathTableCSV,
  buildBaseDeathDist,
  buildSurvival,
  T_MAX,
  type DeathTable,
} from '../data/death-table'
import { simulate } from './simulator'
import { buildBaselineScenario } from './profile-to-scenario'
import { counterfactualDelta } from './counterfactual'
import { moneyToExp, SATURATION_CAP } from '../data/money-exp'
import type { UserProfile } from './types'

let table: DeathTable

beforeAll(() => {
  const csv = readFileSync(join(process.cwd(), 'public/death-table.csv'), 'utf-8')
  table = parseDeathTableCSV(csv)
})

const sampleProfile: UserProfile = {
  birthYear: 1992,
  gender: 'total',
  currentIncome: 300_000,
  initialWealth: 500_000,
  sleepHours: 8,
  investmentReturn: 0.04,
  inflationRate: 0.02,
  marriage: 'married',
  childrenCount: 1,
  hasHouse: false,
  health: 'healthy',
  initWorkSatisfaction: 0.2,
  initMarriageHappiness: 0.7,
  initBaselineCost: 80_000,
  completedAt: Date.now(),
  version: 1,
}

describe('death table', () => {
  it('parses CSV ignoring mislabeled header (32-year row)', () => {
    expect(table.total[32]).toBe(14996)
    expect(table.male[32]).toBe(10571)
    expect(table.female[32]).toBe(4425)
    expect(table.male[32] + table.female[32]).toBe(table.total[32])
  })

  it('handles 100岁及以上 row', () => {
    expect(table.total[100]).toBe(16485)
  })

  it('base death distribution sums to 1', () => {
    const d = buildBaseDeathDist(table, 32, 'total')
    let sum = 0
    for (let i = 0; i <= T_MAX; i++) sum += d[i]
    expect(sum).toBeCloseTo(1, 9)
  })

  it('survival is monotonically non-increasing', () => {
    const d = buildBaseDeathDist(table, 32, 'total')
    const P = buildSurvival(d, 32)
    for (let i = 33; i <= T_MAX; i++) {
      expect(P[i]).toBeLessThanOrEqual(P[i - 1] + 1e-9)
    }
  })
})

describe('saturation function g()', () => {
  const B = 80_000
  it('returns -1 at zero spending', () => {
    expect(moneyToExp(0, B)).toBe(-1)
  })
  it('returns 0 at exactly baseline', () => {
    expect(moneyToExp(B, B)).toBeCloseTo(0, 9)
  })
  it('rises to ~84% of cap at 10× baseline', () => {
    const v = moneyToExp(10 * B, B)
    expect(v).toBeGreaterThan(SATURATION_CAP * 0.8)
    expect(v).toBeLessThan(SATURATION_CAP * 0.9)
  })
  it('approaches saturation at 15× baseline', () => {
    const v = moneyToExp(15 * B, B)
    expect(v).toBeGreaterThan(SATURATION_CAP * 0.9)
  })
  it('never exceeds the cap (3.14× total)', () => {
    expect(moneyToExp(1000 * B, B)).toBeLessThanOrEqual(SATURATION_CAP + 1e-9)
  })
})

describe('simulator', () => {
  it('runs without throwing on baseline scenario', () => {
    const sc = buildBaselineScenario(sampleProfile, 2024)
    const r = simulate(sc, sampleProfile, table)
    expect(r.ages.length).toBeGreaterThan(0)
    expect(Number.isFinite(r.L)).toBe(true)
    expect(r.L).toBeGreaterThan(0)
  })

  it('expected lifespan is reasonable for 32yo', () => {
    const sc = buildBaselineScenario(sampleProfile, 2024)
    const r = simulate(sc, sampleProfile, table)
    expect(r.expectedLifespan).toBeGreaterThan(70)
    expect(r.expectedLifespan).toBeLessThan(95)
  })

  it('survival probability at current age is 1', () => {
    const sc = buildBaselineScenario(sampleProfile, 2024)
    const r = simulate(sc, sampleProfile, table)
    expect(r.P[0]).toBeCloseTo(1, 9)
  })

  it('produces leisure hours in [0, 24]', () => {
    const sc = buildBaselineScenario(sampleProfile, 2024)
    const r = simulate(sc, sampleProfile, table)
    for (const l of r.leisure) {
      expect(l).toBeGreaterThanOrEqual(0)
      expect(l).toBeLessThanOrEqual(24)
    }
  })

  it('cumulative score is non-decreasing', () => {
    const sc = buildBaselineScenario(sampleProfile, 2024)
    const r = simulate(sc, sampleProfile, table)
    for (let i = 1; i < r.cumL.length; i++) {
      expect(r.cumL[i]).toBeGreaterThanOrEqual(r.cumL[i - 1])
    }
  })
})

describe('time conflict discount', () => {
  it('crowding > 1 when work hours pushed to extreme', () => {
    const sc = buildBaselineScenario(sampleProfile, 2024)
    // 模拟极端：工作 16h
    const work = sc.events.find((e) => e.type === 'work')!
    work.params.hoursPerDay = 16
    // 重新建立事件（params 改了，重新 rehydrate 由 store 负责；这里手动）
    const r = simulate(sc, sampleProfile, table)
    // 工作 16h + 睡眠 8h + 生存 1h = 25h → crowding > 1
    const workingYearIdx = r.ages.indexOf(40)
    expect(r.crowding[workingYearIdx]).toBeGreaterThan(1)
  })
})

describe('counterfactual', () => {
  it('counterfactual on world-travel produces a non-zero score delta', () => {
    const sc = buildBaselineScenario(sampleProfile, 2024)
    const delta = counterfactualDelta(sc, sampleProfile, table, 'world-travel')
    expect(Math.abs(delta.scoreDelta)).toBeGreaterThan(0.01)
  })

  it('removing work greatly reduces peak wealth', () => {
    const sc = buildBaselineScenario(sampleProfile, 2024)
    const delta = counterfactualDelta(sc, sampleProfile, table, 'work')
    expect(delta.peakWealthDelta).toBeGreaterThan(0)
  })
})

describe('performance', () => {
  it('single simulation completes in < 50ms', () => {
    const sc = buildBaselineScenario(sampleProfile, 2024)
    const start = performance.now()
    for (let i = 0; i < 10; i++) simulate(sc, sampleProfile, table)
    const elapsed = (performance.now() - start) / 10
    expect(elapsed).toBeLessThan(50)
  })
})
