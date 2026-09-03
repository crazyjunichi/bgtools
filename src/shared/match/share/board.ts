import type { TFunction } from 'i18next'
import type { PlayerColor } from '../../players/colors'
import { dateTimeText } from '../format'
import { gameLabel } from '../label'
import type { MatchDraft } from '../types'

/**
 * 战绩榜要画的全部东西 —— 身份两行 + 一列人 + 一列总分。
 *
 * 工具自己的导出中间态（如 [SheetSnapshot](../../../tools/score-sheet/snapshot.ts)）
 * 都是它的**结构超集**，所以那些工具直接把自己的快照喂进 [renderRank](rank.ts) 即可，
 * 不必先降级成 `RankBoard`。
 */
export type RankBoard = {
  title: string
  icon: string
  dateText: string
  /** 那一局的席位**快照**：名字与色都是当时存下来的，不跟着名单后来的改动变 */
  seats: { name: string; color: PlayerColor }[]
  totals: number[]
  /**
   * 第一名的分数，用来标记领先者。**并列第一时这几个人都算**；
   * 全场同分或只有一人时为 null —— 人人有等于没有
   */
  bestTotal: number | null
}

/**
 * 从一条 Match 现算战绩榜。给已归档的局用（工具的完整局面在 `payload` 里，
 * 但战绩榜只要名次那几个数，不必反解）。
 *
 * **没有分数的局也照出**（合作制、旧存档）：`totals` 全 0 时 `bestTotal` 是 null，
 * 榜单退化成一份带色条的名单 —— 比直接不给图有用。
 */
export function boardFromMatch(m: MatchDraft, t: TFunction): RankBoard {
  const identity = gameLabel(t, m.gameId)
  const totals = m.players.map((p) => p.score ?? 0)
  const best = Math.max(...totals, 0)

  return {
    title: identity.name,
    icon: identity.icon ?? '',
    dateText: dateTimeText(m.endAt),
    seats: m.players.map((p) => ({ name: p.name, color: p.color })),
    totals,
    bestTotal: totals.some((v) => v !== best) && m.players.length > 1 ? best : null,
  }
}
