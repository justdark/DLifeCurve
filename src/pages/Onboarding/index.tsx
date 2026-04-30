import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '../../store/profile'
import { useScenarioStore } from '../../store/scenario'
import { buildBaselineScenario } from '../../model/profile-to-scenario'
import type { UserProfile } from '../../model/types'
import Step1Welcome from './Step1Welcome'
import Step2Basic from './Step2Basic'
import Step3Status from './Step3Status'
import Step4Preference from './Step4Preference'
import LoadingTransition from './LoadingTransition'

export type DraftProfile = Partial<UserProfile>

const TOTAL_STEPS = 4

export default function OnboardingPage() {
  const navigate = useNavigate()
  const setProfile = useProfileStore((s) => s.setProfile)
  const setScenario = useScenarioStore((s) => s.setScenario)

  const [step, setStep] = useState(0) // 0=welcome, 1-4=steps, 5=loading
  const [draft, setDraft] = useState<DraftProfile>({
    birthYear: new Date().getFullYear() - 32,
    gender: 'total',
    currentIncome: 300_000,
    initialWealth: 500_000,
    sleepHours: 8,
    investmentReturn: 0.04,
    inflationRate: 0.02,
    marriage: 'single',
    childrenCount: 0,
    hasHouse: false,
    health: 'healthy',
    initWorkSatisfaction: 0.2,
    initMarriageHappiness: 0.6,
    initBaselineCost: 80_000,
  })

  const update = (patch: Partial<UserProfile>) => setDraft((d) => ({ ...d, ...patch }))

  const handleFinish = () => {
    setStep(5)
    // 模拟 onboarding 完成 → 写 profile + 生成基线 scenario
    setTimeout(() => {
      const profile: UserProfile = {
        ...(draft as UserProfile),
        completedAt: Date.now(),
        version: 1,
      }
      setProfile(profile)
      const scenario = buildBaselineScenario(profile)
      setScenario(scenario)
      navigate('/app', { replace: true })
    }, 1100)
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return <Step1Welcome onNext={() => setStep(1)} />
      case 1:
        return (
          <Step2Basic
            value={draft}
            onChange={update}
            onPrev={() => setStep(0)}
            onNext={() => setStep(2)}
            current={1}
            total={TOTAL_STEPS}
          />
        )
      case 2:
        return (
          <Step3Status
            value={draft}
            onChange={update}
            onPrev={() => setStep(1)}
            onNext={() => setStep(3)}
            current={2}
            total={TOTAL_STEPS}
          />
        )
      case 3:
        return (
          <Step4Preference
            value={draft}
            onChange={update}
            onPrev={() => setStep(2)}
            onFinish={handleFinish}
            current={3}
            total={TOTAL_STEPS}
          />
        )
      case 5:
        return <LoadingTransition />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl">{renderStep()}</div>
    </div>
  )
}
