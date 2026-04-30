import { useEffect } from 'react'
import { useDeathTableStore } from '../../store/death-table'
import { useScenarioStore } from '../../store/scenario'
import { useProfileStore } from '../../store/profile'
import { buildBaselineScenario } from '../../model/profile-to-scenario'
import { useSimulation } from '../../hooks/useSimulation'
import ScoreHeader from './ScoreHeader'
import EventTimeline from './EventTimeline'
import EventDrawer from './EventDrawer'
import ChartsGrid from './Charts'
import AddEventModal from './AddEventModal'
import ProfilePanel from './ProfilePanel'
import BottomCurve from './BottomCurve'

export default function MainPage() {
  const table = useDeathTableStore((s) => s.table)
  const tableLoading = useDeathTableStore((s) => s.loading)
  const scenario = useScenarioStore((s) => s.scenario)
  const setScenario = useScenarioStore((s) => s.setScenario)
  const profile = useProfileStore((s) => s.profile)
  const result = useSimulation()

  // 防御：用户首次完成 onboarding 还没生成 scenario 就保险
  useEffect(() => {
    if (!scenario && profile) {
      setScenario(buildBaselineScenario(profile))
    }
  }, [scenario, profile, setScenario])

  if (tableLoading || !table || !scenario || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">加载中…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <ScoreHeader result={result} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 flex">
            <EventTimeline scenario={scenario} result={result} />
          </div>
          <div className="lg:col-span-7">
            <ChartsGrid result={result} />
          </div>
        </div>

        <Footer />
      </main>

      <EventDrawer />
      <AddEventModal />
      <ProfilePanel />
      <BottomCurve result={result} />
    </div>
  )
}

function Header() {
  return (
    <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📈</span>
          <span className="font-semibold tracking-tight">人生曲线</span>
        </div>
        <div className="flex items-center gap-2">
          <ProfileLink />
        </div>
      </div>
    </header>
  )
}

function ProfileLink() {
  return (
    <button
      onClick={() => {
        document.dispatchEvent(new CustomEvent('open-profile-panel'))
      }}
      className="btn-ghost text-sm"
    >
      我的资料
    </button>
  )
}

function Footer() {
  return (
    <footer className="text-center text-xs text-slate-400 py-8">
      本工具基于统计建模，仅作思考辅助，不构成任何投资 / 医疗 / 婚恋建议。
      <br />
      数据仅存于你的本地浏览器。
    </footer>
  )
}
