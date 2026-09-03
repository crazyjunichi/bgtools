import type { I18nKey } from '../../../shared/i18n/types'
import type { SharePalette } from '../../../shared/match/share/paint'
import { renderRank } from '../../../shared/match/share/rank'
import { findSkin, type ShareSkinId } from '../../../shared/match/share/skins'
import type { SheetSnapshot } from '../snapshot'
import { renderMatrix, renderTransposed } from './matrix'

/**
 * 计分纸的内容形式注册表：**决定画哪些数、怎么摆**，与外观（[skins](../../../shared/match/share/skins.ts)）
 * 正交 —— 渲染器只接一张 palette，所以 `skin × form` 的组合数不进代码量。
 *
 * 战绩榜是通用的（只要名次和总分），所以它在 shared 那边；矩阵两种是这个工具自己的形状。
 */

export type SheetFormId = 'matrix' | 'transposed' | 'rank'

type SheetForm = {
  id: SheetFormId
  nameKey: I18nKey
  render: (s: SheetSnapshot, p: SharePalette, brand: string) => Promise<Blob>
}

export const SHEET_FORMS: readonly SheetForm[] = [
  { id: 'matrix', nameKey: 'tools.scoreSheet.image.forms.matrix', render: renderMatrix },
  { id: 'transposed', nameKey: 'tools.scoreSheet.image.forms.transposed', render: renderTransposed },
  { id: 'rank', nameKey: 'tools.scoreSheet.image.forms.rank', render: renderRank },
]

/** 存下来的 id 失效（改过名的旧存档）就回落到首项，同 findTemplate 的兜底思路 */
export function findForm(id: SheetFormId): SheetForm {
  return SHEET_FORMS.find((x) => x.id === id) ?? SHEET_FORMS[0]
}

/**
 * 唯一出口。`createPaint` 在拿不到 2d 上下文时抛（极老 Safari、内存不足），
 * 这里裹成 rejection —— 调用方本来就有 catch，不该让它变成同步异常带走整页。
 */
export function renderSheetImage(
  s: SheetSnapshot,
  formId: SheetFormId,
  skinId: ShareSkinId,
  brand: string,
): Promise<Blob> {
  try {
    return findForm(formId).render(s, findSkin(skinId).palette, brand)
  } catch (e) {
    return Promise.reject(e instanceof Error ? e : new Error(String(e)))
  }
}
