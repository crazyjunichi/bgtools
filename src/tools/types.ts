import type { ComponentType } from 'react'
import type { I18nKey } from '../shared/i18n/types'

/** 工具的元数据，同时驱动首页宫格与路由生成 */
export type ToolMeta = {
  /** 唯一 id，也直接作为路由 path：/#/dice */
  id: string
  /**
   * 存 key 而不存文案：meta 在模块顶层求值，拿不到 hook；
   * 由消费方（首页宫格、顶栏标题）在渲染期 `t()`，切语言才会立刻跟着变。
   */
  nameKey: I18nKey
  descKey: I18nKey
  /**
   * 工具身份图标，**刻意仍用 emoji**：它是内容标识而非功能按钮，
   * 彩色 emoji 的轮廓差异在桌上斜视 45° 时比单色线条更好认。
   * 功能按钮的图标走 [shared/icons.ts](../shared/icons.ts)。
   */
  icon: string
  /**
   * 可选的封面图，相对 `public/`（如 `covers/bomb-busters.png`）。
   * 只给"桌上真有这盒游戏"的工具配：跟实物一致，第一眼就认得。
   * 缺省或加载失败都退回 `icon` —— emoji 是永远在的那一层，不许删。
   * 抓图流程见 .claude/skills/bgg-cover。
   */
  cover?: string
  /** 宫格卡片的强调色（Tailwind 类名片段，如 'amber'） */
  accent: 'amber' | 'emerald' | 'sky' | 'violet' | 'rose'
  /**
   * 首页落哪个分区：`general` = 任何游戏都用得上，`game` = 只在特定那盒游戏上用。
   * **刻意必填**：给了缺省值，新工具就会默默落进通用区，而这个判断只有作者自己知道。
   */
  category: 'general' | 'game'
  /**
   * 它专门服务的那盒游戏（[shared/games](../shared/games/registry.ts) 里的 id），
   * 归档一局时作为 `gameId` 的缺省。只有 `category: 'game'` 的工具填得上；
   * 计分纸这种一个工具服务十几盒的**不要填** —— 它的游戏由当前模板决定
   */
  gameId?: string
}

export type ToolEntry = ToolMeta & {
  /** 懒加载页面组件，保证首页首屏不打包所有工具 */
  load: () => Promise<{ default: ComponentType }>
}
