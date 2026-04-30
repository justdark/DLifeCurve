interface Props {
  onNext: () => void
}

export default function Step1Welcome({ onNext }: Props) {
  return (
    <div className="card p-8 sm:p-10 text-center animate-in fade-in">
      <div className="text-5xl mb-5">📈</div>

      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2 leading-tight">
        人生在世，体验为先
      </h1>
      <p className="text-base text-slate-500 mb-2">
        人生曲线 · Life Curve
      </p>

      <div className="my-7 px-2">
        <p className="text-slate-600 leading-relaxed">
          人生是一道<span className="font-semibold text-ink">权衡题</span>
          <br />
          时间、金钱、体验，三者难以兼得
        </p>
        <p className="text-slate-600 leading-relaxed mt-3">
          这个工具用数学和概率帮你把每个选择拆开看清
          <br className="hidden sm:block" />
          让你<span className="font-semibold text-ink">理性地最大化</span>这一生的体验总分
        </p>
      </div>

      <DemoCurve />

      <button
        onClick={onNext}
        className="btn-primary w-full mt-6 py-3 text-base"
        autoFocus
      >
        开始 →
      </button>
      <p className="text-xs text-slate-400 mt-4">
        全程约 30 秒 · 数据仅存于本机浏览器
      </p>
    </div>
  )
}

function DemoCurve() {
  // 一条小小的示意曲线
  return (
    <div className="h-32 my-4 flex items-end justify-center">
      <svg width="100%" height="120" viewBox="0 0 400 120" className="overflow-visible">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9B72CF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#9B72CF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 100 Q50 50, 120 40 T240 30 T360 60 L400 80 L400 120 L0 120 Z"
          fill="url(#g1)"
        />
        <path
          d="M0 100 Q50 50, 120 40 T240 30 T360 60 L400 80"
          stroke="#9B72CF"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  )
}
