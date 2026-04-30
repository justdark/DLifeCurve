import { useState } from 'react'
import type { SimResult } from '../../../model/types'
import { useScenarioStore } from '../../../store/scenario'
import LineChart from './LineChart'
import TimeAllocChart from './TimeAllocChart'
import CashFlowChart from './CashFlowChart'
import ChartExpandModal, { type ChartType } from './ChartExpandModal'

interface Props {
  result: SimResult
}

export default function ChartsGrid({ result }: Props) {
  const [expanded, setExpanded] = useState<ChartType | null>(null)
  const inflationRate = useScenarioStore((s) => s.scenario?.globalParams.inflationRate ?? 0)
  const investmentReturn = useScenarioStore((s) => s.scenario?.globalParams.investmentReturn ?? 0)

  return (
    <>
      {/*
        2 行 × 3 列 = 6 张图，按列优先排布。
        默认可视：列 1 + 列 2（4 张图，等同原 2x2）。
        左右滚动可见列 3（更多 2 张图）。
        没有外露的箭头/滚动条提示——按 user 要求"看不出来"。
      */}
      <div
        className="overflow-x-auto snap-x snap-mandatory h-full"
        style={{ scrollbarWidth: 'none' }}
      >
        <style>{`
          .charts-scroll::-webkit-scrollbar { display: none; }
          .charts-scroll {
            grid-template-rows: repeat(2, minmax(200px, 1fr));
            grid-auto-flow: column;
            grid-auto-columns: calc(100% - 0.5rem);
          }
          @media (min-width: 1024px) {
            .charts-scroll {
              grid-template-rows: repeat(2, minmax(220px, 1fr));
              grid-auto-columns: calc(50% - 0.5rem);
            }
          }
        `}</style>
        <div className="charts-scroll grid gap-4 h-full">
          {/* 列 1：EV (top) + M (bottom) */}
          <div className="snap-start">
            <Card title="期望体验 EV(t)" subtitle="V(t) × 该年生存概率" color="#9B72CF" onExpand={() => setExpanded('experience')}>
              <LineChart
                x={result.ages}
                y={result.EV}
                color="#9B72CF"
                xLabel="年龄"
                yFormatter={(v) => v.toFixed(2)}
              />
            </Card>
          </div>
          <div className="snap-start">
            <Card title="财富 M(t)" subtitle="单位：万元" color="#F2C94C" onExpand={() => setExpanded('wealth')}>
              <LineChart
                x={result.ages}
                y={result.M.map((v) => v / 10000)}
                color="#F2C94C"
                xLabel="年龄"
                yFormatter={(v) => `${Math.round(v)}w`}
              />
            </Card>
          </div>

          {/* 列 2：P (top) + r (bottom) */}
          <div className="snap-start">
            <Card title="生存概率 P(t)" subtitle="活到这个年龄的概率" color="#10b981" onExpand={() => setExpanded('survival')}>
              <LineChart
                x={result.ages}
                y={result.P}
                color="#10b981"
                xLabel="年龄"
                yMin={0}
                yMax={1}
                yFormatter={(v) => `${Math.round(v * 100)}%`}
              />
            </Card>
          </div>
          <div className="snap-start">
            <Card title="体验率 r(t)" subtitle="年龄+婚姻/自住等乘性影响" color="#0ea5e9" onExpand={() => setExpanded('expRate')}>
              <LineChart
                x={result.ages}
                y={result.expRate}
                color="#0ea5e9"
                xLabel="年龄"
                yMin={0}
                yMax={1.4}
                yFormatter={(v) => v.toFixed(2)}
              />
            </Card>
          </div>

          {/* 列 3：时间 (top) + 现金流 (bottom) — 默认隐藏，滑动可见 */}
          <div className="snap-start">
            <Card title="时间分配（h/天）" subtitle="各事件占用 + 生活时间" color="#F2994A" onExpand={() => setExpanded('time')}>
              <TimeAllocChart result={result} />
            </Card>
          </div>
          <div className="snap-start">
            <Card title="年度现金流" subtitle="收入 vs 支出（万元）" color="#10b981" onExpand={() => setExpanded('cashflow')}>
              <CashFlowChart result={result} />
            </Card>
          </div>
        </div>
      </div>

      <ChartExpandModal
        type={expanded}
        result={result}
        inflationRate={inflationRate}
        investmentReturn={investmentReturn}
        onClose={() => setExpanded(null)}
      />
    </>
  )
}

function Card({
  title,
  subtitle,
  color,
  onExpand,
  children,
}: {
  title: string
  subtitle?: string
  color: string
  onExpand?: () => void
  children: React.ReactNode
}) {
  return (
    <section className="card p-4 group relative h-full flex flex-col">
      <header className="flex items-baseline justify-between mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          <h4 className="text-sm font-semibold">{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          {subtitle && <span className="text-xs text-slate-400 truncate">{subtitle}</span>}
          {onExpand && (
            <button
              onClick={onExpand}
              className="text-slate-300 hover:text-ink transition-colors p-0.5 -mr-1 shrink-0"
              title="放大并查看各事件影响"
              aria-label="放大"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </button>
          )}
        </div>
      </header>
      <div className="flex-1 min-h-[160px]">{children}</div>
    </section>
  )
}
