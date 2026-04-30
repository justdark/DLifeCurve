import { create } from 'zustand'
import type { UserProfile } from '../model/types'
import { loadPersisted, savePersisted } from '../lib/persist'

interface ProfileState {
  profile: UserProfile | null
  setProfile: (p: UserProfile) => void
  clearProfile: () => void
}

function isValidProfile(p: unknown): p is UserProfile {
  if (!p || typeof p !== 'object') return false
  const o = p as Record<string, unknown>
  return (
    typeof o.birthYear === 'number' &&
    typeof o.sleepHours === 'number'
  )
}

/** 旧 profile 缺新字段时给默认值 */
function normalizeProfile(p: UserProfile): UserProfile {
  const raw = p as unknown as Record<string, unknown>
  return {
    ...p,
    currentIncome:
      typeof raw.currentIncome === 'number' ? raw.currentIncome : 300_000,
    investmentReturn: p.investmentReturn ?? 0.04,
    inflationRate: p.inflationRate ?? 0.02,
    initWorkSatisfaction:
      typeof raw.initWorkSatisfaction === 'number'
        ? raw.initWorkSatisfaction
        : (typeof raw.workSatisfaction === 'number' ? raw.workSatisfaction : 0.2),
    initMarriageHappiness:
      typeof raw.initMarriageHappiness === 'number'
        ? raw.initMarriageHappiness
        : (typeof raw.marriageHappiness === 'number' ? raw.marriageHappiness : 0.6),
    initBaselineCost:
      typeof raw.initBaselineCost === 'number'
        ? raw.initBaselineCost
        : (typeof raw.baselineCost === 'number' ? raw.baselineCost : 80_000),
  }
}

const initial = (): UserProfile | null => {
  const persisted = loadPersisted()
  const raw = persisted?.profile
  return isValidProfile(raw) ? normalizeProfile(raw) : null
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: initial(),
  setProfile: (p) => {
    set({ profile: p })
    const persisted = loadPersisted() ?? { version: 1 }
    savePersisted({ ...persisted, profile: p })
  },
  clearProfile: () => {
    set({ profile: null })
    const persisted = loadPersisted()
    if (persisted) savePersisted({ ...persisted, profile: undefined })
  },
}))
