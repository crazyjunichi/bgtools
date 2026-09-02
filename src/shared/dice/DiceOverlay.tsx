import { useTranslation } from 'react-i18next'
import { Overlay } from '../components/Overlay'
import { DiceControls } from './DiceControls'
import { DiceStage } from './DiceStage'
import { findDiceSet } from './presets'
import { useDiceStore } from './store'

/**
 * 骰子界面的浮层形态，给「骰子只是这盒游戏里的一个动作」的工具页用
 * （入口见 [DiceButton](DiceButton.tsx)）。骰子就是游戏本体的那种直接把
 * [DiceControls](DiceControls.tsx) + [DiceStage](DiceStage.tsx) 摆进 ToolLayout。
 */
export function DiceOverlay({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const set = findDiceSet(useDiceStore((s) => s.setId))

  return (
    <Overlay
      title={<span className="text-lg font-bold text-text">{set ? t(set.nameKey) : ''}</span>}
      maxWidth="max-w-3xl"
      onClose={onClose}
    >
      {/* 朝向只决定排列轴。竖屏控制块下沉贴拇指，DOM 顺序保持控制块在前 */}
      <div className="flex flex-col gap-4 short:gap-2 wide:flex-row">
        <div className="order-2 flex shrink-0 flex-col wide:order-1 wide:w-56">
          <DiceControls />
        </div>
        {/* 弹性块的高度下限用 vmin：竖屏下 vh 取长边会把整块撑出屏幕 */}
        <div className="order-1 flex min-h-[min(26rem,58vmin)] min-w-0 flex-1 flex-col wide:order-2">
          <DiceStage />
        </div>
      </div>
    </Overlay>
  )
}
