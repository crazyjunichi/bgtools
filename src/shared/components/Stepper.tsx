import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { buzz } from '../haptics'
import { IconMinus, IconPlus } from '../icons'

type Props = {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  /** 数字区域尺寸，计分板用 lg，参数调节用 sm */
  size?: 'sm' | 'lg'
  /** 显示格式化，如把秒数显示成 m:ss。不传就直接显示数字 */
  format?: (value: number) => string
}

const HOLD_DELAY = 400
const HOLD_INTERVAL = 90

/**
 * 大号 +/- 数字步进器，支持长按连续增减（计分板加十分不该点十次）。
 * 触控目标不低于矮屏档下限，见 docs/DESIGN.md §3。
 */
export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  size = 'sm',
  format,
}: Props) {
  const { t } = useTranslation()
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

  // size-11 单给 w/h 不够：btn-base 里的 min-h-14 会顶着不缩，必须一起压
  const btn = 'btn-quiet size-14 shrink-0 short:!min-h-11 short:size-11'
  const icon = 'size-7 short:size-6'

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="section-label">{label}</span>}
      <div className="flex items-center gap-3 short:gap-2">
        <button
          type="button"
          className={btn}
          disabled={atMin}
          aria-label={t('stepper.decrease')}
          onPointerDown={() => startHold(-1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          <IconMinus className={icon} aria-hidden />
        </button>
        <span
          className={`flex-1 text-center font-mono tabular-nums ${
            size === 'lg' ? 'text-data font-bold' : 'text-3xl font-semibold short:text-2xl'
          }`}
        >
          {format ? format(value) : value}
        </span>
        <button
          type="button"
          className={btn}
          disabled={atMax}
          aria-label={t('stepper.increase')}
          onPointerDown={() => startHold(1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          <IconPlus className={icon} aria-hidden />
        </button>
      </div>
    </div>
  )
}
