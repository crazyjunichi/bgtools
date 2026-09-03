import type { I18nKey } from '../../i18n/types'
import { PALETTES, type SharePalette } from './paint'

/**
 * 导出图的外观注册表。**外观与内容形式是两个正交维度**：外观只换调色板、不影响画哪些数，
 * 所以 `skin × form` 的组合数不进代码量 —— 加一种外观是这里加一行 + palette 加一张，
 * 内容形式一个都不用碰。
 */

export type ShareSkinId = 'print' | 'dark'

type ShareSkin = { id: ShareSkinId; nameKey: I18nKey; palette: SharePalette }

/** 浅底在前：分享与打印的主流场景都偏浅底，它也就是新设备的初值与 id 失效时的兜底 */
export const SHARE_SKINS: readonly ShareSkin[] = [
  { id: 'print', nameKey: 'match.share.skins.print', palette: PALETTES.print },
  { id: 'dark', nameKey: 'match.share.skins.dark', palette: PALETTES.dark },
]

/** 存下来的 id 失效（改过名的旧偏好）就回落到首项，同 findTemplate 的兜底思路 */
export function findSkin(id: ShareSkinId): ShareSkin {
  return SHARE_SKINS.find((x) => x.id === id) ?? SHARE_SKINS[0]
}
