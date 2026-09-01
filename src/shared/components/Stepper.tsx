import { useCallback, useEffect, useRef } from 'react'
import { buzz } from '../haptics'

type Props = {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  /** 数字区域尺寸，计分板用 lg，参数调节用 sm */
  size?: 'sm' | 'lg'
}

const HOLD_DELAY = 400
const HOLD_INTERVAL = 90

/**
 * 大号 +/- 数字步进器。触控目标 ≥ 44px，支持长按连续增减
 * （计分板一次加 10 分不该点 10 次）。
 */
export function Stepper({ value, onChange, min, max, step = 1, label, size = 'sm' }: Props) {
  const timers = useRef<{ delay?: number; repeat?: number }>({})

  const clamp = useCallback(
    (n: number) => {
      if (min !== undefined && n < min) return min
      if (max !== undefined && n > max) return max
      return n
    },
    [min, max],
  )

  const stopHold = useCallback(() => {
    window.clearTimeout(timers.current.delay)
    window.clearInterval(timers.current.repeat)
    timers.current = {}
  }, [])

  useEffect(() => stopHold, [stopHold])

  const startHold = (dir: 1 | -1) => {
    // 在闭包内自行累积：长按期间父组件的 value 更新可能滞后于 interval
    let acc = value
    const bump = () => {
      const next = clamp(acc + dir * step)
      if (next === acc) return false
      acc = next
      onChange(next)
      return true
    }

    if (bump()) buzz()
    timers.current.delay = window.setTimeout(() => {
      timers.current.repeat = window.setInterval(() => {
        if (!bump()) stopHold()
      }, HOLD_INTERVAL)
    }, HOLD_DELAY)
  }

  const atMin = min !== undefined && value <= min
  const atMax = max !== undefined && value >= max

  const btn =
    'flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-2xl font-semibold text-slate-200 transition active:scale-95 disabled:opacity-30'

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-medium text-slate-400">{label}</span>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={btn}
          disabled={atMin}
          aria-label="减少"
          onPointerDown={() => startHold(-1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          −
        </button>
        <span
          className={`flex-1 text-center font-mono tabular-nums ${
            size === 'lg' ? 'text-6xl font-bold' : 'text-3xl font-semibold'
          }`}
        >
          {value}
        </span>
        <button
          type="button"
          className={btn}
          disabled={atMax}
          aria-label="增加"
          onPointerDown={() => startHold(1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          +
        </button>
      </div>
    </div>
  )
}
