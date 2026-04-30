interface Props {
  onNext: () => void
}

export default function Step1Welcome({ onNext }: Props) {
  return (
    <div className="card p-10 text-center animate-in fade-in">
      <div className="text-5xl mb-6">📈</div>
      <h1 className="text-3xl font-semibold tracking-tight mb-3">
        你的人生，可以模拟
      </h1>
      <p className="text-slate-500 mb-8 leading-relaxed">
        基于你的画像与人生选择，
        <br />
        实时计算属于你的"人生总体验"曲线。
        <br />
        拖动每一个事件，立刻看到对结果的影响。
      </p>

      <DemoCurve />

      <button
        onClick={onNext}
        className="btn-primary w-full mt-8"
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
