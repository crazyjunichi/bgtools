import { useTranslation } from 'react-i18next'
import { Overlay } from '../../shared/components/Overlay'
import { PLAYER_DOT } from '../../shared/players/colors'
import { winRate, type PlayerRow } from './aggregate'
import { gameLabel } from './label'

type Props = { row: PlayerRow; onClose: () => void }

/** 一个人的战绩按盒拆开。**均分只出现在这一层** —— 跨游戏的分数不是一个量纲 */
export function PlayerDetail({ row, onClose }: Props) {
  const { t } = useTranslation()
  const rate = winRate(row)

  return (
    <Overlay
      title={
        <span className="flex min-w-0 flex-col">
          <span className="flex min-w-0 items-center gap-2">
            <span className={`size-3 shrink-0 rounded-full ${PLAYER_DOT[row.color]}`} aria-hidden />
            <span className="truncate text-lg font-bold">{row.name}</span>
          </span>
          <span className="truncate text-xs tabular-nums text-text-dim">
            {t('tools.stats.gameCount', { n: row.games })} ·{' '}
            {t('tools.stats.winCount', { n: row.wins })}
            {rate !== null && ` · ${t('tools.stats.rate', { n: rate })}`}
          </span>
        </span>
      }
      onClose={onClose}
    >
      <div className="flex flex-col gap-2">
        <span className="section-label">{t('tools.stats.byGame')}</span>
        {/* 列表自己滚：受约束的是高度，所以是 vh */}
        <div className="flex max-h-[52vh] flex-col gap-2 overflow-y-auto short:max-h-[40vh]">
          {row.byGame.map((split) => {
            const { name, icon } = gameLabel(t, split.gameId)
            const splitRate = winRate(split)
            return (
              <div
                key={split.gameId ?? ''}
                className="flex shrink-0 flex-col gap-1 rounded-xl border border-line bg-surface-2 px-3 py-2"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-baseline gap-2">
                    {icon !== null && <span aria-hidden>{icon}</span>}
                    <span className="truncate text-base font-semibold">{name}</span>
                  </span>
                  <span className="shrink-0 font-mono text-base tabular-nums">
                    {t('tools.stats.gameCount', { n: split.games })}
                  </span>
                </span>
                <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums text-text-dim">
                  <span>{t('tools.stats.winCount', { n: split.wins })}</span>
                  {splitRate !== null && <span>{t('tools.stats.rate', { n: splitRate })}</span>}
                  {split.avgScore !== null && (
                    <span>{t('tools.stats.avg', { score: split.avgScore.toFixed(1) })}</span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Overlay>
  )
}
