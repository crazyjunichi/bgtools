import { diceMeta } from './dice/meta'
import type { ToolEntry } from './types'

/**
 * 工具注册表 —— 唯一真源。
 * 新增一个工具：建 tools/<id>/ 目录（meta.ts + 页面组件），在此追加一行即可，
 * 首页入口和路由都会自动出现。
 */
export const tools: ToolEntry[] = [{ ...diceMeta, load: () => import('./dice/DicePage') }]

export function findTool(pathname: string): ToolEntry | undefined {
  const id = pathname.replace(/^\/+|\/+$/g, '')
  return tools.find((t) => t.id === id)
}
