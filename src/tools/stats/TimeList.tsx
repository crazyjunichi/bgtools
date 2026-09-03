import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MatchRow } from '../../shared/match/MatchRow'
import type { Match } from '../../shared/match/types'

type Props = {
  /** 已按 endAt 倒序（存档镜像本来就是），**含旧存档** —— 回看不该漏掉它们 */
  matches: readonly Match[]
  onOpen: (id: string) => void
}

/** 一次最多渲染多少条。读盘不慢，卡的是 DOM —— 攒了一年之后列表得能滚得动 */
const PAGE = 50

/** 按时间倒序的全部对局，所有工具混在一起 —— 「那晚那局」只记得是什么时候打的 */
export function TimeList({ matches, onOpen }: Props) {
  const { t } = useTranslation()
  const [showAll, setShowAll] = useState(false)
  const rows = showAll ? matches : matches.slice(0, PAGE)

  return (
    <>
      {rows.map((m) => (
        <MatchRow key={m.id} match={m} onOpen={() => onOpen(m.id)} />
      ))}

      {!showAll && matches.length > PAGE && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="btn-quiet shrink-0 text-sm short:!min-h-11"
        >
          {t('tools.stats.more')}
        </button>
      )}
    </>
  )
}
