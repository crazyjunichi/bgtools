import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buzz } from '../../shared/haptics'
import { useWakeLock } from '../../shared/hooks/useWakeLock'
import { useActiveMatch } from '../../shared/match/active'
import { MatchFinish } from '../../shared/match/MatchFinish'
import type { MatchDraft } from '../../shared/match/types'
import { SeatPicker } from '../../shared/players/SeatPicker'
import { resolveSeat, takenPlayerIds } from '../../shared/players/seats'
import { SeatStart } from '../../shared/players/SeatStart'
import { usePlayersStore } from '../../shared/players/store'
import { scoreExports } from './match'
import { scoreMeta } from './meta'
import { ScoreBar } from './ScoreBar'
import { ScoreGrid } from './ScoreGrid'
import { ScoreHistory } from './ScoreHistory'
import { ScoreSettings } from './ScoreSettings'
import { SeatSheet } from './SeatSheet'
import { scoreMatchDraft, totalOf, useScoreStore } from './store'

/** 同一时刻只开一个浮层：调分 → 需要时切到换人；局面与完整记录各算一种 */
type Panel =
  | { kind: 'score' | 'pick'; seatId: string }
  | { kind: 'settings' }
  | { kind: 'history' }

export default function ScorePage() {
  // 整局摊在桌上给全员看，不能息屏
  useWakeLock()
  const { t } = useTranslation()

  const {
    seats,
    rounds,
    draft,
    undoStack,
    addSeat,
    seatPlayers,
    removeSeat,
    bindPlayer,
    renameSeat,
    bump,
    setDelta,
    nextRound,
    undo,
    newGame,
  } = useScoreStore()
  const players = usePlayersStore((s) => s.players)

  /*
   * 顶栏的 quick 小工具看不见工具页内部的席位，靠这层镜像拿到「这一局谁在打」
   * （见 [active](../../shared/match/active.ts)）。用 getState 而不是订阅 setter：
   * 依赖里只剩真正会变的东西，不会因为 store 引用变化而反复写
   */
  useEffect(() => {
    useActiveMatch.getState().set({ toolId: scoreMeta.id, gameId: null, seats })
  }, [seats])
  useEffect(() => () => useActiveMatch.getState().clear(), [])

  const [overlay, setOverlay] = useState<Panel | null>(null)
  /**
   * 结算面板要处理的那一局。**不算 Panel** —— 它是收尾浮层关掉之后才出现的下一步，
   * 而且开面板那一刻就得把局面快照下来（`endAt` 是最后加分的时刻，不是现在）
   */
  const [finish, setFinish] = useState<MatchDraft | null>(null)

  const views = seats.map((s) => resolveSeat(s, players))
  // 席位被移除后浮层自然消失，不必用 effect 回写 overlay
  const active =
    overlay && (overlay.kind === 'score' || overlay.kind === 'pick')
      ? views.find((v) => v.id === overlay.seatId)
      : undefined

  const taken = takenPlayerIds(seats)
  const scoredCount = seats.filter((s) => (draft[s.id] ?? 0) !== 0).length

  return (
    /*
     * 这个工具**故意不套 [ToolLayout]**：全局操作只有五个按钮，装不满它的左栏，
     * 而卡片网格的每张卡都靠那点宽度把合计数字撑大 —— 所以网格吃满整宽，操作压成窄条。
     * 这是 DESIGN.md §5 登记过的「窄条变体」，新工具别照抄。
     * 朝向判据仍只用 wide（横屏右栏 / 竖屏贴底），不引入宽度断点。
     */
    <div className="flex h-full min-h-0 flex-col gap-3 wide:flex-row short:gap-2">
      {views.length === 0 ? (
        <SeatStart
          icon={scoreMeta.icon}
          hint={t('tools.score.empty')}
          onSeat={seatPlayers}
          onAddTemp={addSeat}
        />
      ) : (
        <ScoreGrid
          seats={views}
          rounds={rounds}
          draft={draft}
          onOpenSeat={(seatId) => setOverlay({ kind: 'score', seatId })}
        />
      )}

      <ScoreBar
        canNextRound={scoredCount > 0}
        canUndo={undoStack.length > 0}
        onAddSeat={() => {
          addSeat()
          buzz(20)
        }}
        onNextRound={() => {
          nextRound()
          buzz([10, 30])
        }}
        onUndo={undo}
        onOpenHistory={() => setOverlay({ kind: 'history' })}
        onOpenSettings={() => setOverlay({ kind: 'settings' })}
      />

      {overlay?.kind === 'settings' && (
        <ScoreSettings
          canFinish={views.length > 0 && (rounds.length > 0 || scoredCount > 0)}
          onFinish={() => setFinish(scoreMatchDraft())}
          onNewGame={newGame}
          onClose={() => setOverlay(null)}
        />
      )}

      {finish && (
        <MatchFinish
          draft={finish}
          exports={scoreExports}
          onDone={() => {
            newGame()
            setFinish(null)
          }}
          onClose={() => setFinish(null)}
        />
      )}

      {overlay?.kind === 'history' && (
        <ScoreHistory
          seats={views}
          rounds={rounds}
          draft={draft}
          onClose={() => setOverlay(null)}
        />
      )}

      {active && overlay?.kind === 'score' && (
        <SeatSheet
          seat={active}
          delta={draft[active.id] ?? 0}
          total={totalOf(rounds, draft, active.id)}
          onBump={(amount) => bump(active.id, amount)}
          onSetDelta={(delta) => setDelta(active.id, delta)}
          onEditSeat={() => setOverlay({ kind: 'pick', seatId: active.id })}
          onRemove={() => removeSeat(active.id)}
          onClose={() => setOverlay(null)}
        />
      )}

      {active && overlay?.kind === 'pick' && (
        <SeatPicker
          seat={active}
          players={players}
          taken={taken}
          onPick={(player) => bindPlayer(active.id, player)}
          onRenameSeat={(name) => renameSeat(active.id, name)}
          onRemove={() => removeSeat(active.id)}
          removeText={t('tools.score.sheet.remove')}
          confirmRemoveText={t('tools.score.sheet.confirmRemove')}
          onClose={() => setOverlay(null)}
        />
      )}
    </div>
  )
}
