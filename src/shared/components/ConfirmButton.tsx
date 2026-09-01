import { useEffect, useRef, useState } from 'react'
import { buzz } from '../haptics'

type Props = {
  onConfirm: () => void
  children: React.ReactNode
  confirmText?: string
  className?: string
}

const RESET_DELAY = 2500

/** 二次确认按钮。清零/重置类操作在桌上极易误触，必须点两次 */
export function ConfirmButton({ onConfirm, children, confirmText = '确认？', className }: Props) {
  const [armed, setArmed] = useState(false)
  const timer = useRef<number>(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const handle = () => {
    if (armed) {
      window.clearTimeout(timer.current)
      setArmed(false)
      buzz([10, 40, 10])
      onConfirm()
      return
    }
    setArmed(true)
    timer.current = window.setTimeout(() => setArmed(false), RESET_DELAY)
  }

  return (
    <button
      type="button"
      onClick={handle}
      className={`rounded-xl px-4 py-2.5 text-sm font-medium transition active:scale-95 ${
        armed ? 'bg-rose-500 text-white' : 'bg-surface-2 text-slate-300'
      } ${className ?? ''}`}
    >
      {armed ? confirmText : children}
    </button>
  )
}
