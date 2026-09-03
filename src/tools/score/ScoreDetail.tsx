import { useTranslation } from 'react-i18next'
import type { MatchDraft } from '../../shared/match/types'
import { ScoreRounds } from './ScoreRounds'
import { readScorePayload } from './store'

type Props = { match: MatchDraft }

/** 矩阵框高只设上限：轮数少就收，多了才纵滚；受约束的是高度，所以是 vh 不是 vmin（见 CLAUDE.md 的判据 C） */
const BOX = 'max-h-[min(26rem,48vh)] short:max-h-[min(14rem,42vh)]'

/**
 * 一局多轮计分的细则视图（[MatchTool.Detail](../../shared/match/detail.ts)）：
 * 逐轮矩阵与进行中那张**同一个组件**，回看不用重新认一套界面。
 *
 * 反解不出来只显示一句说明：那是别的版本写下的局面，回看不该因此整块空掉。
 */
export function ScoreDetail({ match }: Props) {
  const { t } = useTranslation()
  const payload = readScorePayload(match.payload)

  if (payload === null) {
    return (
      <span className="px-1 py-2 text-sm leading-relaxed text-text-muted">
        {t('match.detail.unreadable')}
      </span>
    )
  }

  return (
    <ScoreRounds seats={payload.seats} rounds={payload.rounds} draft={payload.draft} box={BOX} />
  )
}
