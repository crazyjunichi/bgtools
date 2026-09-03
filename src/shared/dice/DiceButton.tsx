import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconDice } from '../icons'
import { prefetchDiceCanvas } from './dice3d/lazy'
import { DiceOverlay } from './DiceOverlay'
import { findDiceSet } from './presets'

type Props = {
  /** 要打开哪套骰组（见 [presets.ts](presets.ts)） */
  setId: string
  className?: string
}

/**
 * 游戏页里的骰子入口，自己管开关 —— 工具页摆一个这个按钮就有完整的骰子界面。
 * 一盒游戏有两套骰（资源骰 / 战斗骰）就摆两个，各自的局面在 store 里分开存。
 *
 * 关闭走 Overlay 自己的 onClick（规范：会让自己消失的元素不许用 onPointerDown）。
 */
export function DiceButton({ setId, className }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const set = findDiceSet(setId)

  // 挂载即预取 3D 块，按下按钮时 three 已到位
  useEffect(prefetchDiceCanvas, [])

  if (!set) return null
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        // 带上骰组名：同一页上可能有两个骰子入口，图标本身分不出是哪套
        aria-label={t('dice.pool.open', { name: t(set.nameKey) })}
        className={`btn-base bg-amber-400 text-ink ${className ?? ''}`}
      >
        <IconDice className="size-6 short:size-5" aria-hidden />
      </button>
      {open && <DiceOverlay setId={setId} onClose={() => setOpen(false)} />}
    </>
  )
}
