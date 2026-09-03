import type { I18nKey } from '../../../shared/i18n/types'
import type { SheetSnapshot } from '../snapshot'
import { renderMatrix, renderTransposed } from './matrix'
import { PALETTES, type SheetPalette } from './paint'
import { renderRank } from './rank'

/**
 * 导出图的注册表。**外观与内容形式是两个正交维度**：
 *
 * - 外观（skin）只换调色板，不影响画哪些数 —— 用户用左右箭头切
 * - 内容形式（form）决定画哪些数、怎么摆 —— 单选
 *
 * 正交是硬要求：form 的渲染器只接一张 palette，所以 `skin × form` 的组合数不进代码量。
 * 加一种外观是 `SHEET_SKINS` 加一行 + palette 加一张，加一种形式不用乘一遍外观。
 */

export type SheetSkinId = 'dark' | 'print'
export type SheetFormId = 'matrix' | 'transposed' | 'rank'

type SheetSkin = { id: SheetSkinId; nameKey: I18nKey; palette: SheetPalette }
type SheetForm = {
  id: SheetFormId
  nameKey: I18nKey
  render: (s: SheetSnapshot, p: SheetPalette, brand: string) => Promise<Blob>
}

export const SHEET_SKINS: readonly SheetSkin[] = [
  { id: 'dark', nameKey: 'tools.scoreSheet.image.skins.dark', palette: PALETTES.dark },
  { id: 'print', nameKey: 'tools.scoreSheet.image.skins.print', palette: PALETTES.print },
]

export const SHEET_FORMS: readonly SheetForm[] = [
  { id: 'matrix', nameKey: 'tools.scoreSheet.image.forms.matrix', render: renderMatrix },
  { id: 'transposed', nameKey: 'tools.scoreSheet.image.forms.transposed', render: renderTransposed },
  { id: 'rank', nameKey: 'tools.scoreSheet.image.forms.rank', render: renderRank },
]

/** 存下来的 id 失效（改过名的旧存档）就回落到首项，同 findTemplate 的兜底思路 */
export function findSkin(id: SheetSkinId): SheetSkin {
  return SHEET_SKINS.find((x) => x.id === id) ?? SHEET_SKINS[0]
}

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
  skinId: SheetSkinId,
  brand: string,
): Promise<Blob> {
  try {
    return findForm(formId).render(s, findSkin(skinId).palette, brand)
  } catch (e) {
    return Promise.reject(e instanceof Error ? e : new Error(String(e)))
  }
}
