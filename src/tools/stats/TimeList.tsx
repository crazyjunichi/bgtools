import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconCrown } from '../../shared/icons'
import { dayText, durationText, timeText } from '../../shared/match/format'
import { gameLabel } from '../../shared/match/label'
import type { Match } from '../../shared/match/types'
import { PLAYER_DOT } from '../../shared/players/colors'

type Props = {
  /** 已按 endAt 倒序（存档镜像本来就是），**含旧存档** —— 回看不该漏掉它们 */
  matches: readonly Match[]
  onOpen: (id: string) => void
}

/** 一次最多渲染多少条。读盘不慢，卡的是 DOM —— 攒了一年之后列表得能滚得动 */
const PAGE = 50

/**
 * 按时间倒序的全部对局，按天分组、日期头吸顶，行内带赢家 ——
 * 「那晚那局谁赢了」是这条列表最高频的问题，不该点进详情才看到。
 *
 * 不共用 [MatchRow](../../shared/match/MatchRow.tsx)：那是计分纸历史的大触控行，
 * 这里是阅读页的紧凑行，两种密度揉不进同一个组件。
 */
export function TimeList({ matches, onOpen }: Props) {
  const { t } = useTranslation()
  const [showAll, setShowAll] = useState(false)
  const rows = showAll ? matches : matches.slice(0, PAGE)

  // matches 已按 endAt 倒序，相邻同天即同组，一趟扫完
  const groups: { day: string; items: Match[] }[] = []
  for (const m of rows) {
    const day = dayText(m.endAt)
    const last = groups[groups.length - 1]
    if (last !== undefined && last.day === day) last.items.push(m)
    else groups.push({ day, items: [m] })
  }

  return (
    <>
      {groups.map((group) => (
        <div key={group.day} className="flex shrink-0 flex-col gap-1.5">
          {/* top-13 = 吸顶 tab 的总高（见 StatsPage 的 StatsNav 注释）；
              横屏下 tab 在左栏、本列表自己滚，日期头吸自己顶（top-0） */}
          <h3 className="sticky top-13 z-10 bg-canvas py-1 text-xs font-semibold text-text-dim wide:top-0">
            {group.day}
          </h3>

          {group.items.map((m) => {
            const { name, icon } = gameLabel(t, m.gameId)
            const winners = m.players.filter((p) => p.outcome === 'win')
            const spent = m.endAt - m.startedAt
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onOpen(m.id)}
                aria-label={t('match.open', { date: dayText(m.endAt), name })}
                className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 text-sm transition-transform duration-75 active:scale-[0.98]"
              >
                <span className="w-11 shrink-0 text-left font-mono text-xs tabular-nums text-text-dim">
                  {timeText(m.endAt)}
                </span>
                {icon !== null && <span aria-hidden>{icon}</span>}
                <span className="min-w-0 truncate font-semibold">{name}</span>

                <span className="ml-auto flex shrink-0 items-center gap-2 text-xs tabular-nums text-text-dim">
                  {winners.length > 0 && (
                    <span className="flex min-w-0 items-center gap-1 text-text-muted">
                      <IconCrown className="size-3.5 shrink-0" aria-hidden />
                      {/* 玩家色允许两人共用，名字必须同框 */}
                      <span
                        className={`size-2.5 shrink-0 rounded-full ${PLAYER_DOT[winners[0].color]}`}
                        aria-hidden
                      />
                      <span className="max-w-20 truncate">{winners[0].name}</span>
                      {winners.length > 1 && <span>+{winners.length - 1}</span>}
                    </span>
                  )}
                  {/* 旧局没记开局时刻，时长会是 0，那就不显示 */}
                  {spent > 0 && <span>{durationText(t, spent)}</span>}
                </span>
              </button>
            )
          })}
        </div>
      ))}

      {!showAll && matches.length > PAGE && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="btn-quiet min-h-11 shrink-0 text-sm"
        >
          {t('tools.stats.more')}
        </button>
      )}
    </>
  )
}
