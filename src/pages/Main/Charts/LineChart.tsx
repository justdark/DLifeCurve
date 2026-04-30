import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'

interface Props {
  x: number[]
  y: number[]
  color: string
  xLabel?: string
  yMin?: number
  yMax?: number
  yFormatter?: (v: number) => string
  fill?: boolean
}

export default function LineChart({
  x,
  y,
  color,
  yMin,
  yMax,
  yFormatter,
  fill = false,
}: Props) {
  const option: EChartsOption = useMemo(
    () => ({
      animation: true,
      animationDuration: 200,
      animationDurationUpdate: 200,
      animationEasingUpdate: 'cubicOut',
      grid: { top: 12, right: 12, bottom: 24, left: 44 },
      xAxis: {
        type: 'category',
        data: x.map(String),
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 10,
          interval: Math.max(1, Math.floor(x.length / 8)),
        },
      },
      yAxis: {
        type: 'value',
        min: yMin,
        max: yMax,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 10,
          formatter: yFormatter
            ? (val: number) => yFormatter(val)
            : (val: number) => String(val),
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(31, 41, 55, 0.95)',
        borderWidth: 0,
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (params: unknown) => {
          const p = (params as { axisValue: string; data: number }[])[0]
          const v = yFormatter ? yFormatter(p.data) : String(p.data)
          return `${p.axisValue} 岁 · <b>${v}</b>`
        },
      },
      series: [
        {
          type: 'line',
          data: y,
          smooth: 0.4,
          showSymbol: false,
          lineStyle: {
            color,
            width: 3,
            cap: 'round',
          },
          areaStyle: fill
            ? {
                color: {
                  type: 'linear',
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: hexToRgba(color, 0.25) },
                    { offset: 1, color: hexToRgba(color, 0.0) },
                  ],
                },
              }
            : undefined,
        },
      ],
    }),
    [x, y, color, yMin, yMax, yFormatter, fill],
  )

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

function hexToRgba(hex: string, a: number): string {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
