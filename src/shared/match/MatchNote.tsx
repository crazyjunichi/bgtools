import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FIELD } from '../components/fieldStyle'
import { useArchiveStore } from './archive'
import type { Match } from './types'

/** 与历史列表一行放得下对齐，超出直接截断 —— 桌上没人想看校验提示 */
export const NOTE_MAX = 60

/**
 * 回看时补一句备注。**写盘落在 blur**（每敲一个字都 put 一次太重），
 * 所以外层要给 `key={match.id}`，换了记录才会重新取初值。
 *
 * 旧存档（legacy）不给入口：它躺在旧表里，put 进新表会变成两条。
 */
export function MatchNote({ match }: { match: Match }) {
  const { t } = useTranslation()
  const setNote = useArchiveStore((s) => s.setNote)
  const [text, setText] = useState(match.note ?? '')

  if (match.legacy) return null

  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value.slice(0, NOTE_MAX))}
      onBlur={() => {
        if (text !== (match.note ?? '')) void setNote(match.id, text.trim())
      }}
      placeholder={t('match.notePlaceholder')}
      aria-label={t('match.note')}
      className={FIELD}
    />
  )
}
