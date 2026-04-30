import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDeathTableStore } from './store/death-table'
import { useProfileStore } from './store/profile'
import OnboardingPage from './pages/Onboarding'
import MainPage from './pages/Main'

function RootRedirect() {
  const profile = useProfileStore((s) => s.profile)
  return <Navigate to={profile ? '/app' : '/onboarding'} replace />
}

function ProtectedMain() {
  const profile = useProfileStore((s) => s.profile)
  if (!profile) return <Navigate to="/onboarding" replace />
  return <MainPage />
}

export default function App() {
  const loadTable = useDeathTableStore((s) => s.load)
  useEffect(() => {
    loadTable()
  }, [loadTable])

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/onboarding/*" element={<OnboardingPage />} />
      <Route path="/app/*" element={<ProtectedMain />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
