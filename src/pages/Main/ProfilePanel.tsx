import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '../../store/profile'
import { useScenarioStore } from '../../store/scenario'
import type { Gender } from '../../model/types'
import { ChoiceRow, FieldGroup, NumberField } from '../Onboarding/StepShell'
import AboutModal from './AboutModal'

export default function ProfilePanel() {
  const [open, setOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const profile = useProfileStore((s) => s.profile)
  const setProfile = useProfileStore((s) => s.setProfile)
  const updateGlobalsFromProfile = useScenarioStore((s) => s.updateGlobalsFromProfile)
  const clearProfile = useProfileStore((s) => s.clearProfile)
  const clearScenario = useScenarioStore((s) => s.clear)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => setOpen(true)
    document.addEventListener('open-profile-panel', handler)
    return () => document.removeEventListener('open-profile-panel', handler)
  }, [])

  if (!profile) return null

  const update = (patch: Partial<typeof profile>) => {
    const next = { ...profile, ...patch }
    setProfile(next)
    // 仅同步 globalParams，事件保留用户已有的调整
    updateGlobalsFromProfile(next)
  }

  const reset = () => {
    if (confirm('清空所有数据并重新开始？')) {
      clearScenario()
      clearProfile()
      navigate('/onboarding', { replace: true })
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/10 z-40 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white shadow-lift z-50 overflow-y-auto transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="px-6 py-5 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white/90 backdrop-blur z-10">
          <div>
            <div className="text-sm text-slate-500 mb-0.5">个人资料</div>
            <h3 className="text-2xl font-semibold tracking-tight">我的画像</h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-ink p-1 -m-1"
          >
            ✕
          </button>
        </header>

        <div className="px-6 py-5 space-y-5">
          <FieldGroup label="出生年份">
            <NumberField
              value={profile.birthYear}
              onChange={(v) => update({ birthYear: v })}
              min={1940}
              max={new Date().getFullYear() - 10}
            />
          </FieldGroup>

          <FieldGroup label="性别">
            <ChoiceRow<Gender>
              options={[
                { value: 'male', label: '男' },
                { value: 'female', label: '女' },
                { value: 'total', label: '不便透露' },
              ]}
              value={profile.gender}
              onChange={(v) => update({ gender: v })}
            />
          </FieldGroup>

          <FieldGroup label="当前年到手收入">
            <NumberField
              value={Math.round(profile.currentIncome / 10000)}
              onChange={(v) => update({ currentIncome: v * 10000 })}
              unit="万元/年"
              min={0}
              max={2000}
            />
          </FieldGroup>

          <FieldGroup label="当前总资产">
            <NumberField
              value={Math.round(profile.initialWealth / 10000)}
              onChange={(v) => update({ initialWealth: v * 10000 })}
              unit="万元"
            />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="投资收益率">
              <NumberField
                value={Math.round(profile.investmentReturn * 1000) / 10}
                onChange={(v) => update({ investmentReturn: v / 100 })}
                unit="%"
                min={0}
                max={20}
                step={0.5}
              />
            </FieldGroup>
            <FieldGroup label="通胀率">
              <NumberField
                value={Math.round(profile.inflationRate * 1000) / 10}
                onChange={(v) => update({ inflationRate: v / 100 })}
                unit="%"
                min={0}
                max={15}
                step={0.5}
              />
            </FieldGroup>
          </div>
          <p className="text-xs text-slate-500 -mt-2">
            实际财富年增值 ≈{' '}
            <span className="font-semibold tabular-nums">
              {((profile.investmentReturn - profile.inflationRate) * 100).toFixed(1)}%
            </span>
          </p>

          <p className="text-xs text-slate-400 -mt-2 leading-relaxed">
            工作满足度、婚姻幸福度、年基础生存费已分别移到「工作」「结婚」「生存」事件中——
            打开对应事件抽屉即可调整。
          </p>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <button
              onClick={() => setAboutOpen(true)}
              className="w-full text-sm text-slate-600 hover:bg-slate-100 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <span>📖</span>
              <span>关于人生曲线</span>
            </button>
            <button
              onClick={reset}
              className="w-full text-sm text-rose-500 hover:bg-rose-50 py-2.5 rounded-xl transition-colors"
            >
              清空所有数据并重新开始
            </button>
          </div>
        </div>
      </aside>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  )
}
