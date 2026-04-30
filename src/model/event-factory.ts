/**
 * 事件序列化/反序列化（事件含闭包，不能直接 JSON）
 */
import type { LifeEvent, EventType } from './types'
import { makeWork } from './events/work'
import { makeMarriage } from './events/marriage'
import { makeChildren } from './events/children'
import { makeHouse } from './events/house'
import { makeWorldTravel } from './events/world-travel'
import { makeLiving } from './events/living'
import { makeSleep } from './events/sleep'
import { makeLife } from './events/life'
import { makeEducation } from './events/education'
import { makeExercise } from './events/exercise'
import { makeStartup } from './events/startup'
import { makeHobby } from './events/hobby'
import { makeIllness } from './events/illness'
import { makeVolunteer } from './events/volunteer'
import { makeCustom } from './events/custom'

export interface SerializedEvent {
  id: string
  type: EventType
  params: Record<string, number | string | boolean>
}

export function serializeEvent(e: LifeEvent): SerializedEvent {
  return { id: e.id, type: e.type, params: { ...e.params } }
}

/** 反序列化；旧版本未知类型返回 null（让上层过滤掉）。 */
export function rehydrateEvent(
  s: SerializedEvent,
  baselineCost?: number,
): LifeEvent | null {
  let ev: LifeEvent | null
  switch (s.type) {
    case 'living':
      ev = makeLiving(s.params as Parameters<typeof makeLiving>[0]); break
    case 'sleep':
      ev = makeSleep(s.params as Parameters<typeof makeSleep>[0]); break
    case 'life':
      ev = makeLife(s.params as Parameters<typeof makeLife>[0]); break
    case 'education':
      ev = makeEducation(s.params as Parameters<typeof makeEducation>[0]); break
    case 'work':
      ev = makeWork(s.params as Parameters<typeof makeWork>[0]); break
    case 'marriage':
      ev = makeMarriage(s.params as Parameters<typeof makeMarriage>[0]); break
    case 'children':
      ev = makeChildren(s.params as Parameters<typeof makeChildren>[0]); break
    case 'house':
      ev = makeHouse(s.params as Parameters<typeof makeHouse>[0], baselineCost); break
    case 'world-travel':
      ev = makeWorldTravel(s.params as Parameters<typeof makeWorldTravel>[0]); break
    case 'exercise':
      ev = makeExercise(s.params as Parameters<typeof makeExercise>[0]); break
    case 'startup':
      ev = makeStartup(s.params as Parameters<typeof makeStartup>[0]); break
    case 'hobby':
      ev = makeHobby(s.params as Parameters<typeof makeHobby>[0]); break
    case 'illness':
      ev = makeIllness(s.params as Parameters<typeof makeIllness>[0]); break
    case 'volunteer':
      ev = makeVolunteer(s.params as Parameters<typeof makeVolunteer>[0]); break
    case 'custom':
      ev = makeCustom(s.params as Parameters<typeof makeCustom>[0], s.id); break
    default:
      console.warn('[lifecurve] dropping unknown event type:', s.type)
      return null
  }
  // 关键：始终用传入的 id 覆盖 factory 默认 id（多实例事件如 hobby 必需）
  return { ...ev, id: s.id }
}

/** 用户可手动添加的事件清单（不含基础事件） */
export const ADDABLE_EVENT_DEFS: Array<{ type: EventType; label: string; emoji: string }> = [
  { type: 'education', label: '上学', emoji: '📚' },
  { type: 'work', label: '工作', emoji: '💼' },
  { type: 'marriage', label: '结婚', emoji: '💑' },
  { type: 'children', label: '生娃', emoji: '👶' },
  { type: 'house', label: '买房', emoji: '🏠' },
  { type: 'world-travel', label: '环球旅行', emoji: '✈️' },
  { type: 'exercise', label: '锻炼', emoji: '🏃' },
  { type: 'startup', label: '创业', emoji: '🚀' },
  { type: 'hobby', label: '兴趣爱好', emoji: '🎨' },
  { type: 'illness', label: '重大疾病', emoji: '🏥' },
  { type: 'volunteer', label: '公益志愿', emoji: '🤝' },
  { type: 'custom', label: '自定义事件', emoji: '✨' },
]

export const ALL_EVENT_LABELS: Record<EventType, { label: string; emoji: string }> = {
  living: { label: '生存', emoji: '🌱' },
  sleep: { label: '睡觉', emoji: '😴' },
  life: { label: '生活', emoji: '🌈' },
  education: { label: '上学', emoji: '📚' },
  work: { label: '工作', emoji: '💼' },
  marriage: { label: '结婚', emoji: '💑' },
  children: { label: '生娃', emoji: '👶' },
  house: { label: '买房', emoji: '🏠' },
  'world-travel': { label: '环球旅行', emoji: '✈️' },
  exercise: { label: '锻炼', emoji: '🏃' },
  startup: { label: '创业', emoji: '🚀' },
  hobby: { label: '兴趣爱好', emoji: '🎨' },
  illness: { label: '重大疾病', emoji: '🏥' },
  volunteer: { label: '公益志愿', emoji: '🤝' },
  custom: { label: '自定义', emoji: '✨' },
}
