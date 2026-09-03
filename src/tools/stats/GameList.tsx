import { useTranslation } from 'react-i18next'
import { IconCrown } from '../../shared/icons'
import { durationText } from '../../shared/match/format'
import { gameLabel } from '../../shared/match/label'
import { PLAYER_DOT } from '../../shared/players/colors'
import type { GameRow } from './aggregate'

type Props = { rows: GameRow[] }

/**
 * 按盒一行。**不是按钮** —— 一盒游戏没有比这三个数更细的下钻内容，
 * 做成可点的会让人以为里面还有东西。
 */
export function GameList({ rows }: Props) {
  const { t } = useTranslation()

  return (
    <>
      {rows.map((row) => {
        const { name, icon } = gameLabel(t, row.gameId)
        return (
          <div
            key={row.gameId ?? ''}
            className="flex shrink-0 flex-col gap-1 rounded-xl border border-line bg-surface-2 px-3 py-2"
          >
            <span className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-baseline gap-2">
                {icon !== null && <span aria-hidden>{icon}</span>}
                <span className="truncate text-base font-semibold">{name}</span>
              </span>
              <span className="shrink-0 font-mono text-base tabular-nums">
                {t('tools.stats.gameCount', { n: row.games })}
              </span>
            </span>

            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-dim">
              {row.avgMs !== null && (
                <span className="tabular-nums">
                  {t('tools.stats.avgTime', { time: durationText(t, row.avgMs) })}
                </span>
              )}
              {row.topWinner === null ? (
                <span>{t('tools.stats.noWinner')}</span>
              ) : (
                <span className="flex min-w-0 items-center gap-1">
                  <IconCrown className="size-3.5 shrink-0" aria-hidden />
                  <span
                    className={`size-2.5 shrink-0 rounded-full ${PLAYER_DOT[row.topWinner.color]}`}
                    aria-hidden
                  />
                  <span className="max-w-24 truncate">{row.topWinner.name}</span>
                  <span className="tabular-nums">
                    {t('tools.stats.winCount', { n: row.topWinner.wins })}
                  </span>
                </span>
              )}
            </span>
          </div>
        )
      })}
    </>
  )
}
