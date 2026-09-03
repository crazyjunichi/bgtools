import { useTranslation } from 'react-i18next'
import { durationText } from '../../shared/match/format'
import { gameLabel } from '../../shared/match/label'
import { PLAYER_DOT } from '../../shared/players/colors'
import type { Overview } from './aggregate'

/**
 * 页面顶部的概览。同一组数据两种形态：
 * - `cards`：竖屏的 3 列小卡网格（随页面滚走）
 * - `rows`：横屏左栏的紧凑 label:value 行（常显）
 * 一处数据两处排版，不要拆成两个组件各算一遍。
 */
export function OverviewCards({ sum, layout }: { sum: Overview; layout: 'cards' | 'rows' }) {
  const { t } = useTranslation()
  const topGame = sum.topGame === null ? null : gameLabel(t, sum.topGame.gameId)

  const items: { label: string; value: React.ReactNode }[] = [
    { label: t('tools.stats.totalGames'), value: String(sum.games) },
    { label: t('tools.stats.totalTime'), value: durationText(t, sum.totalMs) },
    { label: t('tools.stats.gameKinds'), value: String(sum.gameKinds) },
    { label: t('tools.stats.recent7'), value: t('tools.stats.gameCount', { n: sum.recent7 }) },
    { label: t('tools.stats.recent30'), value: t('tools.stats.gameCount', { n: sum.recent30 }) },
    {
      label: t('tools.stats.topGame'),
      value:
        topGame === null || sum.topGame === null ? (
          '—'
        ) : (
          <span className="flex min-w-0 items-baseline justify-end gap-1.5">
            {topGame.icon !== null && <span aria-hidden>{topGame.icon}</span>}
            <span className="truncate">{topGame.name}</span>
            <span className="shrink-0 text-xs tabular-nums text-text-dim">
              {t('tools.stats.gameCount', { n: sum.topGame.games })}
            </span>
          </span>
        ),
    },
    {
      label: t('tools.stats.topPlayer'),
      value:
        sum.topPlayer === null ? (
          '—'
        ) : (
          <span className="flex min-w-0 items-baseline justify-end gap-1.5">
            {/* 玩家色允许两人共用，名字必须同框 */}
            <span
              className={`size-2.5 shrink-0 self-center rounded-full ${PLAYER_DOT[sum.topPlayer.color]}`}
              aria-hidden
            />
            <span className="truncate">{sum.topPlayer.name}</span>
            <span className="shrink-0 text-xs tabular-nums text-text-dim">
              {t('tools.stats.gameCount', { n: sum.topPlayer.games })}
            </span>
          </span>
        ),
    },
  ]

  if (layout === 'rows') {
    return (
      <div className="flex flex-col gap-1">
        <span className="section-label">{t('tools.stats.overview')}</span>
        {items.map((item) => (
          <span key={item.label} className="flex items-baseline justify-between gap-2 py-0.5">
            <span className="shrink-0 text-sm text-text-muted">{item.label}</span>
            <span className="min-w-0 font-mono text-sm tabular-nums">{item.value}</span>
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item, i) => (
        <div
          key={item.label}
          // 两张文本卡（最常玩 / 最活跃）内容是名字不是数字，小格放不下，各占整行
          className={`flex flex-col justify-center gap-0.5 rounded-xl border border-line bg-surface px-3 py-2 ${
            i >= 5 ? 'col-span-3' : ''
          }`}
        >
          <span className="text-xs text-text-dim">{item.label}</span>
          <span
            className={`min-w-0 truncate font-mono tabular-nums ${i >= 5 ? 'text-sm' : 'text-base'}`}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}
