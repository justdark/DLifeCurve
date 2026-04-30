import { useEffect, useRef, useState } from 'react'

interface Anchor {
  age: number
  value: number
}

interface Props {
  title: string
  unit?: string
  color: string
  /** 显示用缩放（如金钱用 万 = scale=10000）；存储仍是原始单位 */
  scale?: number
  minAge: number
  maxAge: number
  minValue: number
  maxValue: number
  anchors: Anchor[]
  onChange: (next: Anchor[]) => void
}

const W = 360
const H = 100
const PAD = 24

/**
 * 简易曲线编辑器：
 *  - 单击空白处加锚点
 *  - 拖动锚点改 age/value
 *  - 双击锚点删除
 *  - 显示已添加的锚点连成的折线
 */
export default function CurveEditor({
  title,
  unit = '',
  color,
  scale = 1,
  minAge,
  maxAge,
  minValue,
  maxValue,
  anchors,
  onChange,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)

  const ageRange = Math.max(1, maxAge - minAge)
  const valRange = Math.max(0.001, maxValue - minValue)

  const xOf = (age: number) => PAD + ((age - minAge) / ageRange) * (W - PAD * 2)
  const yOf = (value: number) => H - PAD - ((value - minValue) / valRange) * (H - PAD * 2)
  const ageOf = (x: number) => minAge + ((x - PAD) / (W - PAD * 2)) * ageRange
  const valueOf = (y: number) => minValue + ((H - PAD - y) / (H - PAD * 2)) * valRange

  /** 排序后用于绘制的锚点 */
  const sorted = [...anchors].sort((a, b) => a.age - b.age)

  const handleClick = (e: React.MouseEvent) => {
    if (draggingIdx !== null) return
    if (!svgRef.current) return
    const target = e.target as SVGElement
    if (target.tagName === 'circle') return // ignore clicks on existing anchors
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    const y = ((e.clientY - rect.top) / rect.height) * H
    if (x < PAD || x > W - PAD || y < PAD / 2 || y > H - PAD / 2) return
    const newAnchor: Anchor = {
      age: clamp(Math.round(ageOf(x)), minAge, maxAge),
      value: clamp(Math.round(valueOf(y) * 10) / 10, minValue, maxValue),
    }
    onChange([...anchors, newAnchor])
  }

  const handleMouseDown = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDraggingIdx(idx)
  }

  useEffect(() => {
    if (draggingIdx === null) return
    const handleMove = (e: MouseEvent) => {
      if (!svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * W
      const y = ((e.clientY - rect.top) / rect.height) * H
      const next = [...anchors]
      next[draggingIdx] = {
        age: clamp(Math.round(ageOf(x)), minAge, maxAge),
        value: clamp(Math.round(valueOf(y) * 10) / 10, minValue, maxValue),
      }
      onChange(next)
    }
    const handleUp = () => setDraggingIdx(null)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingIdx, anchors])

  const handleDoubleClick = (idx: number) => {
    onChange(anchors.filter((_, i) => i !== idx))
  }

  // 折线 path
  const pathD = sorted.length === 0
    ? ''
    : sorted.map((a, i) => `${i === 0 ? 'M' : 'L'} ${xOf(a.age)} ${yOf(a.value)}`).join(' ')

  // 0 轴线
  const yZero = yOf(0)

  return (
    <div className="rounded-xl border border-slate-200 p-3 bg-white">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs font-medium text-slate-700">{title}</span>
        <span className="text-xs text-slate-400">点空白处加锚点 · 拖动改 · 双击删</span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-crosshair select-none"
        onClick={handleClick}
        style={{ touchAction: 'none' }}
      >
        {/* 网格 */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#e2e8f0" strokeWidth={1} />
        <line x1={PAD} y1={PAD / 2} x2={PAD} y2={H - PAD} stroke="#e2e8f0" strokeWidth={1} />
        {/* 0 轴 */}
        {minValue < 0 && maxValue > 0 && (
          <line x1={PAD} y1={yZero} x2={W - PAD} y2={yZero} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="2 3" />
        )}
        {/* 折线 */}
        {pathD && (
          <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {/* 锚点 */}
        {sorted.map((a) => {
          const realIdx = anchors.indexOf(a)
          return (
            <circle
              key={realIdx}
              cx={xOf(a.age)}
              cy={yOf(a.value)}
              r={5}
              fill={color}
              stroke="white"
              strokeWidth={2}
              className="cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => handleMouseDown(realIdx, e)}
              onDoubleClick={() => handleDoubleClick(realIdx)}
            />
          )
        })}
        {/* 标注 */}
        <text x={PAD - 4} y={PAD / 2 + 4} fontSize={9} fill="#94a3b8" textAnchor="end">
          {scale === 10000 ? `${maxValue}` : maxValue}{unit}
        </text>
        <text x={PAD - 4} y={H - PAD + 4} fontSize={9} fill="#94a3b8" textAnchor="end">
          {minValue}
        </text>
        <text x={PAD} y={H - 6} fontSize={9} fill="#94a3b8">{minAge}</text>
        <text x={W - PAD} y={H - 6} fontSize={9} fill="#94a3b8" textAnchor="end">{maxAge}</text>
      </svg>
      {sorted.length > 0 && (
        <div className="text-xs text-slate-500 mt-1 tabular-nums">
          {sorted.map((a, i) => (
            <span key={i} className="mr-3">
              {a.age} 岁: {scale === 10000 ? `${(a.value).toFixed(1)} 万` : a.value.toFixed(1)}{unit}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}
