import type { TFunction } from 'i18next'
import { IconCsv, IconImage } from '../../shared/icons'
import type { MatchExport, MatchTool } from '../../shared/match/detail'
import { durationText } from '../../shared/match/format'
import { gameLabel } from '../../shared/match/label'
import type { MatchDraft } from '../../shared/match/types'
import { readSheetPayload } from './payload'
import { renderMatrix, renderTransposed } from './png/matrix'
import { SheetDetail } from './SheetDetail'
import { buildSnapshot, toCsv } from './snapshot'

/**
 * 计分纸把自己记的一局导出去的几种形态（契约见 [MatchExport](../../shared/match/detail.ts)）。
 * 通用战绩榜不在这里 —— 那个只要名次和总分，分享面板自带。
 */

/**
 * 反解出那一局的完整局面再复算。**反解不出来就抛**：那是别的版本写下的 payload，
 * 硬画只会得到一张空表；上层会显示一句「这局出不了」，战绩榜仍然出得来。
 */
function snapshotOf(m: MatchDraft, t: TFunction) {
  const payload = readSheetPayload(m.payload)
  if (payload === null) throw new Error('sheet payload unreadable')
  // 时长从 Match 上取（玩家可能在结算面板用滑杆报过真实时长），不从 payload 的摊表时刻算
  const spent = m.endAt - m.startedAt
  const snap = buildSnapshot(payload, m.endAt, t)
  /*
   * 结算时指定过游戏就以它为准：模板身份说的只是这张纸长什么样（通用空白），
   * 游戏名才是这一局是什么。手填的名字没有图标可配，emoji 槽留空
   */
  if (m.gameId !== null || m.gameName !== undefined) {
    const g = gameLabel(t, m.gameId, m.gameName)
    snap.title = g.name
    snap.icon = g.icon ?? ''
  }
  return {
    ...snap,
    durationText: spent > 0 ? durationText(t, spent) : undefined,
  }
}

export const sheetExports: readonly MatchExport[] = [
  {
    id: 'matrix',
    nameKey: 'tools.scoreSheet.image.forms.matrix',
    icon: IconImage,
    ext: 'png',
    build: async (m, p, t) => renderMatrix(snapshotOf(m, t), p, t('tools.scoreSheet.image.brand')),
  },
  {
    id: 'transposed',
    nameKey: 'tools.scoreSheet.image.forms.transposed',
    icon: IconImage,
    ext: 'png',
    build: async (m, p, t) =>
      renderTransposed(snapshotOf(m, t), p, t('tools.scoreSheet.image.brand')),
  },
  {
    id: 'csv',
    nameKey: 'match.share.forms.csv',
    icon: IconCsv,
    ext: 'csv',
    // 表格与外观无关，palette 用不上
    build: async (m, _p, t) =>
      new Blob([toCsv(snapshotOf(m, t))], { type: 'text/csv;charset=utf-8' }),
  },
]

export const matchTool: MatchTool = { Detail: SheetDetail, exports: sheetExports }
