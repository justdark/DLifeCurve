import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface Props {
  open: boolean
  onClose: () => void
}

const ABOUT_DOC = `
# 关于人生曲线

这是一个把"人生"建模成数学曲线的工具：你输入个人画像和人生事件，
系统按概率与体验函数算出你这一辈子的"期望体验总分"，并把过程可视化。

---

## 核心三要素

人生由三件事组成：

- **时间**：每天 24 小时，你怎么分？工作 / 睡觉 / 生活
- **金钱**：你赚多少 vs 花多少，通胀和复利共同决定你能积累多少
- **体验**：每一年你有多享受这一年的人生

---

## 总分公式

$$
L = \\sum_{t=t_0}^{T_{\\max}} P(t) \\cdot V(t)
$$

- **t**：年龄；**t₀** = 你当前年龄；**T_max** = 100
- **P(t)**：在 t₀ 已存活的条件下，活到 t 岁的概率（用中国年龄别死亡率构造）
- **V(t)**：t 岁那年的"单年体验值"

也就是：每一年的体验，按"还能活到那年"的概率加权，求和。

---

## 单年体验 V(t)

$$
V(t) = f(t) \\cdot \\prod_j \\mu_j(t) \\cdot \\big( \\sum_j \\varepsilon_j(t) \\big) \\cdot \\text{wealthPenalty}
$$

- **f(t)**：年龄基线体验能力。倒 U 形——0 岁 ≈ 0.5，30 岁峰值 1.0，
  60 岁 ≈ 0.78，100 岁 ≈ 0.20
- **μ_j(t)**：事件 j 的乘性影响（如：好婚姻 +5~12%，自住房 +3%，
  上学毕业后 +10%）
- **ε_j(t)**：事件 j 的加性体验贡献
- **wealthPenalty**：财富透支时的惩罚因子（M < 0 时 < 1）

---

## 金钱 → 体验饱和函数

任何"消费类"事件的体验贡献遵循同一个饱和规律：

$$
g(\\text{spend}) = \\begin{cases}
\\dfrac{\\text{spend}}{B} - 1 & \\text{spend} < B \\\\[6pt]
2.14 \\cdot \\big( 1 - e^{-(\\text{spend}/B - 1) / 5} \\big) & \\text{spend} \\geq B
\\end{cases}
$$

其中 **B** 是你设置的"年基础生存费"（基础生活门槛）。

特性：

- spend = 0：体验 -1（吃不饱穿不暖）
- spend = B：体验 0（温饱中性）
- spend = 10·B：体验 ≈ 1.85（85% 饱和）
- spend → ∞：体验上限 2.14

直观说法：**花钱到 10 倍温饱线后，再花 10 倍也只多一点点体验**。

---

## 时间预算与冲突

每天 24 小时是硬约束。每个事件都报告自己占用的小时数。

- 累加 = dedicated 总时长
- 剩余 = **生活时间** = max(0, 24 - dedicated)
- 冲突时：crowding = dedicated / 24，所有事件产出按 1/crowding 打折

**生活时间因子**：8 小时 leisure 是"满足生活"的参考点，少于此体验缩水。

---

## 优先级

钱花光的时候，谁先被砍？

1. **生存**（最高）：基础生存费必须保证
2. **工作 / 婚姻 / 生娃 / 买房 / 旅行 等承诺类**（中）：照常执行
3. **生活**（最低）：当年钱不够时，生活预算自动被砍到 0；如仍不够才透支并计入财富惩罚

---

## 死亡概率分布

不直接用"死亡数量"，而是用 **q(x)（年龄别死亡率）** 构造生命表：

$$
\\ell_{x+1} = \\ell_x \\cdot (1 - q(x))
$$

条件死亡分布 d(t) = (ℓ(t) - ℓ(t+1)) / ℓ(t₀)，
P(t) = Σ_{i ≥ t} d(i)。

**男女差异**：男性死亡率 × 1.35，女性 × 0.75（对应中国 6 年寿命差距）。

---

## 设计原则

- **不预设道德判断**：不写"婚姻自动延寿""生娃自动延寿"这类先入为主的关联
- **所有花费的体验贡献都遵循同一饱和函数**，避免某一事件被过度奖励
- **拖动即看见**：每次参数调整 ≤ 16ms 更新所有曲线，反馈即时
- **可设可改**：通胀率 / 投资收益 / 基础生存费 / 各事件参数 都用户可调
- **数据本地**：所有信息只存在你的浏览器 localStorage，不上传

---

## 免责声明

本工具基于统计建模，仅作思考辅助，不构成任何投资 / 医疗 / 婚恋建议。

数据：中国 2018-2020 年龄别死亡率估算 + 一线城市生活成本估算。
`

export default function AboutModal({ open, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-900/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-lift max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-7 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-xl font-semibold tracking-tight">关于人生曲线</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-ink p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <article className="px-7 py-6 markdown-doc">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
            {ABOUT_DOC}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  )
}
