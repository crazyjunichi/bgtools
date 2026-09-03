import { useTranslation } from 'react-i18next'
import { IconCrown } from '../../shared/icons'
import { durationText } from '../../shared/match/format'
import { gameLabel } from '../../shared/match/label'
import { PLAYER_DOT } from '../../shared/players/colors'
import type { GameRow } from './aggregate'

type Props = { rows: GameRow[] }

/**
 * 按盒一行。**不是按钮** —— 一盒游戏没有比这几个数更细的下钻内容，
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
            className="flex min-h-11 shrink-0 flex-wrap items-center gap-x-3 gap-y-0.5 rounded-xl border border-line bg-surface-2 px-3 py-1.5"
          >
            <span className="flex min-w-0 items-baseline gap-2">
              {icon !== null && <span aria-hidden>{icon}</span>}
              <span className="truncate text-sm font-semibold">{name}</span>
            </span>

            <span className="ml-auto flex shrink-0 items-center gap-3 text-xs tabular-nums text-text-dim">
              <span className="font-mono text-sm text-text">
                {t('tools.stats.gameCount', { n: row.games })}
              </span>
              {row.avgMs !== null && (
                <span>{t('tools.stats.avgTime', { time: durationText(t, row.avgMs) })}</span>
              )}
              {row.topWinner === null ? (
                <span>{t('tools.stats.noWinner')}</span>
              ) : (
                <span className="flex min-w-0 items-center gap-1">
                  <IconCrown className="size-3.5 shrink-0" aria-hidden />
                  {/* 玩家色允许两人共用，名字必须同框 */}
                  <span
                    className={`size-2.5 shrink-0 rounded-full ${PLAYER_DOT[row.topWinner.color]}`}
                    aria-hidden
                  />
                  <span className="max-w-20 truncate">{row.topWinner.name}</span>
                  <span>{t('tools.stats.winCount', { n: row.topWinner.wins })}</span>
                </span>
              )}
            </span>
          </div>
        )
      })}
    </>
  )
}
