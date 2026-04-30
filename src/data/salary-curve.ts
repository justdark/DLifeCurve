/**
 * 收入曲线
 *
 * 设计：用户直接填"当前年收入（到手）"，曲线只决定不同年龄相对当前的比值。
 * 比如用户当前 32 岁、30 万到手；曲线把这个 30 万拉伸到全生命周期。
 */

/** 通用相对收入曲线（peak ≈ 35-42，65 岁归零） */
const RELATIVE_CURVE: [number, number][] = [
  [18, 0.30],
  [22, 0.45],
  [25, 0.60],
  [28, 0.75],
  [32, 0.90],
  [35, 1.00], // peak
  [42, 1.00],
  [48, 0.92],
  [52, 0.80],
  [55, 0.65],
  [58, 0.50],
  [62, 0.30],
  [65, 0.0],
]

function interpolate(anchors: [number, number][], age: number): number {
  if (age <= anchors[0][0]) return anchors[0][1]
  const last = anchors[anchors.length - 1]
  if (age >= last[0]) return last[1]
  for (let i = 0; i < anchors.length - 1; i++) {
    const [a1, v1] = anchors[i]
    const [a2, v2] = anchors[i + 1]
    if (age >= a1 && age <= a2) {
      const t = (age - a1) / (a2 - a1)
      return v1 + t * (v2 - v1)
    }
  }
  return last[1]
}

/**
 * 给定用户当前年龄、当前到手年收入，返回 t 岁的预估到手年收入（元）
 * 关键性质：salaryAt(currentAge) === currentIncome
 */
export function salaryAt(currentAge: number, currentIncome: number, age: number): number {
  const refRel = interpolate(RELATIVE_CURVE, currentAge)
  if (refRel <= 0) return 0
  const targetRel = interpolate(RELATIVE_CURVE, age)
  return Math.max(0, currentIncome * (targetRel / refRel))
}
