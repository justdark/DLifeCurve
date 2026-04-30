import { useMemo } from 'react'
import type { LifeEvent, SimContext } from '../model/types'

interface Props {
  event: LifeEvent
  ctx: SimContext
}

/**
 * 在事件抽屉底部展示该事件对各维度的影响曲线（只读）
 *  - 时间占用 (h/天)
 *  - 现金流 (万元/年)
 *  - 体验加成 ε
 *  - 体验率乘子 μ - 1（如果存在 ≠ 1 的值才显示）
 *
 * 用户改参数滑块时，这些曲线实时跟随。
 */
export default function EventImpactPreview({ event, ctx }: Props) {
  const data = useMemo(() => computeSeries(event, ctx), [event, ctx])

  // 仅展示真正有变化的维度
  const items: { title: string; unit?: string; color: string; series: number[] }[] = []
  if (hasNonZero(data.time)) items.push({ title: '时间占用', unit: ' h/天', color: '#F2994A', series: data.time })
  if (hasNonZero(data.money)) {
    items.push({
      title: '现金流',
      unit: ' 万/年',
      color: '#F2C94C',
      series: data.money.map((v) => v / 10000),
    })
  }
  if (hasNonZero(data.exp)) items.push({ title: '体验加成 ε', color: '#9B72CF', series: data.exp })
  if (hasNonZero(data.muDelta)) {
    items.push({ title: '体验率乘子 μ-1', color: '#0ea5e9', series: data.muDelta })
  }

  if (items.length === 0) return null

  return (
    <div className="space-y-3 pt-4 border-t border-slate-100">
      <div className="text-xs font-medium text-slate-600">本事件的影响曲线（参数变化即时刷新）</div>
      {items.map((it) => (
        <MiniChart key={it.title} {...it} ages={data.ages} />
      ))}
    </div>
  )
}

interface SeriesData {
  ages: number[]
  time: number[]
  money: number[]
  exp: number[]
  muDelta: number[]
}

function computeSeries(event: LifeEvent, ctx: SimContext): SeriesData {
  const ages: number[] = []
  const time: number[] = []
  const money: number[] = []
  const exp: number[] = []
  const muDelta: number[] = []
  for (let age = 0; age <= 100; age++) {
    ages.push(age)
    const yi = event.impactAt(age, ctx)
    time.push(yi.timeHours)
    money.push(yi.moneyFlow)
    exp.push(yi.expDelta)
    muDelta.push(yi.expMult - 1)
  }
  return { ages, time, money, exp, muDelta }
}

function hasNonZero(arr: number[]): boolean {
  return arr.some((v) => Math.abs(v) > 1e-9)
}

function MiniChart({
  title,
  unit = '',
  color,
  series,
  ages,
}: {
  title: string
  unit?: string
  color: string
  series: number[]
  ages: number[]
}) {
  const W = 360
  const H = 70
  const PAD_X = 28
  const PAD_TOP = 6
  const PAD_BOT = 16

  // y 轴范围：包含 0
  const minV = Math.min(0, ...series)
  const maxV = Math.max(0, ...series)
  const span = Math.max(0.001, maxV - minV)

  const xOf = (age: number) => PAD_X + ((age - 0) / 100) * (W - PAD_X - 6)
  const yOf = (v: number) => H - PAD_BOT - ((v - minV) / span) * (H - PAD_TOP - PAD_BOT)

  const path = series
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xOf(ages[i]).toFixed(1)} ${yOf(v).toFixed(1)}`)
    .join(' ')
  const yZero = yOf(0)

  // 找有效区间（series 非零部分）的 fill
  const fillPath =
    `M ${xOf(0).toFixed(1)} ${yZero.toFixed(1)} ` +
    series.map((v, i) => `L ${xOf(ages[i]).toFixed(1)} ${yOf(v).toFixed(1)}`).join(' ') +
    ` L ${xOf(100).toFixed(1)} ${yZero.toFixed(1)} Z`

  // 标签
  const fmt = (v: number) =>
    Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 1 ? v.toFixed(1) : v.toFixed(2)

  return (
    <div className="rounded-xl border border-slate-200 px-3 pt-2 pb-1 bg-white">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-slate-600">{title}</span>
        <span className="text-slate-400 tabular-nums">
          范围 {fmt(minV)}{unit} ~ {fmt(maxV)}{unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={PAD_X} y1={H - PAD_BOT} x2={W - 6} y2={H - PAD_BOT} stroke="#e2e8f0" />
        <line x1={PAD_X} y1={PAD_TOP} x2={PAD_X} y2={H - PAD_BOT} stroke="#e2e8f0" />
        {minV < 0 && maxV > 0 && (
          <line x1={PAD_X} y1={yZero} x2={W - 6} y2={yZero} stroke="#cbd5e1" strokeDasharray="2 3" />
        )}
        <path d={fillPath} fill={color} fillOpacity={0.12} />
        <path d={path} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        {[0, 25, 50, 75, 100].map((a) => (
          <text key={a} x={xOf(a)} y={H - 3} fontSize={9} fill="#94a3b8" textAnchor="middle">
            {a}
          </text>
        ))}
      </svg>
    </div>
  )
}
