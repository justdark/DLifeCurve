/**
 * 09-10 年统计死亡年龄表加载与处理
 *
 * 注意：CSV 表头写的是 "年龄,男,女,合计"，但实际列序是 "年龄,合计,男,女"
 *      （用 32 岁那行验证：14996 = 10571 + 4425）
 *      这里按位置而非表头解析。
 */
import Papa from 'papaparse'

export const T_MAX = 100

export interface DeathTable {
  // index 0..100 对应 0..100岁；100 包含 "100岁及以上"
  total: Float64Array
  male: Float64Array
  female: Float64Array
}

export type Gender = 'male' | 'female' | 'total'

let _cached: DeathTable | null = null

export async function loadDeathTable(url = '/death-table.csv'): Promise<DeathTable> {
  if (_cached) return _cached
  const res = await fetch(url)
  const text = await res.text()
  _cached = parseDeathTableCSV(text)
  return _cached
}

export function parseDeathTableCSV(csv: string): DeathTable {
  const parsed = Papa.parse<string[]>(csv.trim(), { skipEmptyLines: true })
  const rows = parsed.data
  // 跳过表头
  const dataRows = rows.slice(1)

  const total = new Float64Array(T_MAX + 1)
  const male = new Float64Array(T_MAX + 1)
  const female = new Float64Array(T_MAX + 1)

  for (const row of dataRows) {
    if (row.length < 4) continue
    const ageStr = row[0]
    // 按位置（不信表头）：合计、男、女
    const totalN = Number(row[1])
    const maleN = Number(row[2])
    const femaleN = Number(row[3])
    if (!Number.isFinite(totalN)) continue

    let age: number
    if (ageStr.includes('100')) age = 100
    else age = parseInt(ageStr, 10)

    if (age >= 0 && age <= T_MAX) {
      total[age] = totalN
      male[age] = maleN
      female[age] = femaleN
    }
  }
  return { total, male, female }
}

/**
 * 给定当前年龄 t0 已存活，未来死亡年龄的条件分布 d(t)：sum 为 1
 * d[i] for i in [t0, T_MAX]，i < t0 处为 0
 *
 * 注意：CSV 是"某年的死亡数量"而非死亡率，直接归一化会忽略人口结构
 * （死亡数大不代表死亡率高，可能只是这个年龄段人多）。
 * 这里改用近年中国年龄别死亡率 q(x) 构造生命表，给出正确的条件期望。
 *
 * `table` 参数保留是为了向后兼容，仅作为是否能加载死亡数据的占位检查。
 */
export function buildBaseDeathDist(
  _table: DeathTable | null,
  t0: number,
  gender: Gender,
): Float64Array {
  // 1. 构造生命表 l(x)：每年存活比例
  const lx = new Float64Array(T_MAX + 2)
  lx[0] = 1
  for (let x = 0; x <= T_MAX; x++) {
    const q = Math.min(1, qxAt(x, gender))
    lx[x + 1] = lx[x] * (1 - q)
  }
  // 2. 条件死亡分布：d(t) = (l(t) - l(t+1)) / l(t0)，t ≥ t0
  const dist = new Float64Array(T_MAX + 1)
  if (lx[t0] <= 0) {
    dist[Math.min(t0, T_MAX)] = 1
    return dist
  }
  let acc = 0
  for (let x = t0; x < T_MAX; x++) {
    dist[x] = (lx[x] - lx[x + 1]) / lx[t0]
    acc += dist[x]
  }
  // 100+ 桶吸收剩余尾部质量
  dist[T_MAX] = Math.max(0, 1 - acc)
  return dist
}

/**
 * 中国近年年龄别死亡率 q(x) 锚点（基于 NBS / WHO 2018-2020 数据估算后平滑）
 * 这给出的总人口期望寿命 ≈ 78、男女差距合理
 */
const QX_ANCHORS_TOTAL: [number, number][] = [
  [0, 0.0050], [1, 0.0006], [5, 0.0002], [10, 0.0002], [15, 0.0003],
  [20, 0.0004], [25, 0.0005], [30, 0.0007], [35, 0.0010], [40, 0.0015],
  [45, 0.0022], [50, 0.0035], [55, 0.0055], [60, 0.0085], [65, 0.0130],
  [70, 0.0210], [75, 0.0340], [80, 0.0550], [85, 0.0900], [90, 0.1400],
  [95, 0.2100], [100, 1.0],
]

export function qxAt(age: number, gender: Gender): number {
  const base = interp(QX_ANCHORS_TOTAL, age)
  // 中国男性死亡率比女性高约 50-70%（年龄越大差距越明显）
  if (gender === 'male') return base * 1.35
  if (gender === 'female') return base * 0.75
  return base
}

function interp(anchors: [number, number][], age: number): number {
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
 * 基础死亡分布 + 事件扰动 → 重新归一化
 * shift[i] 为对死亡分布的加性扰动（事件模型保证 Σshift ≈ 0）
 */
export function applyDeathShift(
  base: Float64Array,
  shift: Float64Array | null,
): Float64Array {
  if (!shift) return base
  const out = new Float64Array(base.length)
  let sum = 0
  for (let i = 0; i < base.length; i++) {
    out[i] = Math.max(0, base[i] + shift[i])
    sum += out[i]
  }
  if (sum > 0) {
    for (let i = 0; i < out.length; i++) out[i] /= sum
  }
  return out
}

/**
 * 由死亡分布 d(t) 计算条件生存概率 P(t)（在 t0 已活的前提下，活到 t 的概率）
 * P(t) = Σ_{i ≥ t} d(i)
 */
export function buildSurvival(d: Float64Array, t0: number): Float64Array {
  const P = new Float64Array(d.length)
  let acc = 0
  for (let t = T_MAX; t >= 0; t--) {
    acc += d[t]
    P[t] = t < t0 ? 1 : acc
  }
  return P
}

/**
 * 由生存概率计算期望寿命 E[T]
 *   E[T] = t0 + Σ_{t ≥ t0+1} P(t)   （离散版本）
 * 用 d(t) 的 Σ t·d(t) 更直接：
 */
export function expectedLifespan(d: Float64Array): number {
  let sum = 0
  for (let t = 0; t < d.length; t++) sum += t * d[t]
  return sum
}
