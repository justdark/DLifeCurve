import { create } from 'zustand'

interface UIState {
  selectedEventId: string | null
  drawerOpen: boolean
  showAddEvent: boolean
  hasSeenDragHint: boolean

  selectEvent: (id: string | null) => void
  closeDrawer: () => void
  openAddEvent: (open: boolean) => void
  markHintSeen: () => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedEventId: null,
  drawerOpen: false,
  showAddEvent: false,
  hasSeenDragHint: typeof window !== 'undefined' && localStorage.getItem('lifecurve.hint') === '1',

  selectEvent: (id) => set({ selectedEventId: id, drawerOpen: id !== null }),
  closeDrawer: () => set({ drawerOpen: false, selectedEventId: null }),
  openAddEvent: (open) => set({ showAddEvent: open }),
  markHintSeen: () => {
    set({ hasSeenDragHint: true })
    if (typeof window !== 'undefined') localStorage.setItem('lifecurve.hint', '1')
  },
}))
