import { useTranslation } from 'react-i18next'
import type { MatchDraft } from '../../shared/match/types'
import { readSheetPayload } from './payload'
import { SheetGrid } from './SheetGrid'
import { entriesOf } from './store'

type Props = { match: MatchDraft }

/** 框高只设上限：内容少就收成自然高，条目多才在框内纵滚；受约束的是高度，所以是 vh 不是 vmin（见 CLAUDE.md 的判据 C） */
const GRID_BOX = 'flex max-h-[min(26rem,48vh)] flex-col short:max-h-[min(14rem,42vh)]'

/**
 * 一局计分纸的细则视图（[MatchTool.Detail](../../shared/match/detail.ts)）：
 * 反解 payload → 复算条目 → 喂给**只读态的当前局矩阵**，桌上不用重新认一套界面。
 *
 * 反解不出来只显示一句说明：那是别的版本写下的局面，回看不该因此整块空掉。
 */
export function SheetDetail({ match }: Props) {
  const { t } = useTranslation()
  const payload = readSheetPayload(match.payload)

  if (payload === null) {
    return (
      <span className="px-1 py-2 text-sm leading-relaxed text-text-muted">
        {t('match.detail.unreadable')}
      </span>
    )
  }

  const entries = entriesOf(payload.templateId, payload.customEntries, payload.overrides)
  return (
    <div className={GRID_BOX}>
      <SheetGrid
        readOnly
        // 那一晚的名字与色就该固定住，不跟着名单后来的改动变，所以不走 resolveSeat
        seats={payload.seats.map((s) => ({ ...s, linked: false }))}
        entries={entries}
        cells={payload.cells}
      />
    </div>
  )
}
