/**
 * g(spend, baseline)：金钱 → 体验 饱和函数
 *
 * 设计：
 *   spend = 0           → -1.0  （没饭吃，体验非常差）
 *   spend = baseline    → 0     （温饱中性）
 *   spend = 5×          → ~1.18 （明显改善）
 *   spend = 10×         → ~1.78 （差不多到顶了）
 *   spend = 15×         → ~2.01 （开始饱和）
 *   spend → ∞           → 2.14  （饱和上限）
 *
 * 这样 V = baseEps(1) + g(spend) ∈ [0, 3.14]
 * 即"饱和体验" ≈ "基础体验" × 3.14
 */
export const SATURATION_CAP = 2.14
const K = 5

export function moneyToExp(spend: number, baseline: number): number {
  if (baseline <= 0) return 0
  if (spend <= 0) return -1
  if (spend < baseline) {
    // 0..baseline：从 -1 线性升到 0
    return spend / baseline - 1
  }
  // baseline..∞：饱和指数趋近 cap
  const overflow = spend / baseline - 1 // ≥ 0
  return SATURATION_CAP * (1 - Math.exp(-overflow / K))
}
