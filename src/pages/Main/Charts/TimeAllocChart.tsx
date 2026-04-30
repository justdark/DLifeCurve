import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import type { SimResult } from '../../../model/types'
import { ALL_EVENT_LABELS } from '../../../model/event-factory'

const PALETTE = [
  '#F2C94C', '#9B72CF', '#0ea5e9', '#10b981',
  '#F2994A', '#ef4444', '#a855f7', '#06b6d4',
  '#84cc16', '#f97316', '#ec4899', '#64748b',
]

/**
 * 时间分配堆叠图：每年各事件占多少小时（h/天），堆叠到 24，剩余记作"生活时间"
 */
export default function TimeAllocChart({ result }: { result: SimResult }) {
  const option = useMemo<EChartsOption>(() => {
    const events = result.perEvent.filter((s) => s.time.some((v) => v > 0.01))

    const eventSeries = events.map((s, i) => ({
      type: 'line' as const,
      stack: 'time',
      name: `${ALL_EVENT_LABELS[s.type]?.emoji ?? ''}${s.name}`,
      data: s.time,
      areaStyle: { opacity: 0.85, color: PALETTE[i % PALETTE.length] },
      lineStyle: { width: 0 },
      smooth: 0.3,
      showSymbol: false,
      stackStrategy: 'all' as const,
    }))

    const leisureSeries = {
      type: 'line' as const,
      stack: 'time',
      name: '🌈 生活时间',
      data: Array.from(result.leisure),
      areaStyle: { opacity: 0.45, color: '#cbd5e1' },
      lineStyle: { width: 0 },
      smooth: 0.3,
      showSymbol: false,
    }

    return {
      animation: true,
      animationDuration: 200,
      animationDurationUpdate: 200,
      grid: { top: 8, right: 8, bottom: 22, left: 32 },
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
        max: 24,
        min: 0,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 10,
          formatter: (v: number) => `${v}h`,
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(31, 41, 55, 0.95)',
        borderWidth: 0,
        textStyle: { color: '#fff', fontSize: 11 },
      },
      series: [...eventSeries, leisureSeries],
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
