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
      className={`btn-base px-5 text-base ${
        // 深底上 rose-500 + 白字只有 3.75:1，靠 600 档 + 加粗补足
        armed ? 'bg-rose-600 font-bold text-white' : 'bg-surface-2 text-text'
      } ${className ?? ''}`}
    >
      {armed ? confirmText : children}
    </button>
  )
}
