import type { DraftProfile } from '.'
import StepShell, { FieldGroup } from './StepShell'

interface Props {
  value: DraftProfile
  onChange: (patch: DraftProfile) => void
  onPrev: () => void
  onFinish: () => void
  current: number
  total: number
}

export default function Step4Preference({
  value,
  onChange,
  onPrev,
  onFinish,
  current,
  total,
}: Props) {
  const isMarried = value.marriage === 'married'

  return (
    <StepShell
      title="你的偏好"
      subtitle="作为对应事件的初值（之后可在事件抽屉里随时改）"
      current={current}
      total={total}
      onPrev={onPrev}
      onNext={onFinish}
      nextLabel="生成我的人生曲线 →"
    >
      <BipolarSlider
        label="你享受工作吗？"
        leftLabel="很厌恶"
        rightLabel="很热爱"
        value={value.initWorkSatisfaction ?? 0.2}
        onChange={(v) => onChange({ initWorkSatisfaction: v })}
      />

      <BipolarSlider
        label="婚姻幸福度"
        leftLabel="糟糕"
        rightLabel="美满"
        min={0}
        max={1}
        value={value.initMarriageHappiness ?? 0.6}
        onChange={(v) => onChange({ initMarriageHappiness: v })}
        hint={!isMarried ? '（如果未来结婚，预设的幸福度）' : undefined}
      />

      <p className="text-xs text-slate-400 pt-2 leading-relaxed">
        这两个值会被填到对应的「工作」「结婚」事件参数里。
        进入主页面后，你可以点开事件直接微调。
      </p>
    </StepShell>
  )
}

interface SliderProps {
  label: string
  leftLabel: string
  rightLabel: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  hint?: string
}

function BipolarSlider({
  label,
  leftLabel,
  rightLabel,
  value,
  onChange,
  min = -1,
  max = 1,
  hint,
}: SliderProps) {
  return (
    <FieldGroup label={label} hint={hint}>
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="flex justify-between text-xs text-slate-500 mt-1.5">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </FieldGroup>
  )
}
