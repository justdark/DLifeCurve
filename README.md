# 人生曲线 · Life Curve

一个把"人生"建模成数学曲线的工具。输入个人画像和人生事件，
系统按概率与体验函数算出你这一辈子的"期望体验总分"，并把过程可视化。

> 拖动事件参数，实时看见人生总分与各曲线的变化。

## 功能

- 🎯 **完整的 Onboarding**：4 步收集画像（出生年份、收入、生存费、健康、偏好）
- 📊 **6 张实时曲线**：期望体验、生存概率、财富、体验率、时间分配、年度现金流
  - 默认显示 4 张，左右滑动可见更多
  - 每张图都可点击放大，展开后显示各事件分解
- ⚙️ **13 类预设事件**：生存 / 睡觉 / 生活 / 上学 / 工作 / 结婚 / 生娃 / 买房 / 环球旅行 / 锻炼 / 创业 / 兴趣爱好 / 重大疾病 / 公益志愿
- 🎨 **自定义事件**：用曲线编辑器画出你自己的人生事件
- ✨ **双击滑块**自动找让总分最高的参数值
- 💸 **金钱→体验饱和函数**：花钱到 10 倍温饱线后，再多花也接近饱和
- ⏰ **时间预算与冲突**：每天 24 小时硬约束，超出按比例打折
- 📈 **真实死亡率模型**：基于中国 2018-2020 年龄别死亡率，男女分布
- 🎭 **情绪反馈**：数字 tween + 升降染色 + 实时反事实差值
- 💾 **本地持久化**：所有数据仅存 localStorage，不上传

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 跑模型单测
npm run build    # 生产构建
```

## 技术栈

- **React 18 + TypeScript + Vite** — UI 框架
- **Tailwind CSS** — 样式
- **ECharts** — 图表（含放大模态、堆叠区域、双轴等）
- **Zustand** — 状态管理
- **react-markdown + KaTeX** — 公式文档渲染
- **Vitest** — 单元测试

## 模型核心

### 总分公式

$$
L = \sum_{t=t_0}^{T_{\max}} P(t) \cdot V(t)
$$

每一年的体验，按"还能活到那年"的概率加权，求和。

### 单年体验 V(t)

$$
V(t) = f(t) \cdot \prod_j \mu_j(t) \cdot \big(\sum_j \varepsilon_j(t)\big) \cdot \text{wealthPenalty}
$$

- **f(t)**：年龄基线体验能力（倒 U 形，30 岁峰值 1.0）
- **μ_j(t)**：事件乘性影响（婚姻、自住房、上学）
- **ε_j(t)**：事件加性贡献（含金钱→体验饱和函数）
- **wealthPenalty**：财富透支时的惩罚因子

### 金钱→体验饱和函数

$$
g(\text{spend}) = \begin{cases}
\dfrac{\text{spend}}{B} - 1 & \text{spend} < B \\
2.14 \cdot (1 - e^{-(\text{spend}/B - 1)/5}) & \text{spend} \geq B
\end{cases}
$$

10× 温饱线 → 体验 ≈ 1.85（85% 饱和）；上限 2.14。

## 项目结构

```
src/
├── data/                # 死亡率 / 工资曲线 / 体验函数
├── model/               # 类型 / 14 类事件 / simulator / counterfactual
│   └── events/
├── store/               # Zustand: profile / scenario / ui / death-table
├── hooks/               # useSimulation / useAutoOptimize / useCounterfactual
├── pages/
│   ├── Onboarding/      # 4 步流程
│   └── Main/
│       ├── Charts/      # 6 张图 + 放大模态
│       ├── EventDrawer  # 事件参数抽屉（产品的"心跳"）
│       ├── ScoreHeader  # 顶部总分 banner
│       ├── EventTimeline # 甘特图
│       ├── BottomCurve  # 底部装饰 V(t) 曲线
│       └── AboutModal   # 关于人生曲线（含 Markdown + KaTeX）
├── components/          # AnimatedNumber / Slider / CurveEditor 等
└── lib/                 # localStorage 持久化封装
```

## 设计原则

- **不预设道德判断**：不写"婚姻自动延寿""生娃自动延寿"等先入为主的关联
- **所有花费的体验贡献都遵循同一饱和函数**：避免某事件被过度奖励
- **拖动即看见**：每次参数调整 ≤ 16ms 更新所有曲线，反馈即时
- **可设可改**：通胀率 / 投资收益 / 基础生存费 / 各事件参数 都用户可调
- **数据本地**：所有信息只存浏览器 localStorage，不上传

## 数据来源

- 中国 2018-2020 年龄别死亡率（NBS / WHO 数据估算）
- 一线城市生活成本估算（2024-2025）

## 免责声明

本工具基于统计建模，仅作思考辅助，**不构成任何投资 / 医疗 / 婚恋建议**。

## 灵感

模型设计参考了飞书文档《人生曲线分析》中的数学建模思路。

## License

MIT
