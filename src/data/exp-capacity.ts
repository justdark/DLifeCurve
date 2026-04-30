/**
 * f(t)：年龄-体验能力系数（倒 U 形，对应 board_3）
 *
 * 设计：通过若干锚点做平滑插值，输出 0~1 的系数。
 * 0 岁：0.50（婴儿，体验能力低）
 * 18 岁：0.92
 * 30 岁：1.00（峰值）
 * 45 岁：0.92
 * 60 岁：0.78
 * 75 岁：0.55
 * 90 岁：0.32
 * 100 岁：0.20
 */
const ANCHORS: [number, number][] = [
  [0, 0.5],
  [10, 0.78],
  [18, 0.92],
  [25, 0.99],
  [30, 1.0],
  [35, 0.99],
  [45, 0.92],
  [55, 0.84],
  [60, 0.78],
  [70, 0.66],
  [75, 0.55],
  [85, 0.42],
  [90, 0.32],
  [100, 0.2],
]

/** 线性插值（锚点已按年龄排序） */
export function expCapacity(age: number): number {
  if (age <= ANCHORS[0][0]) return ANCHORS[0][1]
  const last = ANCHORS[ANCHORS.length - 1]
  if (age >= last[0]) return last[1]
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const [a1, v1] = ANCHORS[i]
    const [a2, v2] = ANCHORS[i + 1]
    if (age >= a1 && age <= a2) {
      const t = (age - a1) / (a2 - a1)
      return v1 + t * (v2 - v1)
    }
  }
  return last[1]
}
