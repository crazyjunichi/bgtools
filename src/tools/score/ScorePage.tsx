import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buzz } from '../../shared/haptics'
import { useWakeLock } from '../../shared/hooks/useWakeLock'
import { SeatPicker } from '../../shared/players/SeatPicker'
import { resolveSeat, takenPlayerIds } from '../../shared/players/seats'
import { usePlayersStore } from '../../shared/players/store'
import { ScoreBar } from './ScoreBar'
import { ScoreGrid } from './ScoreGrid'
import { ScoreHistory } from './ScoreHistory'
import { ScoreSettings } from './ScoreSettings'
import { SeatSheet } from './SeatSheet'
import { totalOf, useScoreStore } from './store'

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

  const [overlay, setOverlay] = useState<Panel | null>(null)

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
     * 这个工具**故意不套 [ToolLayout]**：它的左栏是 minmax(17rem, 24%)，横屏下要吃掉近
     * 280px，而卡片网格的每张卡都靠那点宽度把合计数字撑到 74px。全局操作只有五个按钮，
     * 装不满一整栏 —— 所以网格吃满整宽，操作压成 80px 窄条。
     * 朝向判据仍只用 wide（横屏右栏 / 竖屏贴底），不引入宽度断点。
     */
    <div className="flex h-full min-h-0 flex-col gap-3 wide:flex-row short:gap-2">
      {views.length === 0 ? (
        <div className="card flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center wide:min-w-0">
          <span className="text-5xl" aria-hidden>
            🧮
          </span>
          <span className="max-w-md text-base leading-relaxed text-text-muted">
            {t('tools.score.empty')}
          </span>
        </div>
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
        <ScoreSettings onNewGame={newGame} onClose={() => setOverlay(null)} />
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
