/**
 * 由 baselineCost（年基础生存费）派生的各类默认值
 *
 * 替代了原 city-cost.ts。所有事件的默认参数都通过 baseline 倍数派生，
 * 这样用户改一个数字，整个系统的"消费水平"都跟着走。
 */

/** 一套自住房默认总价（90 平），约 70 倍年基础生存费 */
export function defaultHousePrice(baselineCost: number): number {
  return baselineCost * 70
}

/** 单孩抚养费（婴儿到大学毕业 22 年），均摊到每年 */
export function defaultChildCost(baselineCost: number): number {
  return baselineCost * 1.4
}

/** 退休后年金（养老金 + 子女赡养兜底） */
export function defaultPension(baselineCost: number): number {
  return baselineCost * 0.7
}

/** 婚姻共担：双方共同消费倍率 */
export const DEFAULT_SHARED_COST_MULTIPLIER = 0.85

/** 法定退休年龄（可被工作事件 endAge 覆写） */
export const DEFAULT_RETIRE_AGE = 62
