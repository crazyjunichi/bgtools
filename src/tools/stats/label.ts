import type { TFunction } from 'i18next'
import { findGame } from '../../shared/games/registry'

/**
 * 一条记录该显示的游戏名与图标。
 *
 * `gameId` 为 null 是正常情况（通用计分随手开的一局，用户也没在结算面板里指定）；
 * 目录里查不到的 id 走同一分支 —— 与其显示一个裸字符串，不如照实说「不指定」。
 */
export function gameLabel(
  t: TFunction,
  gameId: string | null,
): { name: string; icon: string | null } {
  const game = findGame(gameId)
  return game
    ? { name: t(game.nameKey), icon: game.icon }
    : { name: t('match.gameNone'), icon: null }
}
