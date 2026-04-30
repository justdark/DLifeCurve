import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  /** 小数位数 */
  digits?: number
  /** 单位/前缀/后缀 */
  prefix?: string
  suffix?: string
  /** 动画时长 ms */
  duration?: number
  /** 升降染色 */
  flash?: boolean
  className?: string
}

/**
 * 数字过渡动画 + 升降染色
 */
export default function AnimatedNumber({
  value,
  digits = 1,
  prefix = '',
  suffix = '',
  duration = 200,
  flash = true,
  className = '',
}: Props) {
  const [display, setDisplay] = useState(value)
  const [direction, setDirection] = useState<'up' | 'down' | null>(null)
  const fromRef = useRef(value)
  const toRef = useRef(value)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef(0)

  useEffect(() => {
    if (toRef.current === value) return
    fromRef.current = display
    toRef.current = value
    startRef.current = performance.now()

    let flashTimer: ReturnType<typeof setTimeout> | null = null
    if (flash) {
      const dir = value > display ? 'up' : value < display ? 'down' : null
      setDirection(dir)
      if (dir) {
        flashTimer = setTimeout(() => setDirection(null), 600)
      }
    }

    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const v = fromRef.current + (toRef.current - fromRef.current) * eased
      setDisplay(v)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (flashTimer) clearTimeout(flashTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, flash])

  return (
    <span
      className={`tabular-nums ${
        direction === 'up' ? 'flash-up' : direction === 'down' ? 'flash-down' : ''
      } ${className}`}
    >
      {prefix}
      {display.toFixed(digits)}
      {suffix}
    </span>
  )
}
