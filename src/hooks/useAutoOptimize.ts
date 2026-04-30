import { useCallback } from 'react'
import { useDeathTableStore } from '../store/death-table'
import { useProfileStore } from '../store/profile'
import { useScenarioStore } from '../store/scenario'
import { simulate } from '../model/simulator'
import { rehydrateEvent } from '../model/event-factory'

/**
 * 自动寻参：用一组候选参数值跑模拟，返回让总分 L 最大的那个值。
 * 调用方负责把"滑块值"转换成"参数值"（如万→元）。
 *
 * 只改这一个 paramKey，不处理参数间耦合；耦合由调用方在 onChange 里处理。
 */
export function useAutoOptimize() {
  const table = useDeathTableStore((s) => s.table)
  const profile = useProfileStore((s) => s.profile)
  const scenario = useScenarioStore((s) => s.scenario)

  return useCallback(
    (eventId: string, paramKey: string, candidates: number[]): number | null => {
      if (!table || !profile || !scenario) return null
      if (candidates.length === 0) return null
      const livingEv = scenario.events.find((e) => e.type === 'living')
      const baseline =
        (livingEv?.params.baselineCost as number | undefined) ?? 80_000

      let bestValue = candidates[0]
      let bestL = -Infinity

      for (const c of candidates) {
        const trialEvents = scenario.events.map((e) => {
          if (e.id !== eventId) return e
          const newParams = { ...e.params, [paramKey]: c }
          const rehyd = rehydrateEvent(
            { id: e.id, type: e.type, params: newParams },
            baseline,
          )
          return rehyd ?? e
        })
        const trialScenario = { ...scenario, events: trialEvents }
        try {
          const result = simulate(trialScenario, profile, table)
          if (result.L > bestL) {
            bestL = result.L
            bestValue = c
          }
        } catch {
          // 跳过不合法的候选
        }
      }
      return bestValue
    },
    [table, profile, scenario],
  )
}
