import { useEffect, useState } from 'react'
import type { SimResult } from '../../model/types'
import AnimatedNumber from '../../components/AnimatedNumber'
import { useScenarioStore } from '../../store/scenario'

interface Props {
  result: SimResult
}

/**
 * 基线分数：每个 scenario.id 对应一次"基线"，第一次见这个 id 时锁定当前 Lnorm。
 * 用 sessionStorage 保留，避免 StrictMode 双渲染抖动。
 */
function getBaselineFor(scenarioId: string, current: number): number {
  const key = `lifecurve.baseline.${scenarioId}`
  if (typeof window === 'undefined') return current
  const cached = sessionStorage.getItem(key)
  if (cached !== null) return Number(cached)
  sessionStorage.setItem(key, String(current))
  return current
}

export default function ScoreHeader({ result }: Props) {
  const scenarioId = useScenarioStore((s) => s.scenario?.id ?? 'unknown')
  const [baseline, setBaseline] = useState(() => getBaselineFor(scenarioId, result.L))

  useEffect(() => {
    setBaseline(getBaselineFor(scenarioId, result.L))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId])

  const delta = result.L - baseline

  const wan = (yuan: number) => Math.round(yuan / 10000)

  // 财富巅峰：M(t) 的最大值及对应年龄
  let peakWealth = -Infinity
  let peakIdx = 0
  for (let i = 0; i < result.M.length; i++) {
    if (result.M[i] > peakWealth) {
      peakWealth = result.M[i]
      peakIdx = i
    }
  }
  const peakWealthAge = result.ages[peakIdx]

  // 年度基础+生活消费（取自 scenario 的 living 和 life 事件）
  const scenario = useScenarioStore((s) => s.scenario)
  const livingCost =
    (scenario?.events.find((e) => e.type === 'living')?.params.baselineCost as number | undefined) ?? 0
  const lifeCost =
    (scenario?.events.find((e) => e.type === 'life')?.params.yearlyBudget as number | undefined) ?? 0
  const annualBaseSpend = livingCost + lifeCost

  return (
    <section className="card p-7">
      <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-10">
        {/* 总分 */}
        <div>
          <div className="text-base text-slate-500 mb-1.5">人生体验期望总分</div>
          <div className="flex items-baseline gap-3">
            <div className="text-7xl font-semibold tracking-tight text-ink">
              <AnimatedNumber value={result.L} digits={1} />
            </div>
            {Math.abs(delta) > 0.05 && (
              <div
                className={`text-sm font-medium tabular-nums ${
                  delta > 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {delta > 0 ? '+' : ''}
                {delta.toFixed(1)} vs 基线
              </div>
            )}
          </div>
        </div>

        {/* 副指标 */}
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <Metric
            label="期望寿命"
            value={
              <>
                <AnimatedNumber value={result.expectedLifespan} digits={1} flash={false} />
                <span className="text-slate-400 ml-0.5">岁</span>
              </>
            }
          />
          <Metric
            label={`财富巅峰（${peakWealthAge} 岁）`}
            value={
              <>
                <AnimatedNumber value={wan(peakWealth)} digits={0} flash={false} />
                <span className="text-slate-400 ml-0.5">万</span>
              </>
            }
          />
          <Metric
            label="最幸福五年"
            value={
              <span className="tabular-nums">
                {result.peakYears[0]}–{result.peakYears[1]} 岁
              </span>
            }
          />
          <Metric
            label="年度基本消费"
            value={
              <>
                <AnimatedNumber value={wan(annualBaseSpend)} digits={0} flash={false} />
                <span className="text-slate-400 ml-0.5">万</span>
                <span className="text-xs text-slate-400 ml-1">
                  （生存 {wan(livingCost)} + 生活 {wan(lifeCost)}）
                </span>
              </>
            }
          />
        </div>
      </div>

      {result.warnings.length > 0 && (
        <div className="mt-4 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
          ⚠️ {result.warnings.map((w) => w.message).join('；')}
        </div>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm text-slate-400 mb-1">{label}</div>
      <div className="text-2xl font-medium text-ink">{value}</div>
    </div>
  )
}
