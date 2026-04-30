import { create } from 'zustand'
import { loadDeathTable, type DeathTable } from '../data/death-table'

interface State {
  table: DeathTable | null
  loading: boolean
  load: () => Promise<void>
}

export const useDeathTableStore = create<State>((set, get) => ({
  table: null,
  loading: false,
  load: async () => {
    if (get().table || get().loading) return
    set({ loading: true })
    try {
      const t = await loadDeathTable(`${import.meta.env.BASE_URL}death-table.csv`)
      set({ table: t, loading: false })
    } catch (e) {
      console.error('[lifecurve] load death table failed', e)
      set({ loading: false })
    }
  },
}))
