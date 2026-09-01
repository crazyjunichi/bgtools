import { useEffect, useRef, useState } from 'react'
import { buzz } from '../haptics'

type Props = {
  onConfirm: () => void
  children: React.ReactNode
  confirmText?: string
  className?: string
  /** 禁用时同时撤掉已武装状态，免得解禁后还留着一个"再点就执行"的按钮 */
  disabled?: boolean
}

const RESET_DELAY = 2500

/** 二次确认按钮。清零/重置类操作在桌上极易误触，必须点两次 */
export function ConfirmButton({
  onConfirm,
  children,
  confirmText = '确认？',
  className,
  disabled,
}: Props) {
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
      disabled={disabled}
      // gap-2 给「图标 + 文字」的 children 留间距；armed 态只有纯文字，是 no-op
      className={`btn-base gap-2 px-5 text-base short:!min-h-11 ${
        // 深底上 rose-500 + 白字只有 3.75:1，靠 600 档 + 加粗补足
        armed && !disabled ? 'bg-rose-600 font-bold text-white' : 'bg-surface-2 text-text'
      } ${className ?? ''}`}
    >
      {armed && !disabled ? confirmText : children}
    </button>
  )
}
