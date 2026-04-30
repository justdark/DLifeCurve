import { useMemo } from 'react'
import type { SimResult } from '../../model/types'

interface Props {
  result: SimResult
}

/**
 * 全宽底部装饰曲线：用 V(t) 画一根半透明的线，随参数实时变化。
 * 没有任何交互、坐标、说明——纯氛围装饰。
 */
export default function BottomCurve({ result }: Props) {
  const path = useMemo(() => {
    const V = result.V
    if (V.length < 2) return ''
    const W = 1000
    const H = 80
    const minV = 0
    const maxV = Math.max(0.5, ...V)
    const xOf = (i: number) => (i / (V.length - 1)) * W
    const yOf = (v: number) => H - ((v - minV) / (maxV - minV)) * H * 0.92 - 4
    return V.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`).join(' ')
  }, [result.V])

  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-0 select-none">
      <svg
        viewBox="0 0 1000 80"
        preserveAspectRatio="none"
        width="100%"
        height="84"
        style={{ display: 'block' }}
      >
        <defs>
          {/* 横向 fade：两端淡，中间稍清晰 */}
          <linearGradient id="bc-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9B72CF" stopOpacity="0" />
            <stop offset="20%" stopColor="#9B72CF" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#9B72CF" stopOpacity="0.55" />
            <stop offset="80%" stopColor="#9B72CF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#9B72CF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9B72CF" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#9B72CF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* 浅色 fill 增加层次感 */}
        <path d={`${path} L 1000 80 L 0 80 Z`} fill="url(#bc-fill)" />
        {/* 主线 */}
        <path
          d={path}
          fill="none"
          stroke="url(#bc-stroke)"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
