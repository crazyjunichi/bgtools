import { Split } from '../../shared/components/Split'
import { ToolLayout } from '../../shared/components/ToolLayout'
import { useWakeLock } from '../../shared/hooks/useWakeLock'
import { BoardActions } from './BoardActions'
import { EquipmentList } from './EquipmentList'
import { LifeBar } from './LifeBar'
import { SettingsPopover } from './SettingsPopover'
import { WireGrid } from './WireGrid'
import { useBombBustersStore } from './store'

export default function BombBustersPage() {
  // 整局都摊在桌上给全员看，不能息屏
  useWakeLock()

  const {
    players,
    lives,
    wires,
    hand,
    setPlayers,
    setLives,
    cycleWire,
    cycleEquip,
    dealEquipment,
    resetGame,
  } = useBombBustersStore()

  const started = lives !== players || wires.some((w) => w !== 0) || hand.some((c) => c.state !== 0)

  return (
    <ToolLayout
      // 左栏只有一个生命读数 + 几个入口，撑不满默认档；省下的宽度给拆弹区与装备区
      panelWidth="narrow"
      panel={
        /* 竖屏控制栏通栏贴底，生命卡与按钮组并排才不会吃掉过多高度；
           横屏走 `contents` 让三块回到 aside 的纵向流里（BoardActions 的 mt-auto 才有锚点） */
        <div className="flex items-center gap-3 wide:contents">
          <LifeBar lives={lives} onChange={setLives} />
          <div className="flex min-w-0 flex-1 flex-col gap-3 wide:contents">
            {/* 横屏下快捷键与设置入口一起沉到栏底（BoardActions 的 mt-auto 推动其后的兄弟节点） */}
            <BoardActions onDeal={dealEquipment} onReset={resetGame} />
            <SettingsPopover players={players} started={started} onSetPlayers={setPlayers} />
          </div>
        </div>
      }
    >
      {/* 横屏并排（装备吃满右侧栏宽，描述才能整行读完）；竖屏改成拆弹在上、装备在下。
          竖屏用 autoFirst：12 格的高度有上限，再高也只是把编号撑大，余量给装备列表更值 */}
      <Split ratio="majorFirst" stack="autoFirst">
        <WireGrid wires={wires} onCycle={cycleWire} />
        <EquipmentList hand={hand} onCycle={cycleEquip} />
      </Split>
    </ToolLayout>
  )
}
