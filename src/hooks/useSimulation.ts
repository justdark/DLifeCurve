import { useMemo } from 'react'
import { useDeathTableStore } from '../store/death-table'
import { useProfileStore } from '../store/profile'
import { useScenarioStore } from '../store/scenario'
import { simulate } from '../model/simulator'
import { counterfactualDelta } from '../model/counterfactual'
import type { SimResult } from '../model/types'

/**
 * 由 scenario + profile + 死亡表 生成 SimResult
 * useMemo 锁住，scenario 变更才重算
 */
export function useSimulation(): SimResult | null {
  const table = useDeathTableStore((s) => s.table)
  const profile = useProfileStore((s) => s.profile)
  const scenario = useScenarioStore((s) => s.scenario)

  return useMemo(() => {
    if (!table || !profile || !scenario) return null
    return simulate(scenario, profile, table)
  }, [table, profile, scenario])
}

/** 移除某事件的反事实差值 */
export function useCounterfactual(eventId: string | null) {
  const table = useDeathTableStore((s) => s.table)
  const profile = useProfileStore((s) => s.profile)
  const scenario = useScenarioStore((s) => s.scenario)

  return useMemo(() => {
    if (!table || !profile || !scenario || !eventId) return null
    if (!scenario.events.some((e) => e.id === eventId)) return null
    return counterfactualDelta(scenario, profile, table, eventId)
  }, [table, profile, scenario, eventId])
}
