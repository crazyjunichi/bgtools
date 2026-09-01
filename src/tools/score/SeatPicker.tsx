import { useTranslation } from 'react-i18next'
import { useQuickUI } from '../../quick/store'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { buzz } from '../../shared/haptics'
import { IconDelete, IconPlayers } from '../../shared/icons'
import { PLAYER_DOT, PLAYER_SOFT } from '../../shared/players/colors'
import type { Player } from '../../shared/players/store'
import { ScoreOverlay } from './ScoreOverlay'
import type { SeatView } from './store'

type Props = {
  seat: SeatView
  players: Player[]
  /** 已被别的席位占用的 playerId：一个人不该同时占两列 */
  taken: Set<string>
  onPick: (player: Player | null) => void
  /** 连这一列的历史分数一起删，所以要二次确认 */
  onRemove: () => void
  onClose: () => void
}

/**
 * 给一列换人，从调分浮层（[SeatSheet]）的底部入口进来。
 *
 * 工具里不重复实现改名/配色（那是顶栏 👥 的事），这里只做"关联到名单里的谁"，
 * 底部留一个跳过去的入口。关闭一律直接回表格 —— 遮罩点击期望的是全关而非退一层。
 */
export function SeatPicker({ seat, players, taken, onPick, onRemove, onClose }: Props) {
  const { t } = useTranslation()
  const openTool = useQuickUI((s) => s.openTool)
  const available = players.filter((p) => !taken.has(p.id))

  return (
    <ScoreOverlay
      onClose={onClose}
      title={
        <span className="flex flex-col gap-0.5">
          <span className="text-lg font-semibold">{t('tools.score.pick.title')}</span>
          <span className="truncate font-mono text-sm text-text-dim">
            {t('tools.score.pick.current', { name: seat.name })}
          </span>
        </span>
      }
    >
      <div className="flex flex-col gap-2">
        <span className="section-label">{t('tools.score.pick.available')}</span>
        {available.length === 0 ? (
          <span className="rounded-xl border border-line bg-surface-2 p-3 text-sm leading-relaxed text-text-muted">
            {t(
              players.length === 0
                ? 'tools.score.pick.emptyRoster'
                : 'tools.score.pick.allSeated',
            )}
          </span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {available.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onPick(p)
                  buzz()
                  onClose()
                }}
                className={`btn-base min-w-28 flex-1 gap-2 border px-3 text-base short:!min-h-11 short:text-sm ${
                  PLAYER_SOFT[p.color]
                }`}
              >
                <span className={`size-3 shrink-0 rounded-full ${PLAYER_DOT[p.color]}`} aria-hidden />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 解除关联不丢分数，所以不必二次确认 */}
      {seat.linked && (
        <button
          type="button"
          onClick={() => {
            onPick(null)
            onClose()
          }}
          className="btn-quiet px-4 text-base short:!min-h-11"
        >
          {t('tools.score.pick.unlink')}
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          openTool('players')
          onClose()
        }}
        className="btn-quiet gap-2 px-4 text-base short:!min-h-11"
      >
        <IconPlayers className="size-5" aria-hidden />
        {t('tools.score.pick.manage')}
      </button>

      {/* 席位的删除收在这里而不是控制栏：低频、且会连历史一起删，防误触优先于顺手 */}
      <ConfirmButton
        onConfirm={() => {
          onRemove()
          onClose()
        }}
        confirmText={t('tools.score.pick.confirmRemove')}
        className="!min-h-12 gap-2 !text-sm"
      >
        <IconDelete className="size-5" aria-hidden />
        {t('tools.score.pick.remove')}
      </ConfirmButton>
    </ScoreOverlay>
  )
}
