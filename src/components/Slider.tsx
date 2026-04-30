import { useAutoOptimize } from '../hooks/useAutoOptimize'

interface Props {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  formatValue?: (v: number) => string
  onChange: (v: number) => void
  /** 提供后启用"双击自动寻最优"：自动找出让总分最大的参数值 */
  optKey?: string
  optEventId?: string
  /**
   * 滑块值 → 实际参数值的转换。例：滑块 0-300 (万)，参数是元 → optTransform={(v) => v * 10000}
   * 默认恒等。
   */
  optTransform?: (sliderValue: number) => number
}

/**
 * 受控滑块：标签 + 当前值 + range
 * 当 optKey + optEventId 都提供时，双击滑块自动找让总分最大的值
 */
export default function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  formatValue,
  onChange,
  optKey,
  optEventId,
  optTransform,
}: Props) {
  const autoOpt = useAutoOptimize()
  const display = formatValue ? formatValue(value) : `${value}${unit ?? ''}`

  const enableAutoMax = !!(optKey && optEventId)
  const handleDoubleClick = enableAutoMax
    ? (e: React.MouseEvent) => {
        e.preventDefault()
        const transform = optTransform ?? ((v: number) => v)
        const sliderCandidates: number[] = []
        for (let v = min; v <= max + 1e-9; v += step) {
          sliderCandidates.push(Math.round(v * 1000) / 1000)
        }
        const paramCandidates = sliderCandidates.map(transform)
        const bestParam = autoOpt(optEventId!, optKey!, paramCandidates)
        if (bestParam === null) return
        const idx = paramCandidates.findIndex(
          (p) => Math.abs(p - bestParam) < 1e-6,
        )
        if (idx < 0) return
        // 最优值 == 当前值 → 不做无谓更新
        if (Math.abs(sliderCandidates[idx] - value) < 1e-6) return
        onChange(sliderCandidates[idx])
      }
    : undefined

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-sm font-medium text-slate-600">{label}</label>
        <span className="text-base font-semibold tabular-nums text-ink">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onDoubleClick={handleDoubleClick}
        title={enableAutoMax ? '双击自动找让总分最高的参数值' : undefined}
      />
      <div className="flex justify-between text-xs text-slate-400 mt-1 tabular-nums">
        <span>{formatValue ? formatValue(min) : `${min}${unit ?? ''}`}</span>
        <span>{formatValue ? formatValue(max) : `${max}${unit ?? ''}`}</span>
      </div>
    </div>
  )
}
