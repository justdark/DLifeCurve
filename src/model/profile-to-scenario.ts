import type { Scenario, UserProfile, GlobalParams } from './types'
import { makeWork } from './events/work'
import { makeMarriage } from './events/marriage'
import { makeChildren } from './events/children'
import { makeHouse } from './events/house'
import { makeWorldTravel } from './events/world-travel'
import { makeLiving } from './events/living'
import { makeSleep } from './events/sleep'
import { makeLife } from './events/life'
import { makeEducation } from './events/education'

const SCHEMA_VERSION = 1

export function buildBaselineScenario(profile: UserProfile, currentYear?: number): Scenario {
  const now = currentYear ?? new Date().getFullYear()
  const t0 = Math.max(0, now - profile.birthYear)

  const investmentReturn = profile.investmentReturn ?? 0.04
  const inflationRate = profile.inflationRate ?? 0.02
  const baseline = profile.initBaselineCost ?? 80_000

  const global: GlobalParams = {
    currentAge: t0,
    initialWealth: profile.initialWealth,
    gender: profile.gender,
    currentIncome: profile.currentIncome,
    realReturn: investmentReturn - inflationRate,
    investmentReturn,
    inflationRate,
  }

  const events = [
    // 基础事件（不可删）
    makeLiving({ baselineCost: baseline }),
    makeSleep({ hoursPerDay: profile.sleepHours }),
    makeLife({ yearlyBudget: Math.round(baseline * 0.6) }),

    // 上学（默认 6-22，毕业后终身体验率 +10%）
    makeEducation({ startAge: 6, endAge: 22 }),

    // 工作（默认从今天起一直到 62 岁退休）
    makeWork({
      startAge: t0,
      endAge: 62,
      hoursPerDay: 8,
      salaryMultiplier: 1.0,
      satisfaction: profile.initWorkSatisfaction ?? 0.2,
    }),
  ]

  // 结婚
  if (profile.marriage === 'married') {
    events.push(
      makeMarriage({
        startAge: Math.min(28, t0),
        happiness: profile.initMarriageHappiness ?? 0.6,
      }),
    )
  } else if (profile.marriage === 'single') {
    events.push(
      makeMarriage({
        startAge: Math.max(t0 + 1, 32),
        happiness: profile.initMarriageHappiness ?? 0.6,
      }),
    )
  }

  // 生娃
  if (profile.childrenCount > 0) {
    events.push(makeChildren({ startAge: Math.min(32, t0), count: profile.childrenCount }))
  } else {
    events.push(makeChildren({ startAge: Math.max(t0 + 1, 32), count: 1 }))
  }

  // 买房
  if (profile.hasHouse) {
    events.push(makeHouse({ buyAge: Math.max(28, t0 - 3) }, baseline))
  } else {
    events.push(makeHouse({ buyAge: Math.max(t0 + 1, 35) }, baseline))
  }

  // 环球旅行
  events.push(makeWorldTravel({ age: 45, durationYears: 0.5, totalCost: 500_000 }))

  const ts = Date.now()
  return {
    id: 'baseline',
    name: '我的人生',
    isBaseline: true,
    globalParams: global,
    events,
    createdAt: ts,
    updatedAt: ts,
  }
}

export function profileSchemaVersion() {
  return SCHEMA_VERSION
}
