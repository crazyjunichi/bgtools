import type { JsonValue } from '@trystero-p2p/mqtt'
import type { ComponentType } from 'react'

/**
 * 工具 id → 玩家端视图组件（/play 落地页按二维码里的 tool 字段找回它）。
 *
 * 与 [deal-roles/registry.ts](../deal-roles/registry.ts) 同一处境：shared 层
 * 反向指回 tools 是故意的 —— 落地页挂在 App 之外，只能靠注册表认出游戏；
 * 且一律懒加载，玩家的首屏不打包任何工具页。
 *
 * 新增一个联机游戏：在这里补一行。漏了的话主机开得出房，玩家扫码只见到「链接不认得」。
 */

/** 具体 view 形状由各游戏自定，注册边界只保证「是 JSON」 */
export type AnyPlayerView = ComponentType<{ view: unknown; send: (action: JsonValue) => void }>

export const PLAYER_VIEWS: Record<string, () => Promise<{ default: AnyPlayerView }>> = {
  codenames: () =>
    // 组件的 props 是具体类型，到注册边界收窄不了，只能在这里断言一次
    import('../../tools/codenames/PlayerView') as unknown as Promise<{ default: AnyPlayerView }>,
}
