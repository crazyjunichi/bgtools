import { useTranslation } from 'react-i18next'
import type { MatchDraft } from '../../shared/match/types'
import { PLAYER_DOT } from '../../shared/players/colors'
import { readThronePayload } from './store'
import { StatusChips } from './ThroneCard'

/**
 * 一局王权骰铸的细则视图：散场那一刻的血线、CP 与挂着的状态。
 *
 * 反解不出来只显示一句说明：那是别的版本写下的局面，回看不该因此整块空掉。
 */
export function ThroneDetail({ match }: { match: MatchDraft }) {
  const { t } = useTranslation()
  const payload = readThronePayload(match.payload)

  if (payload === null) {
    return (
      <span className="px-1 py-2 text-sm leading-relaxed text-text-muted">
        {t('match.detail.unreadable')}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {payload.seats.map((s) => (
        <div
          key={s.id}
          className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface-2 p-3"
        >
          <span className="flex items-center gap-2 text-base font-semibold text-text">
            <span className={`size-3 shrink-0 rounded-full ${PLAYER_DOT[s.color]}`} aria-hidden />
            <span className="truncate">{s.name}</span>
          </span>
          <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-text-muted">
            <span>
              {t('tools.diceThrone.hp')}{' '}
              <span className="font-mono font-bold tabular-nums text-text">{s.hp}</span>
            </span>
            <span>
              {t('tools.diceThrone.cp')}{' '}
              <span className="font-mono font-bold tabular-nums text-text">{s.cp}</span>
            </span>
          </span>
          <StatusChips statuses={s.statuses} />
        </div>
      ))}
    </div>
  )
}
