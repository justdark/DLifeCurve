import type { Scenario, UserProfile, SimResult } from './types'
import type { DeathTable } from '../data/death-table'
import { simulate } from './simulator'

/**
 * 反事实差值：当前 scenario L 减去"移除某事件后" scenario 的 L
 * 即"这个事件对总分的贡献"
 */
export function counterfactualDelta(
  scenario: Scenario,
  profile: UserProfile,
  table: DeathTable,
  removeEventId: string,
  baseResult?: SimResult,
): {
  scoreDelta: number
  lifespanDelta: number
  peakWealthDelta: number
} {
  const base = baseResult ?? simulate(scenario, profile, table)
  const counterScenario: Scenario = {
    ...scenario,
    events: scenario.events.filter((e) => e.id !== removeEventId),
  }
  const counter = simulate(counterScenario, profile, table)

  return {
    scoreDelta: base.L - counter.L,
    lifespanDelta: base.expectedLifespan - counter.expectedLifespan,
    peakWealthDelta: Math.max(...base.M) - Math.max(...counter.M),
  }
}
