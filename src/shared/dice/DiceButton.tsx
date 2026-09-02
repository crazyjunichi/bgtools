import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconDice } from '../icons'
import { DiceOverlay } from './DiceOverlay'
import { useDiceStore } from './store'

type Props = {
  /** 这盒游戏的骰组 id（见 [presets.ts](presets.ts)） */
  setId: string
  className?: string
}

/**
 * 游戏页里的骰子入口。自己管开关，把骰组切到本盒游戏 ——
 * 工具页只要摆一个这个按钮就有完整的骰子界面。
 *
 * 关闭走 Overlay 自己的 onClick（规范：会让自己消失的元素不许用 onPointerDown）。
 */
export function DiceButton({ setId, className }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const setSet = useDiceStore((s) => s.setSet)

  // 挂载即预取 3D 块：按下按钮时 three.js 早已到位，浮层不会先空一下
  useEffect(() => {
    void import('./dice3d/DiceCanvas')
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSet(setId)
          setOpen(true)
        }}
        aria-label={t('dice.pool.open')}
        className={`btn-base bg-amber-400 text-ink ${className ?? ''}`}
      >
        <IconDice className="size-6 short:size-5" aria-hidden />
      </button>
      {open && <DiceOverlay onClose={() => setOpen(false)} />}
    </>
  )
}
