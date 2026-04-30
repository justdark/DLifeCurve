import type { LifeEvent, SimContext, YearImpact } from '../types'

/**
 * 「睡觉」基础事件（不可删）
 *
 *  - 时间占用：用户配置的睡眠时长（小时/天）
 *  - 体验：睡眠不足会扣分（线性），过多收益很小（log）
 *  - 寿命：睡眠 < 6h 会增加中老年死亡概率
 */
interface SleepParams extends Record<string, number | string | boolean> {
  hoursPerDay: number
}

export function makeSleep(p: Partial<SleepParams> = {}): LifeEvent {
  const params: SleepParams = {
    hoursPerDay: p.hoursPerDay ?? 8,
  }
  return {
    id: 'sleep',
    type: 'sleep',
    name: '睡觉',
    startAge: 0,
    endAge: 'lifetime',
    removable: false,
    params,
    impactAt(_age: number, _ctx: SimContext): YearImpact {
      const h = params.hoursPerDay
      // 体验：7-9h 是舒适区（中性）；< 7h 线性扣分；< 6h 加剧
      // 例：h=7→0，h=6→-0.3，h=5→-0.7，h=4→-1.1，h=10→-0.05
      let expDelta = 0
      if (h < 6) expDelta = -0.3 + (h - 6) * 0.4
      else if (h < 7) expDelta = (h - 7) * 0.3
      else if (h <= 9) expDelta = 0
      else expDelta = -(h - 9) * 0.05

      // 寿命：< 7h 才开始扰动（医学共识阈值）
      const deathShift: { age: number; weight: number }[] = []
      if (h < 7) {
        const w = (7 - h) * 0.0005
        for (let a = 50; a <= 75; a++) deathShift.push({ age: a, weight: w })
        for (let a = 80; a <= 100; a++) deathShift.push({ age: a, weight: -w })
      }

      return {
        timeHours: h,
        moneyFlow: 0,
        expDelta,
        expMult: 1,
        deathShift,
      }
    },
  }
}
