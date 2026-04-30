import type { DraftProfile } from '.'
import StepShell, { FieldGroup, ChoiceRow, NumberField } from './StepShell'
import type { Gender } from '../../model/types'

interface Props {
  value: DraftProfile
  onChange: (patch: DraftProfile) => void
  onPrev: () => void
  onNext: () => void
  current: number
  total: number
}

export default function Step2Basic({ value, onChange, onPrev, onNext, current, total }: Props) {
  const currentYear = new Date().getFullYear()
  const age = value.birthYear ? currentYear - value.birthYear : 0

  return (
    <StepShell
      title="先认识一下你"
      subtitle="决定你的人生曲线起点和未来收入推算"
      current={current}
      total={total}
      onPrev={onPrev}
      onNext={onNext}
      nextDisabled={
        !value.birthYear || !value.initBaselineCost || value.currentIncome === undefined
      }
    >
      <FieldGroup label="出生年份" hint={`即你的当前年龄 ${age} 岁`}>
        <NumberField
          value={value.birthYear ?? 1992}
          onChange={(v) => onChange({ birthYear: v })}
          min={currentYear - 80}
          max={currentYear - 10}
        />
      </FieldGroup>

      <FieldGroup label="性别">
        <ChoiceRow<Gender>
          options={[
            { value: 'male', label: '男' },
            { value: 'female', label: '女' },
            { value: 'total', label: '不便透露' },
          ]}
          value={value.gender ?? 'total'}
          onChange={(v) => onChange({ gender: v })}
        />
      </FieldGroup>

      <FieldGroup
        label="当前年到手收入"
        hint="税后实际拿到手的钱。系统按通用职业曲线推断未来逐年的预估收入"
      >
        <NumberField
          value={Math.round((value.currentIncome ?? 300_000) / 10000)}
          onChange={(v) => onChange({ currentIncome: v * 10000 })}
          unit="万元/年"
          min={0}
          max={2000}
          step={1}
        />
      </FieldGroup>

      <FieldGroup
        label="年基础生存费"
        hint="维持温饱所需的年支出（含吃住、必要开销，不含娱乐/储蓄）。可在主页面「生存」事件里随时调整"
      >
        <NumberField
          value={Math.round((value.initBaselineCost ?? 80_000) / 10000)}
          onChange={(v) => onChange({ initBaselineCost: v * 10000 })}
          unit="万元/年"
          min={1}
          max={200}
          step={1}
        />
      </FieldGroup>

      <FieldGroup label="当前总资产" hint="储蓄 + 投资 + 房产净值，可大致估算">
        <NumberField
          value={Math.round((value.initialWealth ?? 500_000) / 10000)}
          onChange={(v) => onChange({ initialWealth: v * 10000 })}
          unit="万元"
          min={-500}
          max={100000}
          step={1}
        />
      </FieldGroup>

      <div className="grid grid-cols-2 gap-4">
        <FieldGroup label="投资收益率" hint="年化（名义）">
          <NumberField
            value={Math.round((value.investmentReturn ?? 0.04) * 1000) / 10}
            onChange={(v) => onChange({ investmentReturn: v / 100 })}
            unit="%"
            min={0}
            max={20}
            step={0.5}
          />
        </FieldGroup>
        <FieldGroup label="通胀率" hint="年化">
          <NumberField
            value={Math.round((value.inflationRate ?? 0.02) * 1000) / 10}
            onChange={(v) => onChange({ inflationRate: v / 100 })}
            unit="%"
            min={0}
            max={15}
            step={0.5}
          />
        </FieldGroup>
      </div>
      <p className="text-xs text-slate-500 -mt-3">
        实际财富年增值 ≈{' '}
        <span className="font-semibold tabular-nums">
          {(((value.investmentReturn ?? 0.04) - (value.inflationRate ?? 0.02)) * 100).toFixed(1)}%
        </span>
        （所有金额按今天的购买力展示）
      </p>
    </StepShell>
  )
}
