import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconExpand } from '../../shared/icons'
import { gameLabel } from '../../shared/match/label'
import { PLAYER_DOT } from '../../shared/players/colors'
import { winRate, type PlayerRow } from './aggregate'

type Props = {
  rows: PlayerRow[]
}

/** 没有胜负结论时的占位。破折号而非 0%：那两者必须看得出区别 */
const DASH = '—'

/**
 * 按人一行，点行就地展开这人的分游戏拆分（可同时展开多人对比）。
 * **均分只出现在展开层** —— 跨游戏的分数不是一个量纲，主行不平均。
 */
export function PlayerList({ rows }: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())

  const toggle = (playerId: string) =>
    setExpanded((cur) => {
      const next = new Set(cur)
      if (next.has(playerId)) next.delete(playerId)
      else next.add(playerId)
      return next
    })

  return (
    <>
      {rows.map((row) => {
        const rate = winRate(row)
        const open = expanded.has(row.playerId)
        return (
          <div key={row.playerId} className="shrink-0">
            <button
              type="button"
              onClick={() => toggle(row.playerId)}
              aria-expanded={open}
              aria-label={t('tools.stats.openPlayer', { name: row.name })}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-3 text-sm transition-transform duration-75 active:scale-[0.98]"
            >
              <span className="flex min-w-0 items-center gap-2">
                <IconExpand
                  className={`size-4 shrink-0 text-text-dim transition-transform duration-75 ${open ? 'rotate-90' : ''}`}
                  aria-hidden
                />
                {/* 玩家色允许被两人共用，所以名字必须同框 */}
                <span className={`size-3 shrink-0 rounded-full ${PLAYER_DOT[row.color]}`} aria-hidden />
                <span className="truncate font-semibold">{row.name}</span>
              </span>
              <span className="flex shrink-0 items-baseline gap-2">
                <span className="text-xs tabular-nums text-text-dim">
                  {t('tools.stats.gameCount', { n: row.games })} ·{' '}
                  {t('tools.stats.winCount', { n: row.wins })}
                </span>
                {/* 定宽让各行的胜率对齐成一列 */}
                <span className="w-12 text-right font-mono text-base tabular-nums">
                  {rate === null ? DASH : `${rate}%`}
                </span>
              </span>
            </button>

            {open && (
              // 左缘竖线标出「属于上面那行」，比缩进更醒目
              <div className="ml-6 flex flex-col gap-0.5 border-l-2 border-line py-1.5 pl-3">
                {row.byGame.map((split) => {
                  const { name, icon } = gameLabel(t, split.gameId)
                  const splitRate = winRate(split)
                  return (
                    <span
                      key={split.gameId ?? ''}
                      className="flex items-baseline gap-2 px-1 py-1 text-xs"
                    >
                      <span className="flex min-w-0 items-baseline gap-1.5">
                        {icon !== null && <span aria-hidden>{icon}</span>}
                        <span className="truncate text-sm font-semibold">{name}</span>
                      </span>
                      <span className="ml-auto flex shrink-0 items-baseline gap-2 tabular-nums text-text-dim">
                        <span>
                          {t('tools.stats.gameCount', { n: split.games })} ·{' '}
                          {t('tools.stats.winCount', { n: split.wins })}
                          {splitRate !== null && ` · ${splitRate}%`}
                        </span>
                        {split.avgScore !== null && (
                          <span className="font-mono">
                            {t('tools.stats.avg', { score: split.avgScore.toFixed(1) })}
                          </span>
                        )}
                      </span>
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
