import type { ComponentType } from 'react'

/** 工具的元数据，同时驱动首页宫格与路由生成 */
export type ToolMeta = {
  /** 唯一 id，也直接作为路由 path：/#/dice */
  id: string
  name: string
  desc: string
  /** emoji 图标，避免为几个工具引入整个图标库 */
  icon: string
  /** 宫格卡片的强调色（Tailwind 类名片段，如 'amber'） */
  accent: 'amber' | 'emerald' | 'sky' | 'violet' | 'rose'
}

export type ToolEntry = ToolMeta & {
  /** 懒加载页面组件，保证首页首屏不打包所有工具 */
  load: () => Promise<{ default: ComponentType }>
}
