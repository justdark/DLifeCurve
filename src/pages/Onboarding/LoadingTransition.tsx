import { useEffect, useState } from 'react'

const TIPS = [
  '🎯 财富曲线：看你这辈子的钱怎么走',
  '💚 生存概率：基于真实统计数据，你能活到多少岁的可能性',
  '✨ 体验曲线：每一年你过得有多丰盛',
  '📈 累积人生分：你的所有快乐加在一起是多少',
]

export default function LoadingTransition() {
  const [tipIdx, setTipIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 700)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="card p-12 text-center">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-4 border-ink border-t-transparent animate-spin" />
      </div>
      <h3 className="text-xl font-medium mb-2">正在为你生成人生模型…</h3>
      <p className="text-slate-500 text-sm transition-opacity duration-300" key={tipIdx}>
        {TIPS[tipIdx]}
      </p>
    </div>
  )
}
