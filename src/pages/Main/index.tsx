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
    <header className="sticky top-0 z-30 bg-white/75 backdrop-blur-md border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-lg sm:text-xl shrink-0">
            📈
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-semibold tracking-tight text-ink leading-none">
              人生曲线
            </div>
            <div className="hidden sm:block text-[11px] text-slate-400 mt-0.5 leading-none">
              Life Curve · 实时模拟
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <IconButton
            href="https://github.com/justdark/DLifeCurve"
            external
            title="GitHub 仓库"
            ariaLabel="GitHub repository"
          >
            <GitHubIcon />
          </IconButton>
          <IconButton
            onClick={() => document.dispatchEvent(new CustomEvent('open-profile-panel'))}
            title="我的资料"
            ariaLabel="个人资料"
          >
            <UserIcon />
          </IconButton>
        </div>
      </div>
    </header>
  )
}

function IconButton({
  children,
  onClick,
  href,
  external,
  title,
  ariaLabel,
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  external?: boolean
  title?: string
  ariaLabel?: string
}) {
  const cls =
    'w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-slate-500 hover:text-ink hover:bg-slate-100 active:bg-slate-200 transition-colors'
  if (href) {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        title={title}
        aria-label={ariaLabel}
        className={cls}
      >
        {children}
      </a>
    )
  }
  return (
    <button onClick={onClick} title={title} aria-label={ariaLabel} className={cls}>
      {children}
    </button>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
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
