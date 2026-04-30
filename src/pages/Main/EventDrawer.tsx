import { useEffect, useState } from 'react'
import { useUIStore } from '../../store/ui'
import { useScenarioStore } from '../../store/scenario'
import { useProfileStore } from '../../store/profile'
import { useCounterfactual } from '../../hooks/useSimulation'
import Slider from '../../components/Slider'
import AnimatedNumber from '../../components/AnimatedNumber'
import EventImpactPreview from '../../components/EventImpactPreview'
import type { LifeEvent, SimContext } from '../../model/types'

/**
 * 右侧事件参数抽屉 —— 产品的"心跳"
 *
 * 拖动滑块 → 触发 store.updateEventParams → useSimulation 重算 → 反事实差值刷新
 *
 * 反事实差值的语义："本事件对总分的贡献" = L(当前) - L(移除该事件)
 */
export default function EventDrawer() {
  const drawerOpen = useUIStore((s) => s.drawerOpen)
  const selectedId = useUIStore((s) => s.selectedEventId)
  const closeDrawer = useUIStore((s) => s.closeDrawer)
  const scenario = useScenarioStore((s) => s.scenario)
  const updateParams = useScenarioStore((s) => s.updateEventParams)
  const removeEvent = useScenarioStore((s) => s.removeEvent)
  const counterfactual = useCounterfactual(selectedId)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const event = scenario?.events.find((e) => e.id === selectedId) ?? null

  // ESC 关闭 + 切换事件时复位 confirm
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) closeDrawer()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen, closeDrawer])

  useEffect(() => {
    setConfirmingDelete(false)
  }, [selectedId])

  if (!event) return null

  return (
    <>
      {/* backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/10 z-40 transition-opacity duration-200 ${
          drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDrawer}
      />
      {/* drawer：移动端底部抽屉，桌面右侧抽屉 */}
      <aside
        className={`fixed bg-white shadow-lift z-50 overflow-y-auto transition-transform duration-200
          inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl
          lg:inset-auto lg:top-0 lg:right-0 lg:bottom-0 lg:w-[420px] lg:max-h-none lg:rounded-none
          ${drawerOpen
            ? 'translate-y-0 lg:translate-x-0'
            : 'translate-y-full lg:translate-y-0 lg:translate-x-full'}
        `}
      >
        <DrawerHeader event={event} onClose={closeDrawer} />

        <div className="px-6 py-5 space-y-5">
          <p className="text-xs text-slate-400 -mb-2">
            💡 双击 / 长按任意滑块 → 自动找让总分最高的值
          </p>
          <EventParamFields
            event={event}
            onChange={(patch) => updateParams(event.id, patch)}
          />
          {/* 自定义事件已经有自己的曲线编辑器，不再叠预览 */}
          {event.type !== 'custom' && <EventPreviewBlock event={event} />}
        </div>

        {/* 影响指标（仅可删事件展示反事实差值） */}
        {event.removable && (
        <div className="px-6 py-5 mx-6 mb-5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="text-xs text-slate-500 mb-3">本事件的贡献</div>
          {counterfactual ? (
            <div className="space-y-2.5">
              <ImpactRow
                label="对总分"
                value={counterfactual.scoreDelta}
                digits={1}
                positive={counterfactual.scoreDelta > 0}
              />
              <ImpactRow
                label="对期望寿命"
                value={counterfactual.lifespanDelta}
                digits={1}
                suffix=" 岁"
                positive={counterfactual.lifespanDelta > 0}
              />
              <ImpactRow
                label="对财富巅峰"
                value={counterfactual.peakWealthDelta / 10000}
                digits={0}
                suffix=" 万"
                positive={counterfactual.peakWealthDelta > 0}
              />
            </div>
          ) : (
            <div className="text-sm text-slate-400">计算中…</div>
          )}
        </div>
        )}

        {/* 删除（仅 removable 事件，内联 confirm） */}
        {event.removable && (
          <div className="px-6 pb-6">
            {confirmingDelete ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 flex items-center gap-2 text-sm transition-all">
                <span className="flex-1 text-rose-700">
                  确认移除「{event.name}」？
                </span>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-white rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    removeEvent(event.id)
                    setConfirmingDelete(false)
                    closeDrawer()
                  }}
                  className="px-3 py-1.5 bg-rose-500 text-white hover:bg-rose-600 rounded-lg transition-colors font-medium"
                >
                  移除
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="w-full text-sm text-rose-500 hover:bg-rose-50 py-2.5 rounded-xl transition-colors"
              >
                移除此事件
              </button>
            )}
          </div>
        )}
        {!event.removable && (
          <div className="px-6 pb-6 text-xs text-slate-400 text-center">
            这是基础事件，无法移除
          </div>
        )}
      </aside>
    </>
  )
}

function EventPreviewBlock({ event }: { event: LifeEvent }) {
  const profile = useProfileStore((s) => s.profile)
  const scenario = useScenarioStore((s) => s.scenario)
  if (!profile || !scenario) return null
  const ctx: SimContext = {
    profile,
    global: scenario.globalParams,
    events: scenario.events,
  }
  return <EventImpactPreview event={event} ctx={ctx} />
}

function DrawerHeader({ event, onClose }: { event: LifeEvent; onClose: () => void }) {
  return (
    <header className="px-6 py-5 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white/90 backdrop-blur z-10">
      <div>
        <div className="text-sm text-slate-500 mb-0.5">事件参数</div>
        <h3 className="text-2xl font-semibold tracking-tight">{event.name}</h3>
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-ink p-1 -m-1 transition-colors"
        aria-label="关闭"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>
    </header>
  )
}

function ImpactRow({
  label,
  value,
  digits,
  suffix = '',
  positive,
}: {
  label: string
  value: number
  digits: number
  suffix?: string
  positive: boolean
}) {
  const sign = value > 0 ? '+' : ''
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <span
        className={`text-base font-semibold tabular-nums ${
          Math.abs(value) < 0.01
            ? 'text-slate-400'
            : positive
            ? 'text-emerald-600'
            : 'text-rose-600'
        }`}
      >
        {sign}
        <AnimatedNumber value={value} digits={digits} flash={false} />
        {suffix}
      </span>
    </div>
  )
}

/* ======================== 各事件类型的参数字段 ======================== */

function EventParamFields({
  event,
  onChange,
}: {
  event: LifeEvent
  onChange: (patch: Record<string, number | string | boolean>) => void
}) {
  switch (event.type) {
    case 'living':
      return <LivingFields event={event} onChange={onChange} />
    case 'sleep':
      return <SleepFields event={event} onChange={onChange} />
    case 'life':
      return <LifeFields event={event} onChange={onChange} />
    case 'education':
      return <EducationFields event={event} onChange={onChange} />
    case 'work':
      return <WorkFields event={event} onChange={onChange} />
    case 'marriage':
      return <MarriageFields event={event} onChange={onChange} />
    case 'children':
      return <ChildrenFields event={event} onChange={onChange} />
    case 'house':
      return <HouseFields event={event} onChange={onChange} />
    case 'world-travel':
      return <TravelFields event={event} onChange={onChange} />
    case 'exercise':
      return <ExerciseFields event={event} onChange={onChange} />
    case 'startup':
      return <StartupFields event={event} onChange={onChange} />
    case 'hobby':
      return <HobbyFields event={event} onChange={onChange} />
    case 'illness':
      return <IllnessFields event={event} onChange={onChange} />
    case 'volunteer':
      return <VolunteerFields event={event} onChange={onChange} />
    case 'custom':
      return <CustomFields event={event} onChange={onChange} />
    default:
      return null
  }
}

function LivingFields({
  event,
  onChange,
}: {
  event: LifeEvent
  onChange: (patch: Record<string, number | string | boolean>) => void
}) {
  const p = event.params as { baselineCost: number; baseHoursPerDay: number }
  return (
    <>
      <p className="text-sm text-slate-500 leading-relaxed">
        「生存」是消费的最低门槛：维持温饱所需的年支出。
        系统以此为基准衡量你的"消费体验"——花到 10 倍以上才接近饱和。
      </p>
      <Slider
        label="年基础生存费"
        value={Math.round(p.baselineCost / 10000)}
        min={1}
        max={200}
        step={1}
        formatValue={(v) => `${v} 万/年`}
        onChange={(v) => onChange({ baselineCost: v * 10000 })}
       optKey="baselineCost" optEventId={event.id} optTransform={(v) => v * 10000}
      />
      <Slider
        label="基础生活时间占用"
        value={p.baseHoursPerDay}
        min={0.5}
        max={3}
        step={0.25}
        unit=" 小时/天"
        onChange={(v) => onChange({ baseHoursPerDay: v })}
       optKey="baseHoursPerDay" optEventId={event.id}
      />
    </>
  )
}

function SleepFields({
  event,
  onChange,
}: {
  event: LifeEvent
  onChange: (patch: Record<string, number | string | boolean>) => void
}) {
  const p = event.params as { hoursPerDay: number }
  return (
    <>
      <p className="text-sm text-slate-500 leading-relaxed">
        睡眠 &lt; 6h 会显著影响体验和寿命；8h 是常见基线；超过 10h 收益递减。
      </p>
      <Slider
        label="睡眠时长" value={p.hoursPerDay} min={4} max={11} step={0.5} unit=" 小时/天"
        onChange={(v) => onChange({ hoursPerDay: v })}
       optKey="hoursPerDay" optEventId={event.id}
      />
    </>
  )
}

function LifeFields({
  event,
  onChange,
}: {
  event: LifeEvent
  onChange: (patch: Record<string, number | string | boolean>) => void
}) {
  const p = event.params as { yearlyBudget: number }
  return (
    <>
      <p className="text-sm text-slate-500 leading-relaxed">
        「生活」是优先级最低的基础事件——你想在享受生活上每年多花多少钱。
        实际能享受多少，还要看睡眠、工作之后剩多少"生活时间"。
      </p>
      <Slider
        label="年生活预算"
        value={Math.round(p.yearlyBudget / 10000)}
        min={0}
        max={300}
        step={1}
        formatValue={(v) => `${v} 万/年`}
        onChange={(v) => onChange({ yearlyBudget: v * 10000 })}
       optKey="yearlyBudget" optEventId={event.id} optTransform={(v) => v * 10000}
      />
    </>
  )
}

function EducationFields({
  event,
  onChange,
}: {
  event: LifeEvent
  onChange: (patch: Record<string, number | string | boolean>) => void
}) {
  const p = event.params as {
    startAge: number
    endAge: number
    yearlyTuition: number
    expMultBoost: number
  }
  return (
    <>
      <p className="text-sm text-slate-500 leading-relaxed">
        在校期间占用 8h/天、缴学费；毕业后终身体验率 ×{(p.expMultBoost).toFixed(2)}
        ——书读得越久，越能享受人生。
      </p>
      <Slider
        label="入学年龄" value={p.startAge} min={0} max={50} unit=" 岁"
        onChange={(v) => onChange({ startAge: v, endAge: Math.max(v + 1, p.endAge) })}
       optKey="startAge" optEventId={event.id}
      />
      <Slider
        label="毕业年龄" value={p.endAge} min={p.startAge + 1} max={50} unit=" 岁"
        onChange={(v) => onChange({ endAge: v })}
       optKey="endAge" optEventId={event.id}
      />
      <Slider
        label="年学费"
        value={Math.round(p.yearlyTuition / 1000) / 10}
        min={0}
        max={50}
        step={0.5}
        formatValue={(v) => `${v.toFixed(1)} 万/年`}
        onChange={(v) => onChange({ yearlyTuition: v * 10000 })}
       optKey="yearlyTuition" optEventId={event.id} optTransform={(v) => v * 10000}
      />
      <Slider
        label="终身体验率加成"
        value={Math.round((p.expMultBoost - 1) * 1000) / 10}
        min={0}
        max={30}
        step={0.5}
        formatValue={(v) => `+${v.toFixed(1)}%`}
        onChange={(v) => onChange({ expMultBoost: 1 + v / 100 })}
       optKey="expMultBoost" optEventId={event.id} optTransform={(v) => 1 + v / 100}
      />
    </>
  )
}

function WorkFields({
  event,
  onChange,
}: {
  event: LifeEvent
  onChange: (patch: Record<string, number | string | boolean>) => void
}) {
  const p = event.params as {
    startAge: number
    endAge: number
    hoursPerDay: number
    salaryMultiplier: number
    satisfaction: number
  }
  return (
    <>
      <Slider
        label="起始年龄" value={p.startAge} min={16} max={40} unit=" 岁"
        onChange={(v) => onChange({ startAge: v, endAge: Math.max(v + 1, p.endAge) })}
       optKey="startAge" optEventId={event.id}
      />
      <Slider
        label="退休年龄"
        value={p.endAge}
        min={p.startAge + 1}
        max={75}
        unit=" 岁"
        formatValue={(v) => `${v} 岁${v < 50 ? '（提前）' : v > 65 ? '（延迟）' : ''}`}
        onChange={(v) => onChange({ endAge: v })}
       optKey="endAge" optEventId={event.id}
      />
      <Slider
        label="日均工作时长" value={p.hoursPerDay} min={4} max={14} step={0.5} unit=" 小时"
        onChange={(v) => onChange({ hoursPerDay: v })}
       optKey="hoursPerDay" optEventId={event.id}
      />
      <Slider
        label="收入水平" value={p.salaryMultiplier} min={0.4} max={3.5} step={0.1}
        formatValue={(v) => `${v.toFixed(1)}× 你当前收入`}
        onChange={(v) => onChange({ salaryMultiplier: v })}
       optKey="salaryMultiplier" optEventId={event.id}
      />
      <Slider
        label="工作满足度"
        value={p.satisfaction}
        min={-1}
        max={1}
        step={0.05}
        formatValue={(v) => (v < -0.3 ? '厌恶' : v < 0.3 ? '中性' : v < 0.7 ? '喜欢' : '热爱')}
        onChange={(v) => onChange({ satisfaction: v })}
       optKey="satisfaction" optEventId={event.id}
      />
    </>
  )
}

function MarriageFields({
  event,
  onChange,
}: {
  event: LifeEvent
  onChange: (patch: Record<string, number | string | boolean>) => void
}) {
  const p = event.params as { startAge: number; sharedCostMultiplier: number; happiness: number }
  return (
    <>
      <Slider
        label="结婚年龄" value={p.startAge} min={20} max={50} unit=" 岁"
        onChange={(v) => onChange({ startAge: v })}
       optKey="startAge" optEventId={event.id}
      />
      <Slider
        label="共同消费倍率" value={p.sharedCostMultiplier} min={0.5} max={1.6} step={0.05}
        formatValue={(v) => `${v.toFixed(2)}× 单身基线`}
        onChange={(v) => onChange({ sharedCostMultiplier: v })}
       optKey="sharedCostMultiplier" optEventId={event.id}
      />
      <Slider
        label="婚姻幸福度"
        value={p.happiness}
        min={0}
        max={1}
        step={0.05}
        formatValue={(v) => (v < 0.3 ? '糟糕' : v < 0.6 ? '一般' : v < 0.85 ? '幸福' : '美满')}
        onChange={(v) => onChange({ happiness: v })}
       optKey="happiness" optEventId={event.id}
      />
    </>
  )
}

function ChildrenFields({
  event,
  onChange,
}: {
  event: LifeEvent
  onChange: (patch: Record<string, number | string | boolean>) => void
}) {
  const p = event.params as { startAge: number; count: number; raiseUntil: number; filialSupport: number }
  return (
    <>
      <Slider
        label="生第一个孩子的年龄" value={p.startAge} min={20} max={45} unit=" 岁"
        onChange={(v) => onChange({ startAge: v })}
       optKey="startAge" optEventId={event.id}
      />
      <Slider
        label="孩子数量" value={p.count} min={1} max={3} step={1} unit=" 个"
        onChange={(v) => onChange({ count: v })}
       optKey="count" optEventId={event.id}
      />
      <Slider
        label="抚养至" value={p.raiseUntil} min={18} max={28} unit=" 岁"
        onChange={(v) => onChange({ raiseUntil: v })}
       optKey="raiseUntil" optEventId={event.id}
      />
      <Slider
        label="期望子女陪伴" value={p.filialSupport} min={0} max={1} step={0.05}
        formatValue={(v) => (v < 0.3 ? '少' : v < 0.7 ? '中' : '多')}
        onChange={(v) => onChange({ filialSupport: v })}
       optKey="filialSupport" optEventId={event.id}
      />
    </>
  )
}

function HouseFields({
  event,
  onChange,
}: {
  event: LifeEvent
  onChange: (patch: Record<string, number | string | boolean>) => void
}) {
  const p = event.params as {
    buyAge: number
    totalPrice: number
    downPaymentRatio: number
    loanYears: number
    interestRate: number
  }
  return (
    <>
      <Slider
        label="买房年龄" value={p.buyAge} min={22} max={60} unit=" 岁"
        onChange={(v) => onChange({ buyAge: v })}
       optKey="buyAge" optEventId={event.id}
      />
      <Slider
        label="总价" value={Math.round(p.totalPrice / 10000)} min={50} max={2000} step={10}
        formatValue={(v) => `${v} 万`}
        onChange={(v) => onChange({ totalPrice: v * 10000 })}
       optKey="totalPrice" optEventId={event.id} optTransform={(v) => v * 10000}
      />
      <Slider
        label="首付比例" value={p.downPaymentRatio} min={0.2} max={1} step={0.05}
        formatValue={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => onChange({ downPaymentRatio: v })}
       optKey="downPaymentRatio" optEventId={event.id}
      />
      <Slider
        label="贷款年限" value={p.loanYears} min={5} max={30} step={5} unit=" 年"
        onChange={(v) => onChange({ loanYears: v })}
       optKey="loanYears" optEventId={event.id}
      />
    </>
  )
}

function TravelFields({
  event,
  onChange,
}: {
  event: LifeEvent
  onChange: (patch: Record<string, number | string | boolean>) => void
}) {
  const p = event.params as { age: number; durationYears: number; totalCost: number }
  return (
    <>
      <Slider
        label="出发年龄" value={p.age} min={20} max={75} unit=" 岁"
        onChange={(v) => onChange({ age: v })}
       optKey="age" optEventId={event.id}
      />
      <Slider
        label="旅行时长" value={p.durationYears} min={0.1} max={2} step={0.1}
        formatValue={(v) => `${v.toFixed(1)} 年`}
        onChange={(v) => onChange({ durationYears: v })}
       optKey="durationYears" optEventId={event.id}
      />
      <Slider
        label="预算" value={Math.round(p.totalCost / 10000)} min={5} max={300} step={5}
        formatValue={(v) => `${v} 万`}
        onChange={(v) => onChange({ totalCost: v * 10000 })}
       optKey="totalCost" optEventId={event.id} optTransform={(v) => v * 10000}
      />
    </>
  )
}

import CurveEditor from '../../components/CurveEditor'
import { parseCurves } from '../../model/events/custom'

function CustomFields({
  event,
  onChange,
}: {
  event: LifeEvent
  onChange: (patch: Record<string, number | string | boolean>) => void
}) {
  const p = event.params as {
    displayName: string
    startAge: number
    endAge: number
    flexible: boolean
    curvesJson: string
  }
  const curves = parseCurves(p.curvesJson)

  const updateCurve = (key: 'time' | 'money' | 'exp' | 'death', anchors: { age: number; value: number }[]) => {
    const next = { ...curves, [key]: anchors }
    onChange({ curvesJson: JSON.stringify(next) })
  }

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">事件名称</label>
        <input
          type="text"
          value={p.displayName}
          onChange={(e) => onChange({ displayName: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/20 transition-all"
        />
      </div>
      <Slider
        label="生效起始年龄" value={p.startAge} min={0} max={100} unit=" 岁"
        onChange={(v) => onChange({ startAge: v, endAge: Math.max(v + 1, p.endAge) })}
       optKey="startAge" optEventId={event.id}
      />
      <Slider
        label="生效结束年龄" value={p.endAge} min={p.startAge + 1} max={100} unit=" 岁"
        onChange={(v) => onChange({ endAge: v })}
       optKey="endAge" optEventId={event.id}
      />
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">柔性事件（可与生活时间共存）</span>
        <button
          onClick={() => onChange({ flexible: !p.flexible })}
          className={`relative w-10 h-6 rounded-full transition-colors ${
            p.flexible ? 'bg-ink' : 'bg-slate-300'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
              p.flexible ? 'left-[18px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      <div className="pt-2 space-y-4">
        <div className="text-sm font-medium text-slate-600">在 age 轴上拖动锚点定义事件影响：</div>
        <CurveEditor
          title="时间占用"
          unit="小时/天"
          color="#F2994A"
          minAge={p.startAge}
          maxAge={p.endAge}
          minValue={0}
          maxValue={16}
          anchors={curves.time}
          onChange={(a) => updateCurve('time', a)}
        />
        <CurveEditor
          title="现金流"
          unit="万元/年"
          color="#F2C94C"
          scale={10000}
          minAge={p.startAge}
          maxAge={p.endAge}
          minValue={-100}
          maxValue={100}
          anchors={curves.money}
          onChange={(a) => updateCurve('money', a)}
        />
        <CurveEditor
          title="体验加成"
          unit=""
          color="#9B72CF"
          minAge={p.startAge}
          maxAge={p.endAge}
          minValue={-1}
          maxValue={2}
          anchors={curves.exp}
          onChange={(a) => updateCurve('exp', a)}
        />
      </div>
    </>
  )
}

function ExerciseFields({
  event,
  onChange,
}: {
  event: LifeEvent
  onChange: (patch: Record<string, number | string | boolean>) => void
}) {
  const p = event.params as { startAge: number; endAge: number; hoursPerWeek: number; annualCost: number }
  return (
    <>
      <Slider label="起始年龄" value={p.startAge} min={10} max={80} unit=" 岁"
        onChange={(v) => onChange({ startAge: v, endAge: Math.max(v + 1, p.endAge) })}  optKey="startAge" optEventId={event.id}
      />
      <Slider label="结束年龄" value={p.endAge} min={p.startAge + 1} max={100} unit=" 岁"
        onChange={(v) => onChange({ endAge: v })}  optKey="endAge" optEventId={event.id}
      />
      <Slider label="每周锻炼" value={p.hoursPerWeek} min={1} max={15} step={0.5} unit=" 小时"
        onChange={(v) => onChange({ hoursPerWeek: v })}  optKey="hoursPerWeek" optEventId={event.id}
      />
      <Slider label="年花费"
        value={Math.round(p.annualCost / 100) / 100}
        min={0} max={10} step={0.1}
        formatValue={(v) => `${v.toFixed(1)} 万/年`}
        onChange={(v) => onChange({ annualCost: v * 10000 })}  optKey="annualCost" optEventId={event.id} optTransform={(v) => v * 10000}
      />
    </>
  )
}

function StartupFields({
  event,
  onChange,
}: {
  event: LifeEvent
  onChange: (patch: Record<string, number | string | boolean>) => void
}) {
  const p = event.params as { startAge: number; endAge: number; initialInvestment: number; expectedReturnMultiplier: number; hoursPerDay: number; passion: number }
  return (
    <>
      <Slider label="启动年龄" value={p.startAge} min={18} max={70} unit=" 岁"
        onChange={(v) => onChange({ startAge: v, endAge: Math.max(v + 1, p.endAge) })}  optKey="startAge" optEventId={event.id}
      />
      <Slider label="退出年龄" value={p.endAge} min={p.startAge + 1} max={75} unit=" 岁"
        onChange={(v) => onChange({ endAge: v })}  optKey="endAge" optEventId={event.id}
      />
      <Slider label="启动投入"
        value={Math.round(p.initialInvestment / 10000)}
        min={5} max={1000} step={5}
        formatValue={(v) => `${v} 万`}
        onChange={(v) => onChange({ initialInvestment: v * 10000 })}  optKey="initialInvestment" optEventId={event.id} optTransform={(v) => v * 10000}
      />
      <Slider label="期望回报倍率"
        value={p.expectedReturnMultiplier} min={0.1} max={10} step={0.1}
        formatValue={(v) => v < 1 ? `${v.toFixed(1)}×（亏损）` : v < 1.5 ? `${v.toFixed(1)}×（小赚）` : `${v.toFixed(1)}×（赚翻）`}
        onChange={(v) => onChange({ expectedReturnMultiplier: v })}  optKey="expectedReturnMultiplier" optEventId={event.id}
      />
      <Slider label="日均时长" value={p.hoursPerDay} min={6} max={18} step={0.5} unit=" 小时"
        onChange={(v) => onChange({ hoursPerDay: v })}  optKey="hoursPerDay" optEventId={event.id}
      />
      <Slider label="创业激情" value={p.passion} min={0} max={1} step={0.05}
        formatValue={(v) => v < 0.3 ? "勉强" : v < 0.6 ? "投入" : v < 0.85 ? "热爱" : "All in"}
        onChange={(v) => onChange({ passion: v })}  optKey="passion" optEventId={event.id}
      />
    </>
  )
}

function HobbyFields({
  event,
  onChange,
}: {
  event: LifeEvent
  onChange: (patch: Record<string, number | string | boolean>) => void
}) {
  const p = event.params as { displayName: string; startAge: number; endAge: number; hoursPerDay: number; annualCost: number; intensity: number }
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">兴趣名称</label>
        <input type="text" value={p.displayName}
          onChange={(e) => onChange({ displayName: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/20 transition-all" />
      </div>
      <Slider label="起始年龄" value={p.startAge} min={5} max={80} unit=" 岁"
        onChange={(v) => onChange({ startAge: v, endAge: Math.max(v + 1, p.endAge) })}  optKey="startAge" optEventId={event.id}
      />
      <Slider label="结束年龄" value={p.endAge} min={p.startAge + 1} max={100} unit=" 岁"
        onChange={(v) => onChange({ endAge: v })}  optKey="endAge" optEventId={event.id}
      />
      <Slider label="日均时长" value={p.hoursPerDay} min={0.25} max={5} step={0.25} unit=" 小时"
        onChange={(v) => onChange({ hoursPerDay: v })}  optKey="hoursPerDay" optEventId={event.id}
      />
      <Slider label="年花费"
        value={Math.round(p.annualCost / 100) / 100}
        min={0} max={20} step={0.1}
        formatValue={(v) => `${v.toFixed(1)} 万/年`}
        onChange={(v) => onChange({ annualCost: v * 10000 })}  optKey="annualCost" optEventId={event.id} optTransform={(v) => v * 10000}
      />
      <Slider label="沉浸度" value={p.intensity} min={0} max={1} step={0.05}
        formatValue={(v) => v < 0.3 ? "随便玩玩" : v < 0.6 ? "认真投入" : v < 0.85 ? "深度沉浸" : "心流"}
        onChange={(v) => onChange({ intensity: v })}  optKey="intensity" optEventId={event.id}
      />
    </>
  )
}

function IllnessFields({
  event,
  onChange,
}: {
  event: LifeEvent
  onChange: (patch: Record<string, number | string | boolean>) => void
}) {
  const p = event.params as { age: number; durationYears: number; treatmentCost: number; yearlyCareCost: number; severity: number; lifespanAfter: number }
  const isFatal = p.severity >= 0.85
  return (
    <>
      <Slider label="发病年龄" value={p.age} min={20} max={95} unit=" 岁"
        onChange={(v) => onChange({ age: v })}  optKey="age" optEventId={event.id}
      />
      <Slider label="病程年数" value={p.durationYears} min={1} max={15} unit=" 年"
        onChange={(v) => onChange({ durationYears: v })}  optKey="durationYears" optEventId={event.id}
      />
      <Slider label="一次性治疗费"
        value={Math.round(p.treatmentCost / 10000)} min={1} max={500} step={1}
        formatValue={(v) => `${v} 万`}
        onChange={(v) => onChange({ treatmentCost: v * 10000 })}  optKey="treatmentCost" optEventId={event.id} optTransform={(v) => v * 10000}
      />
      <Slider label="后续年医疗费"
        value={Math.round(p.yearlyCareCost / 10000 * 10) / 10} min={0} max={50} step={0.5}
        formatValue={(v) => `${v.toFixed(1)} 万/年`}
        onChange={(v) => onChange({ yearlyCareCost: v * 10000 })}  optKey="yearlyCareCost" optEventId={event.id} optTransform={(v) => v * 10000}
      />
      <Slider label="严重程度" value={p.severity} min={0} max={1} step={0.05}
        formatValue={(v) => v < 0.3 ? "轻微" : v < 0.6 ? "中度" : v < 0.85 ? "严重" : "致命"}
        onChange={(v) => onChange({ severity: v })}  optKey="severity" optEventId={event.id}
      />
      {isFatal && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3">
          <Slider
            label="预计存活年限（致命级）"
            value={p.lifespanAfter}
            min={0.5}
            max={15}
            step={0.5}
            unit=" 年"
            onChange={(v) => onChange({ lifespanAfter: v })}
            optKey="lifespanAfter"
            optEventId={event.id}
          />
          <p className="text-xs text-rose-600 mt-2">
            致命疾病将把死亡概率集中到这段时间内，会明显降低期望寿命
          </p>
        </div>
      )}
    </>
  )
}

function VolunteerFields({
  event,
  onChange,
}: {
  event: LifeEvent
  onChange: (patch: Record<string, number | string | boolean>) => void
}) {
  const p = event.params as { startAge: number; endAge: number; hoursPerWeek: number }
  return (
    <>
      <Slider label="起始年龄" value={p.startAge} min={15} max={90} unit=" 岁"
        onChange={(v) => onChange({ startAge: v, endAge: Math.max(v + 1, p.endAge) })}  optKey="startAge" optEventId={event.id}
      />
      <Slider label="结束年龄" value={p.endAge} min={p.startAge + 1} max={100} unit=" 岁"
        onChange={(v) => onChange({ endAge: v })}  optKey="endAge" optEventId={event.id}
      />
      <Slider label="每周时长" value={p.hoursPerWeek} min={1} max={20} step={0.5} unit=" 小时"
        onChange={(v) => onChange({ hoursPerWeek: v })}  optKey="hoursPerWeek" optEventId={event.id}
      />
    </>
  )
}

