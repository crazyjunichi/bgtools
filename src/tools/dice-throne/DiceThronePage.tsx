import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { ToolLayout } from '../../shared/components/ToolLayout'
import { buzz } from '../../shared/haptics'
import { useWakeLock } from '../../shared/hooks/useWakeLock'
import { IconCheck, IconPlayerAdd, IconReset } from '../../shared/icons'
import { useActiveMatch } from '../../shared/match/active'
import { MatchFinish } from '../../shared/match/MatchFinish'
import type { MatchDraft } from '../../shared/match/types'
import { SeatPicker } from '../../shared/players/SeatPicker'
import { resolveSeat, takenPlayerIds } from '../../shared/players/seats'
import { SeatStart } from '../../shared/players/SeatStart'
import { usePlayersStore } from '../../shared/players/store'
import { diceThroneMeta } from './meta'
import { SeatPanel } from './SeatPanel'
import { ThroneCard } from './ThroneCard'
import { throneMatchDraft, useThroneStore, type ThroneSeatView } from './store'

/** 卡片网格的列数档：1v1 上下对拼（横屏左右对峙），人多才起多列。显式映射，不拼类名 */
const GRID = {
  duel: 'grid-cols-1 wide:grid-cols-2',
  few: 'grid-cols-2',
  many: 'grid-cols-2 wide:grid-cols-3',
} as const

/**
 * 王权骰铸对决面板。只替代繁琐配件：血量转盘、CP 转盘、状态 token ——
 * 不掷骰（实物定制骰是这游戏的核心手感），不做任何规则结算。
 * 面板是只读的全员公开信息，点卡进单人编辑浮层。
 */
export default function DiceThronePage() {
  // 整局摊在桌上给全员看，不能息屏
  useWakeLock()
  const { t } = useTranslation()

  const { seats, seatPlayers, addSeat, removeSeat, bindPlayer, renameSeat, newGame } =
    useThroneStore()
  const players = usePlayersStore((s) => s.players)

  /** 正在编辑的席位 id；换人面板叠在它之上 */
  const [editing, setEditing] = useState<string | null>(null)
  const [picking, setPicking] = useState<string | null>(null)
  /** 结算面板要处理的那一局：开面板那一刻快照（endAt 是最后改数值的时刻，不是现在） */
  const [finish, setFinish] = useState<MatchDraft | null>(null)

  // 顶栏 quick（随机点人）靠这层镜像知道这局谁在打；它是派生镜像，真源在本工具 store
  useEffect(() => {
    useActiveMatch
      .getState()
      .set({ toolId: diceThroneMeta.id, gameId: diceThroneMeta.id, seats })
  }, [seats])
  useEffect(() => () => useActiveMatch.getState().clear(), [])

  // resolveSeat 在后：名单里的名字/色要盖过快照（resolveSeat 的语义就是"名单优先"）
  const views: ThroneSeatView[] = seats.map((s) => ({ ...s, ...resolveSeat(s, players) }))
  const editView = editing ? views.find((v) => v.id === editing) : undefined
  const pickView = picking ? views.find((v) => v.id === picking) : undefined

  const grid =
    views.length <= 2 ? GRID.duel : views.length <= 4 ? GRID.few : GRID.many

  return (
    <ToolLayout
      panel={
        <div className="flex gap-3 wide:flex-col">
          <button
            type="button"
            disabled={views.length === 0}
            onClick={() => setFinish(throneMatchDraft())}
            className="btn-base flex-1 gap-2 bg-emerald-400 text-base font-bold text-ink disabled:bg-surface-2 disabled:text-text-dim"
          >
            <IconCheck className="size-6 short:size-5" aria-hidden />
            {t('tools.diceThrone.finish')}
          </button>
          <button
            type="button"
            onClick={() => {
              addSeat()
              buzz(20)
            }}
            className="btn-base flex-1 gap-2 bg-surface-2 text-base"
          >
            <IconPlayerAdd className="size-6 short:size-5" aria-hidden />
            {t('tools.diceThrone.addSeat')}
          </button>
          <ConfirmButton
            onConfirm={newGame}
            disabled={views.length === 0}
            confirmText={t('tools.diceThrone.confirmNewGame')}
            className="flex-1"
          >
            <IconReset className="size-6 short:size-5" aria-hidden />
            {t('tools.diceThrone.newGame')}
          </ConfirmButton>
        </div>
      }
    >
      {views.length === 0 ? (
        <SeatStart onSeat={seatPlayers} />
      ) : (
        <div className={`grid min-h-0 flex-1 auto-rows-fr gap-3 short:gap-2 ${grid}`}>
          {views.map((seat) => (
            <ThroneCard key={seat.id} seat={seat} onOpen={() => setEditing(seat.id)} />
          ))}
        </div>
      )}

      {editView && !pickView && (
        <SeatPanel
          seat={editView}
          onEditSeat={() => setPicking(editView.id)}
          onRemove={() => removeSeat(editView.id)}
          onClose={() => setEditing(null)}
        />
      )}

      {pickView && (
        <SeatPicker
          seat={pickView}
          players={players}
          taken={takenPlayerIds(seats)}
          onPick={(player) => bindPlayer(pickView.id, player)}
          onRenameSeat={(name) => renameSeat(pickView.id, name)}
          onRemove={() => {
            removeSeat(pickView.id)
            setPicking(null)
            setEditing(null)
          }}
          removeText={t('tools.diceThrone.remove')}
          confirmRemoveText={t('tools.diceThrone.confirmRemove')}
          // SeatPicker 的约定是关掉就回主区，不退回上一层浮层
          onClose={() => {
            setPicking(null)
            setEditing(null)
          }}
        />
      )}

      {finish && (
        <MatchFinish
          draft={finish}
          onDone={() => {
            newGame()
            setFinish(null)
          }}
          onClose={() => setFinish(null)}
        />
      )}
    </ToolLayout>
  )
}
