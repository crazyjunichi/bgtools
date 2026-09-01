import { ToolLayout } from '../../shared/components/ToolLayout'
import { useWakeLock } from '../../shared/hooks/useWakeLock'
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
      panel={
        <>
          <LifeBar lives={lives} onChange={setLives} />
          <SettingsPopover
            players={players}
            started={started}
            onSetPlayers={setPlayers}
            onDeal={dealEquipment}
            onReset={resetGame}
          />
        </>
      }
    >
      {/* 拆弹与道具并排：道具吃满右侧栏宽，描述才能整行读完 */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <WireGrid wires={wires} onCycle={cycleWire} />
        <EquipmentList hand={hand} onCycle={cycleEquip} />
      </div>
    </ToolLayout>
  )
}
