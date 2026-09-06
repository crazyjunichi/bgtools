import type { TFunction } from 'i18next'
import { findGame } from '../games/registry'

/**
 * 一条记录该显示的游戏名与图标。
 *
 * 优先级：目录游戏 → 手填的名字 → 「不指定」。后两者都是正常情况
 * （通用计分随手开的一局，用户也没在结算面板里指定）；目录里查不到的 id
 * 也落到「不指定」—— 与其显示一个裸字符串，不如照实说。
 */
export function gameLabel(
  t: TFunction,
  gameId: string | null,
  gameName?: string,
): { name: string; icon: string | null } {
  const game = findGame(gameId)
  if (game) return { name: t(game.nameKey), icon: game.icon }
  // 手填的名字没有图标可配 —— 目录外的东西给不出身份标识
  if (gameName) return { name: gameName, icon: null }
  return { name: t('match.gameNone'), icon: null }
}
