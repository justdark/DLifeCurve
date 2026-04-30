import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  current: number
  total: number
  onPrev?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  children: ReactNode
}

export default function StepShell({
  title,
  subtitle,
  current,
  total,
  onPrev,
  onNext,
  nextLabel = '下一步 →',
  nextDisabled = false,
  children,
}: Props) {
  return (
    <div className="card p-8">
      {/* progress */}
      <div className="flex items-center gap-1.5 mb-6">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
              i < current ? 'bg-ink' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      <h2 className="text-2xl font-semibold tracking-tight mb-1">{title}</h2>
      {subtitle && <p className="text-slate-500 mb-6">{subtitle}</p>}

      <div className="space-y-5 mb-8">{children}</div>

      <div className="flex justify-between gap-3">
        {onPrev ? (
          <button onClick={onPrev} className="btn-ghost">
            ← 上一步
          </button>
        ) : (
          <span />
        )}
        {onNext && (
          <button onClick={onNext} disabled={nextDisabled} className="btn-primary">
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  )
}

export function FieldGroup({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-2">{label}</label>
      {children}
      {hint && <div className="text-xs text-slate-400 mt-1.5">{hint}</div>}
    </div>
  )
}

export function ChoiceRow<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-150 ${
            value === o.value
              ? 'bg-ink text-white border-ink'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function NumberField({
  value,
  onChange,
  unit,
  min,
  max,
  step = 1,
}: {
  value: number
  onChange: (v: number) => void
  unit?: string
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/20 transition-all tabular-nums"
      />
      {unit && <span className="text-sm text-slate-500 whitespace-nowrap">{unit}</span>}
    </div>
  )
}
