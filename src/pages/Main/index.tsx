import { useEffect, useState } from 'react'
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

type MobileTab = 'events' | 'charts'

export default function MainPage() {
  const table = useDeathTableStore((s) => s.table)
  const tableLoading = useDeathTableStore((s) => s.loading)
  const scenario = useScenarioStore((s) => s.scenario)
  const setScenario = useScenarioStore((s) => s.setScenario)
  const profile = useProfileStore((s) => s.profile)
  const result = useSimulation()
  const [mobileTab, setMobileTab] = useState<MobileTab>('events')

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
    <div className="min-h-screen bg-canvas pb-12">
      <Header />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <ScoreHeader result={result} />

        {/* Mobile: tabs */}
        <div className="lg:hidden">
          <MobileTabs value={mobileTab} onChange={setMobileTab} />
        </div>

        {/* Layout: mobile = tabbed single column; desktop = side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 lg:h-[488px]">
          <div
            className={`lg:col-span-5 lg:flex min-h-0 ${
              mobileTab === 'events' ? 'flex' : 'hidden'
            } lg:!flex`}
          >
            <EventTimeline scenario={scenario} result={result} />
          </div>
          <div
            className={`lg:col-span-7 min-h-0 ${
              mobileTab === 'charts' ? 'block' : 'hidden'
            } lg:!block h-[460px] lg:h-auto`}
          >
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

function MobileTabs({
  value,
  onChange,
}: {
  value: MobileTab
  onChange: (v: MobileTab) => void
}) {
  return (
    <div className="flex bg-slate-100 rounded-xl p-1">
      <TabBtn active={value === 'events'} onClick={() => onChange('events')}>
        人生事件
      </TabBtn>
      <TabBtn active={value === 'charts'} onClick={() => onChange('charts')}>
        曲线图表
      </TabBtn>
    </div>
  )
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
        active
          ? 'bg-white text-ink shadow-soft'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

function Header() {
  return (
    <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
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
    <footer className="text-center text-xs text-slate-400 py-6 sm:py-8 px-4">
      本工具基于统计建模，仅作思考辅助，不构成任何投资 / 医疗 / 婚恋建议。
      <br />
      数据仅存于你的本地浏览器。
    </footer>
  )
}
