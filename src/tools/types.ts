import type { ComponentType } from 'react'

/** 工具的元数据，同时驱动首页宫格与路由生成 */
export type ToolMeta = {
  /** 唯一 id，也直接作为路由 path：/#/dice */
  id: string
  name: string
  desc: string
  /**
   * 工具身份图标，**刻意仍用 emoji**：它是内容标识而非功能按钮，
   * 彩色 emoji 的轮廓差异在桌上斜视 45° 时比单色线条更好认。
   * 功能按钮的图标走 [shared/icons.ts](../shared/icons.ts)。
   */
  icon: string
  /** 宫格卡片的强调色（Tailwind 类名片段，如 'amber'） */
  accent: 'amber' | 'emerald' | 'sky' | 'violet' | 'rose'
}

export type ToolEntry = ToolMeta & {
  /** 懒加载页面组件，保证首页首屏不打包所有工具 */
  load: () => Promise<{ default: ComponentType }>
}
