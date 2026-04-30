import { create } from 'zustand'
import type { Scenario, LifeEvent, GlobalParams, UserProfile } from '../model/types'
import { loadPersisted, savePersisted } from '../lib/persist'
import { serializeEvent, rehydrateEvent, type SerializedEvent } from '../model/event-factory'
import { makeLiving } from '../model/events/living'
import { makeSleep } from '../model/events/sleep'
import { makeLife } from '../model/events/life'
import { makeEducation } from '../model/events/education'

interface SerializedScenario {
  id: string
  name: string
  isBaseline: boolean
  globalParams: GlobalParams
  events: SerializedEvent[]
  createdAt: number
  updatedAt: number
}

interface ScenarioState {
  scenario: Scenario | null
  setScenario: (s: Scenario) => void
  /** 仅更新 globalParams（profile 改了时用），保留所有事件 */
  updateGlobalsFromProfile: (profile: UserProfile) => void
  updateEventParams: (eventId: string, params: Record<string, number | string | boolean>) => void
  removeEvent: (eventId: string) => void
  addEvent: (e: LifeEvent) => void
  clear: () => void
}

function serialize(s: Scenario): SerializedScenario {
  return {
    id: s.id,
    name: s.name,
    isBaseline: s.isBaseline,
    globalParams: s.globalParams,
    events: s.events.map(serializeEvent),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }
}

function deserialize(s: SerializedScenario): Scenario {
  // 旧 globalParams 可能仍有 baselineCost / sleepHours，作为迁移源
  const legacy = s.globalParams as unknown as { baselineCost?: number; sleepHours?: number }
  const legacyBaseline = legacy.baselineCost ?? 80_000
  const sleepHours = legacy.sleepHours ?? 8
  const events: LifeEvent[] = []
  for (const raw of s.events) {
    const ev = rehydrateEvent(raw, legacyBaseline)
    if (ev) events.push(ev)
  }
  // 迁移：补齐缺失的基础事件
  if (!events.some((e) => e.type === 'living')) {
    events.unshift(makeLiving({ baselineCost: legacyBaseline }))
  }
  if (!events.some((e) => e.type === 'sleep')) {
    const idx = events.findIndex((e) => e.type === 'living')
    events.splice(idx + 1, 0, makeSleep({ hoursPerDay: sleepHours }))
  }
  if (!events.some((e) => e.type === 'life')) {
    const idx = events.findIndex((e) => e.type === 'sleep')
    events.splice(idx + 1, 0, makeLife({ yearlyBudget: Math.round(legacyBaseline * 0.6) }))
  }
  if (!events.some((e) => e.type === 'education')) {
    const idx = events.findIndex((e) => e.type === 'life')
    events.splice(idx + 1, 0, makeEducation())
  }
  return { ...s, events }
}

const initial = (): Scenario | null => {
  const persisted = loadPersisted()
  if (!persisted?.scenarios) return null
  const list = persisted.scenarios as SerializedScenario[]
  if (!list.length) return null
  const id = persisted.currentScenarioId ?? list[0].id
  const found = list.find((s) => s.id === id) ?? list[0]
  return deserialize(found)
}

function persist(s: Scenario | null): void {
  const persisted = loadPersisted() ?? { version: 1 }
  if (!s) {
    savePersisted({ ...persisted, scenarios: [], currentScenarioId: undefined })
    return
  }
  savePersisted({
    ...persisted,
    scenarios: [serialize(s)],
    currentScenarioId: s.id,
  })
}

export const useScenarioStore = create<ScenarioState>((set, get) => ({
  scenario: initial(),

  setScenario: (s) => {
    set({ scenario: s })
    persist(s)
  },

  updateGlobalsFromProfile: (profile) => {
    const cur = get().scenario
    if (!cur) return
    const investmentReturn = profile.investmentReturn ?? 0.04
    const inflationRate = profile.inflationRate ?? 0.02
    const newAge = Math.max(0, new Date().getFullYear() - profile.birthYear)
    const newGlobals: GlobalParams = {
      currentAge: newAge,
      initialWealth: profile.initialWealth,
      gender: profile.gender,
      currentIncome: profile.currentIncome,
      realReturn: investmentReturn - inflationRate,
      investmentReturn,
      inflationRate,
    }
    const next: Scenario = {
      ...cur,
      globalParams: newGlobals,
      updatedAt: Date.now(),
    }
    set({ scenario: next })
    persist(next)
  },

  updateEventParams: (eventId, params) => {
    const cur = get().scenario
    if (!cur) return
    const idx = cur.events.findIndex((e) => e.id === eventId)
    if (idx < 0) return
    const oldEvent = cur.events[idx]
    const merged = { ...oldEvent.params, ...params }
    // baselineCost 来自 living 事件
    const livingEv = cur.events.find((e) => e.type === 'living')
    const baseline = (livingEv?.params.baselineCost as number | undefined) ?? 80_000
    const newEvent = rehydrateEvent(
      { id: oldEvent.id, type: oldEvent.type, params: merged },
      baseline,
    )
    if (!newEvent) return
    const events = [...cur.events]
    events[idx] = newEvent
    const next: Scenario = { ...cur, events, updatedAt: Date.now() }
    set({ scenario: next })
    persist(next)
  },

  removeEvent: (eventId) => {
    const cur = get().scenario
    if (!cur) return
    const next: Scenario = {
      ...cur,
      events: cur.events.filter((e) => e.id !== eventId),
      updatedAt: Date.now(),
    }
    set({ scenario: next })
    persist(next)
  },

  addEvent: (e) => {
    const cur = get().scenario
    if (!cur) return
    const next: Scenario = {
      ...cur,
      events: [...cur.events, e],
      updatedAt: Date.now(),
    }
    set({ scenario: next })
    persist(next)
  },

  clear: () => {
    set({ scenario: null })
    persist(null)
  },
}))
