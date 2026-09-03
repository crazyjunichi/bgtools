import { useTranslation } from 'react-i18next'
import { dateTimeText } from './format'
import { gameLabel } from './label'
import { MatchChips } from './MatchChips'
import type { Match } from './types'

type Props = {
  match: Match
  /**
   * 覆盖标题与图标。缺省按 `gameId` 查游戏目录（[gameLabel](label.ts)）；
   * 计分纸传自己的模板身份 —— 「通用空白」那种局按模板显示才对得上桌上那张纸
   */
  identity?: { name: string; icon: string | null }
  onOpen: () => void
}

/**
 * 历史列表里的一局，**整块是按钮**。计分纸的历史与统计页的「按时间」共用它，
 * 所以行里只读 [Match](types.ts) 契约，不碰任何工具的 `payload`
 * （细则要等点进详情、加载那个工具的视图才出来）。
 */
export function MatchRow({ match, identity, onOpen }: Props) {
  const { t } = useTranslation()
  const { name, icon } = identity ?? gameLabel(t, match.gameId)
  const date = dateTimeText(match.endAt)

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('match.open', { date, name })}
      className="btn-base shrink-0 flex-col !items-stretch gap-2 border border-line bg-surface-2 px-3 py-2 short:!min-h-11"
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-baseline gap-2">
          {icon !== null && <span aria-hidden>{icon}</span>}
          <span className="truncate text-base font-semibold">{name}</span>
        </span>
        <span className="shrink-0 text-xs tabular-nums text-text-dim">{date}</span>
      </span>

      <MatchChips players={match.players} />

      {match.note !== undefined && (
        <span className="truncate text-left text-xs text-text-muted">{match.note}</span>
      )}
    </button>
  )
}
