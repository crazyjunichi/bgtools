import { useTranslation } from 'react-i18next'
import { PLAYER_DOT } from '../../shared/players/colors'
import { winRate, type PlayerRow } from './aggregate'

type Props = {
  rows: PlayerRow[]
  onOpen: (playerId: string) => void
}

/** 没有胜负结论时的占位。破折号而非 0%：那两者在桌上必须看得出区别 */
const DASH = '—'

/** 按人一行，点开看他各盒游戏拆开的战绩 */
export function PlayerList({ rows, onOpen }: Props) {
  const { t } = useTranslation()

  return (
    <>
      {rows.map((row) => {
        const rate = winRate(row)
        return (
          <button
            key={row.playerId}
            type="button"
            onClick={() => onOpen(row.playerId)}
            aria-label={t('tools.stats.openPlayer', { name: row.name })}
            className="btn-base w-full shrink-0 justify-between gap-3 border border-line bg-surface-2 px-3 text-base short:!min-h-11"
          >
            {/* 玩家色允许被两人共用，所以名字必须同框 */}
            <span className="flex min-w-0 items-center gap-3">
              <span className={`size-3 shrink-0 rounded-full ${PLAYER_DOT[row.color]}`} aria-hidden />
              <span className="truncate font-semibold">{row.name}</span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
              <span className="text-xs tabular-nums text-text-dim">
                {t('tools.stats.gameCount', { n: row.games })} ·{' '}
                {t('tools.stats.winCount', { n: row.wins })}
              </span>
              {/* 定宽让各行的胜率对齐成一列 */}
              <span className="w-14 text-right font-mono text-lg tabular-nums">
                {rate === null ? DASH : `${rate}%`}
              </span>
            </span>
          </button>
        )
      })}
    </>
  )
}
