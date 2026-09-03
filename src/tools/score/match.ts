import type { TFunction } from 'i18next'
import { IconCsv } from '../../shared/icons'
import type { MatchExport, MatchTool } from '../../shared/match/detail'
import { toCsv } from '../../shared/match/share/csv'
import type { MatchDraft } from '../../shared/match/types'
import { ScoreDetail } from './ScoreDetail'
import { readScorePayload, totalOf, type ScorePayload } from './store'

/**
 * 多轮计分把自己记的一局导出去的形态（契约见 [MatchExport](../../shared/match/detail.ts)）。
 * 逐轮明细的 PNG 还没有 —— 逐轮表的宽度随轮数无上限，排版另说，先只给 CSV。
 */

/**
 * 一行一轮 + 末行合计。**数字用 `String` 而非 [signed](store.ts)**：
 * Excel 不认 U+2212 的负号，那一列会整列被当成文本。
 *
 * 没动过的格子留空而不是 0：那两者在表里必须看得出区别（同屏幕上的 `·`）。
 */
function scoreCsv(g: ScorePayload, t: TFunction): string {
  const cell = (v: number | undefined) => (v === undefined ? '' : String(v))
  return toCsv([
    [t('tools.score.roundCol'), ...g.seats.map((s) => s.name)],
    ...g.rounds.map((r, i) => [String(i + 1), ...g.seats.map((s) => cell(r.delta[s.id]))]),
    // 那一晚没来得及封档的最后一轮：它已经算进合计，表里也得有
    ...(Object.values(g.draft).some((v) => v !== 0)
      ? [[t('tools.score.thisRound'), ...g.seats.map((s) => cell(g.draft[s.id]))]]
      : []),
    [t('tools.score.total'), ...g.seats.map((s) => String(totalOf(g.rounds, g.draft, s.id)))],
  ])
}

/** 反解不出来就抛：面板会显示一句「这局出不了这种形式」，战绩榜仍然出得来 */
function payloadOf(m: MatchDraft): ScorePayload {
  const payload = readScorePayload(m.payload)
  if (payload === null) throw new Error('score payload unreadable')
  return payload
}

export const scoreExports: readonly MatchExport[] = [
  {
    id: 'csv',
    nameKey: 'match.share.forms.csv',
    icon: IconCsv,
    ext: 'csv',
    // 表格与外观无关，palette 用不上
    build: async (m, _p, t) =>
      new Blob([scoreCsv(payloadOf(m), t)], { type: 'text/csv;charset=utf-8' }),
  },
]

export const matchTool: MatchTool = { Detail: ScoreDetail, exports: scoreExports }
