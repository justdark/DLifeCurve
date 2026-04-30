/**
 * localStorage 持久化封装：版本化读写
 */
const STORAGE_KEY = 'lifecurve.v1'

export interface PersistedState {
  version: number
  profile?: unknown
  scenarios?: unknown
  currentScenarioId?: string
  uiState?: { hasSeenDragHint?: boolean }
}

export function loadPersisted(): PersistedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedState
    if (parsed.version !== 1) return null
    return parsed
  } catch {
    return null
  }
}

export function savePersisted(state: PersistedState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: 1 }))
  } catch (e) {
    console.warn('[lifecurve] failed to persist', e)
  }
}

export function clearPersisted(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
