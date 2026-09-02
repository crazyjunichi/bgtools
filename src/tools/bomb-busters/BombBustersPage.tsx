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
        <>
          <LifeBar lives={lives} onChange={setLives} />
          {/* 快捷键与设置入口一起沉到栏底（BoardActions 的 mt-auto 推动其后的兄弟节点） */}
          <BoardActions onDeal={dealEquipment} onReset={resetGame} />
          <SettingsPopover players={players} started={started} onSetPlayers={setPlayers} />
        </>
      }
    >
      {/* 横屏并排（装备吃满右侧栏宽，描述才能整行读完）；竖屏自动改成拆弹在上、装备在下 */}
      <Split ratio="majorFirst">
        <WireGrid wires={wires} onCycle={cycleWire} />
        <EquipmentList hand={hand} onCycle={cycleEquip} />
      </Split>
    </ToolLayout>
  )
}
