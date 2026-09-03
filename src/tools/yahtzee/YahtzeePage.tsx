import { DiceControls } from '../../shared/dice/DiceControls'
import { DiceStage } from '../../shared/dice/DiceStage'
import { ToolLayout } from '../../shared/components/ToolLayout'
import { useWakeLock } from '../../shared/hooks/useWakeLock'

const SET_ID = 'yahtzee'

/**
 * 快艇骰子。骰子就是游戏本体，所以直接把骰子界面摆进 ToolLayout
 * （不走 [DiceButton](../../shared/dice/DiceButton.tsx) 那种浮层入口）。
 *
 * 状态全在 [shared/dice/store](../../shared/dice/store.ts)，页面自己不持有 ——
 * 也因此这里没有 store.ts。**不内建计分与 1/3、2/3 的回合投掷次数**：
 * 那是游戏规则，通用骰子组件不管；桌上的计分交给计分纸。
 */
export default function YahtzeePage() {
  // 整局都摊在桌上按「重掷」，不能息屏
  useWakeLock()

  return (
    <ToolLayout panel={<DiceControls setId={SET_ID} />}>
      <DiceStage setId={SET_ID} />
    </ToolLayout>
  )
}
