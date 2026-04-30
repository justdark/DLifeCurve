import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import type { SimResult } from '../../../model/types'

/**
 * 现金流图：每年总收入（含理财收益） vs 总支出
 * 收入正向、支出负向，直观看出哪些年是赚钱年/烧钱年
 */
export default function CashFlowChart({ result }: { result: SimResult }) {
  const option = useMemo<EChartsOption>(() => {
    const N = result.ages.length
    const income = new Array(N).fill(0)
    const expense = new Array(N).fill(0)
    for (let i = 0; i < N; i++) {
      let inc = 0
      let exp = 0
      for (const s of result.perEvent) {
        const m = s.money[i]
        if (m > 0) inc += m
        else exp += -m
      }
      inc += result.investmentIncome[i]
      income[i] = Math.round(inc / 10000)
      expense[i] = -Math.round(exp / 10000) // 支出取负
    }

    return {
      animation: true,
      animationDuration: 200,
      animationDurationUpdate: 200,
      grid: { top: 8, right: 8, bottom: 22, left: 40 },
      xAxis: {
        type: 'category',
        data: result.ages.map(String),
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 10,
          interval: Math.max(1, Math.floor(result.ages.length / 8)),
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 10,
          formatter: (v: number) => `${v}w`,
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(31, 41, 55, 0.95)',
        borderWidth: 0,
        textStyle: { color: '#fff', fontSize: 11 },
      },
      series: [
        {
          type: 'line',
          name: '收入',
          data: income,
          smooth: 0.3,
          showSymbol: false,
          lineStyle: { color: '#10b981', width: 2 },
          areaStyle: { color: '#10b98133' },
        },
        {
          type: 'line',
          name: '支出',
          data: expense,
          smooth: 0.3,
          showSymbol: false,
          lineStyle: { color: '#ef4444', width: 2 },
          areaStyle: { color: '#ef444433' },
        },
      ],
    }
  }, [result])

  return (
    <ReactECharts
      option={option}
      style={{ width: '100%', height: '100%' }}
      opts={{ renderer: 'svg' }}
      notMerge={false}
      lazyUpdate
    />
  )
}
