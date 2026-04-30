import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import type { SimResult } from '../../../model/types'
import { ALL_EVENT_LABELS } from '../../../model/event-factory'

export type ChartType = 'wealth' | 'survival' | 'experience' | 'expRate' | 'time' | 'cashflow'

interface Props {
  type: ChartType | null
  result: SimResult
  /** 通胀率：财富图开启"通胀后金额"时各年金额按 (1+infl)^year 放大 */
  inflationRate?: number
  /** 名义投资收益率（4% 等），用来直接展示理财收益 */
  investmentReturn?: number
  onClose: () => void
}

const PALETTE = [
  '#F2C94C', '#9B72CF', '#0ea5e9', '#10b981',
  '#F2994A', '#ef4444', '#a855f7', '#06b6d4',
  '#84cc16', '#f97316', '#ec4899', '#64748b',
]

export default function ChartExpandModal({
  type,
  result,
  inflationRate = 0,
  investmentReturn = 0,
  onClose,
}: Props) {
  const [showNominal, setShowNominal] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && type) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [type, onClose])

  const option = useMemo<EChartsOption | null>(
    () =>
      type
        ? buildOption(
            type,
            result,
            showNominal ? inflationRate : 0,
            investmentReturn,
          )
        : null,
    [type, result, showNominal, inflationRate, investmentReturn],
  )

  if (!type || !option) return null

  const title = TITLES[type]
  const desc = DESCRIPTIONS[type]

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-lift max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
          </div>
          <div className="flex items-center gap-4">
            {type === 'wealth' && inflationRate > 0 && (
              <label className="flex items-center gap-2 cursor-pointer text-sm select-none">
                <span className={showNominal ? 'text-slate-400' : 'text-ink font-medium'}>
                  今日购买力
                </span>
                <button
                  onClick={() => setShowNominal((v) => !v)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    showNominal ? 'bg-ink' : 'bg-slate-300'
                  }`}
                  aria-label="切换名义/实际视角"
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                      showNominal ? 'left-[18px]' : 'left-0.5'
                    }`}
                  />
                </button>
                <span className={showNominal ? 'text-ink font-medium' : 'text-slate-400'}>
                  通胀后金额
                </span>
              </label>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-ink p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>
        <div className="px-6 py-5">
          <div style={{ height: 480 }}>
            <ReactECharts option={option} style={{ width: '100%', height: '100%' }} />
          </div>
          <p className="text-xs text-slate-400 mt-3">点击图例可隐藏 / 显示某条曲线</p>
        </div>
      </div>
    </div>
  )
}

const TITLES: Record<ChartType, string> = {
  wealth: '财富 M(t) — 各事件分解',
  survival: '生存概率 P(t) — 寿命扰动来源',
  experience: '期望体验 EV(t) — 各事件 ε × 生存概率 贡献',
  expRate: '体验率 r(t) — 各事件乘性贡献',
  time: '时间分配（h/天） — 各事件占用',
  cashflow: '年度现金流 — 收入 vs 支出（按事件分解）',
}

const DESCRIPTIONS: Record<ChartType, string> = {
  wealth: '主曲线为总财富；各事件展示其每年实际现金流；理财收益单独一条',
  survival: '主曲线为活到该年龄概率；下方按年龄展示各事件对死亡分布的扰动权重',
  experience: '主曲线 = 单年综合体验 V(t) × 该年生存概率 P(t)，反映对总分的实际贡献',
  expRate: '主曲线为体验率（年龄+乘性事件）；各事件展示其乘性偏离 1 的部分',
  time: '堆叠：各事件每年占用的小时数 + 剩余生活时间',
  cashflow: '收入（绿）：工作 + 理财收益；支出（红）：各消费类事件',
}

function buildOption(
  type: ChartType,
  result: SimResult,
  inflationRate: number,
  investmentReturn: number,
): EChartsOption {
  const ages = result.ages.map(String)
  const eventColor = (i: number) => PALETTE[i % PALETTE.length]
  const inflFactor = (i: number) => Math.pow(1 + inflationRate, i)

  const baseOption: EChartsOption = {
    animation: true,
    animationDuration: 200,
    grid: { top: 40, right: 24, bottom: 60, left: 60 },
    legend: { type: 'scroll', top: 0 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ages,
      name: '年龄',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: { interval: Math.max(1, Math.floor(ages.length / 12)) },
    },
    yAxis: { type: 'value' },
    dataZoom: [{ type: 'inside' }],
  }

  if (type === 'wealth') {
    // 理财收益统一展示"名义"年化（投资收益率全额，不扣通胀）
    // 这样用户设置 4% 就能直接看到 4%
    const investmentNominal = result.M.map((_v, i) =>
      i > 0 && result.M[i - 1] > 0
        ? Math.round((result.M[i - 1] * investmentReturn * inflFactor(i)) / 10000)
        : 0,
    )

    const series: EChartsOption['series'] = [
      {
        type: 'line', name: '总财富', smooth: 0.3, showSymbol: false,
        data: result.M.map((v, i) => Math.round((v * inflFactor(i)) / 10000)),
        lineStyle: { width: 3, color: '#1f2937' },
      },
      {
        type: 'line', name: '理财收益（名义）', smooth: 0.3, showSymbol: false,
        data: investmentNominal,
        lineStyle: { width: 1.5, color: '#10b981', type: 'dashed' },
      },
      ...result.perEvent
        .filter((s) => s.money.some((v) => Math.abs(v) > 1))
        .map((s, i) => ({
          type: 'line' as const,
          name: `${ALL_EVENT_LABELS[s.type]?.emoji ?? ''} ${s.name}`,
          smooth: 0.3,
          showSymbol: false,
          data: s.money.map((v, j) => Math.round((v * inflFactor(j)) / 10000)),
          lineStyle: { width: 1.5, color: eventColor(i) },
        })),
    ]
    return {
      ...baseOption,
      yAxis: {
        type: 'value',
        name: inflationRate > 0 ? '万元（名义）' : '万元',
        nameLocation: 'end',
      },
      series,
    }
  }

  if (type === 'experience') {
    // 用期望体验 EV = V × P 作为主线，单事件 ε 也乘 P 保持一致
    const series: EChartsOption['series'] = [
      {
        type: 'line', name: '期望体验 EV(t)', smooth: 0.3, showSymbol: false,
        data: Array.from(result.EV),
        lineStyle: { width: 3, color: '#9B72CF' },
      },
      ...result.perEvent
        .filter((s) => s.exp.some((v) => Math.abs(v) > 0.01))
        .map((s, i) => ({
          type: 'line' as const,
          name: `${ALL_EVENT_LABELS[s.type]?.emoji ?? ''} ${s.name} 的 ε × P`,
          smooth: 0.3,
          showSymbol: false,
          data: s.exp.map((v, j) => v * result.P[j]),
          lineStyle: { width: 1.5, color: eventColor(i) },
        })),
    ]
    return { ...baseOption, series }
  }

  if (type === 'time') {
    // 时间堆叠图：每事件 + 生活时间
    const events = result.perEvent.filter((s) => s.time.some((v) => v > 0.01))
    const series: EChartsOption['series'] = [
      ...events.map((s, i) => ({
        type: 'line' as const,
        stack: 'time',
        name: `${ALL_EVENT_LABELS[s.type]?.emoji ?? ''} ${s.name}`,
        data: s.time,
        smooth: 0.3,
        showSymbol: false,
        areaStyle: { opacity: 0.85, color: eventColor(i) },
        lineStyle: { width: 0 },
      })),
      {
        type: 'line',
        stack: 'time',
        name: '🌈 生活时间',
        data: Array.from(result.leisure),
        smooth: 0.3,
        showSymbol: false,
        areaStyle: { opacity: 0.45, color: '#cbd5e1' },
        lineStyle: { width: 0 },
      },
    ]
    return {
      ...baseOption,
      yAxis: {
        type: 'value',
        max: 24,
        min: 0,
        name: 'h/天',
      },
      series,
    }
  }

  if (type === 'cashflow') {
    // 每个事件按"主要方向"归类（净流入/净流出），不双向展示。
    const incomePerEvent: { s: typeof result.perEvent[number]; data: number[] }[] = []
    const expensePerEvent: { s: typeof result.perEvent[number]; data: number[] }[] = []
    for (const s of result.perEvent) {
      const totalPos = s.money.reduce((a, v) => a + Math.max(0, v), 0)
      const totalNeg = -s.money.reduce((a, v) => a + Math.min(0, v), 0)
      if (totalPos < 1000 && totalNeg < 1000) continue
      if (totalPos > totalNeg) {
        incomePerEvent.push({ s, data: s.money.map((v) => Math.max(0, v / 10000)) })
      } else {
        expensePerEvent.push({ s, data: s.money.map((v) => Math.min(0, v / 10000)) })
      }
    }
    const investmentArr = result.investmentIncome.map((v) => Math.round(v / 10000))

    const series: EChartsOption['series'] = [
      {
        type: 'line',
        stack: 'income',
        name: '理财收益',
        data: investmentArr,
        smooth: 0.3,
        showSymbol: false,
        areaStyle: { opacity: 0.7, color: '#10b981' },
        lineStyle: { width: 0 },
      },
      ...incomePerEvent.map(({ s, data }, i) => ({
        type: 'line' as const,
        stack: 'income',
        name: `${ALL_EVENT_LABELS[s.type]?.emoji ?? ''} ${s.name}（收入）`,
        data,
        smooth: 0.3,
        showSymbol: false,
        areaStyle: { opacity: 0.7, color: eventColor(i + 4) },
        lineStyle: { width: 0 },
      })),
      ...expensePerEvent.map(({ s, data }, i) => ({
        type: 'line' as const,
        stack: 'expense',
        name: `${ALL_EVENT_LABELS[s.type]?.emoji ?? ''} ${s.name}（支出）`,
        data,
        smooth: 0.3,
        showSymbol: false,
        areaStyle: { opacity: 0.7, color: eventColor(i + 8) },
        lineStyle: { width: 0 },
      })),
    ]
    return {
      ...baseOption,
      yAxis: { type: 'value', name: '万元/年' },
      series,
    }
  }

  if (type === 'expRate') {
    const series: EChartsOption['series'] = [
      {
        type: 'line', name: '体验率 r(t)', smooth: 0.3, showSymbol: false,
        data: Array.from(result.expRate),
        lineStyle: { width: 3, color: '#0ea5e9' },
      },
      {
        type: 'line', name: '年龄基线 f(t)', smooth: 0.3, showSymbol: false,
        data: Array.from(result.fT),
        lineStyle: { width: 1.5, color: '#94a3b8', type: 'dashed' },
      },
      ...result.perEvent
        .filter((s) => s.muDelta.some((v) => Math.abs(v) > 0.001))
        .map((s, i) => ({
          type: 'line' as const,
          name: `${ALL_EVENT_LABELS[s.type]?.emoji ?? ''} ${s.name} μ-1`,
          smooth: 0.3,
          showSymbol: false,
          data: s.muDelta,
          lineStyle: { width: 1.5, color: eventColor(i) },
        })),
    ]
    return { ...baseOption, series }
  }

  // survival
  const series: EChartsOption['series'] = [
    {
      type: 'line', name: '生存概率 P(t)', smooth: 0.3, showSymbol: false,
      data: Array.from(result.P),
      lineStyle: { width: 3, color: '#10b981' },
    },
    ...result.perEvent
      .filter((s) => s.deathShift.some((v) => Math.abs(v) > 1e-5))
      .map((s, i) => ({
        type: 'bar' as const,
        name: `${ALL_EVENT_LABELS[s.type]?.emoji ?? ''} ${s.name} δ`,
        // 仅展示该事件影响的死亡分布扰动（在对应年龄上）
        data: s.deathShift.slice(0, ages.length).map((v) => v),
        yAxisIndex: 1,
        itemStyle: { color: eventColor(i) },
      })),
  ]
  return {
    ...baseOption,
    yAxis: [
      { type: 'value', name: '生存概率', max: 1, min: 0 },
      { type: 'value', name: 'δ 扰动', position: 'right' },
    ],
    series,
  }
}
