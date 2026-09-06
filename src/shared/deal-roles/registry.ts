import { AVALON_ROLES } from '../../tools/avalon/roles'
import { FAKE_ARTIST_ROLES } from '../../tools/fake-artist/roles'
import { UNDERCOVER_ROLES } from '../../tools/undercover/roles'
import { WEREWOLF_ROLES } from '../../tools/werewolf/roles'
import { WEREWORDS_ROLES } from '../../tools/werewords/roles'
import { CUSTOM_ROLES } from './custom'
import type { RoleSet } from './types'

/**
 * setId → 身份集。玩家的落地页只有二维码里那个 `setId`，得靠它找回身份的名字、
 * 图标和阵营 —— 这三样是渲染那张牌的全部素材。
 *
 * **只 import 各游戏的 `roles.ts` 纯数据文件，不许 import 任何工具页** ——
 * 落地页挂在 `App` 之外，扯进一个页面组件就把整条工具链打包进玩家的首屏。
 *
 * 新增一款用发身份的游戏：在这里补一行。漏了的话组织者能发牌，玩家扫码却认不出身份集。
 */
const SETS: readonly RoleSet[] = [
  WEREWOLF_ROLES,
  WEREWORDS_ROLES,
  AVALON_ROLES,
  FAKE_ARTIST_ROLES,
  UNDERCOVER_ROLES,
  CUSTOM_ROLES,
]

export function roleSetOf(setId: string): RoleSet | undefined {
  return SETS.find((s) => s.id === setId)
}
