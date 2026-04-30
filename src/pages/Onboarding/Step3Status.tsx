import type { DraftProfile } from '.'
import StepShell, { FieldGroup, ChoiceRow } from './StepShell'
import type { Marriage, Health } from '../../model/types'

interface Props {
  value: DraftProfile
  onChange: (patch: DraftProfile) => void
  onPrev: () => void
  onNext: () => void
  current: number
  total: number
}

export default function Step3Status({ value, onChange, onPrev, onNext, current, total }: Props) {
  return (
    <StepShell
      title="你现在的状态"
      subtitle="决定你的人生曲线从哪里开始"
      current={current}
      total={total}
      onPrev={onPrev}
      onNext={onNext}
    >
      <FieldGroup label="婚姻状态">
        <ChoiceRow<Marriage>
          options={[
            { value: 'single', label: '未婚' },
            { value: 'married', label: '已婚' },
            { value: 'divorced', label: '离异' },
          ]}
          value={value.marriage ?? 'single'}
          onChange={(v) => onChange({ marriage: v })}
        />
      </FieldGroup>

      <FieldGroup label="子女数量">
        <ChoiceRow<number>
          options={[
            { value: 0, label: '没有' },
            { value: 1, label: '1 个' },
            { value: 2, label: '2 个' },
            { value: 3, label: '3+ 个' },
          ]}
          value={value.childrenCount ?? 0}
          onChange={(v) => onChange({ childrenCount: v as 0 | 1 | 2 | 3 })}
        />
      </FieldGroup>

      <FieldGroup label="是否已购自住房">
        <ChoiceRow<number>
          options={[
            { value: 1, label: '已购' },
            { value: 0, label: '未购' },
          ]}
          value={value.hasHouse ? 1 : 0}
          onChange={(v) => onChange({ hasHouse: v === 1 })}
        />
      </FieldGroup>

      <FieldGroup label="健康自评">
        <ChoiceRow<Health>
          options={[
            { value: 'healthy', label: '健康' },
            { value: 'sub-healthy', label: '亚健康' },
            { value: 'chronic', label: '有慢性病' },
          ]}
          value={value.health ?? 'healthy'}
          onChange={(v) => onChange({ health: v })}
        />
      </FieldGroup>

      <FieldGroup
        label="日均睡眠"
        hint="<6h 影响寿命与体验；8h 是常见基线"
      >
        <input
          type="range"
          min={4}
          max={11}
          step={0.5}
          value={value.sleepHours ?? 8}
          onChange={(e) => onChange({ sleepHours: Number(e.target.value) })}
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1 tabular-nums">
          <span>4h</span>
          <span className="text-ink font-medium">{(value.sleepHours ?? 8).toFixed(1)} 小时</span>
          <span>11h</span>
        </div>
      </FieldGroup>
    </StepShell>
  )
}
