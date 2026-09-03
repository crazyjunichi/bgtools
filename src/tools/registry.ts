import { bombBustersMeta } from './bomb-busters/meta'
import { scoreSheetMeta } from './score-sheet/meta'
import { scoreMeta } from './score/meta'
import { statsMeta } from './stats/meta'
import { touchPickMeta } from './touch-pick/meta'
import type { ToolEntry } from './types'
import { werewolfMeta } from './werewolf/meta'
import { yahtzeeMeta } from './yahtzee/meta'

/**
 * 工具注册表 —— 唯一真源。
 * 新增一个工具：建 tools/<id>/ 目录（meta.ts + 页面组件），在此追加一行即可，
 * 首页入口和路由都会自动出现。
 */
export const tools: ToolEntry[] = [
  { ...scoreMeta, load: () => import('./score/ScorePage') },
  { ...scoreSheetMeta, load: () => import('./score-sheet/ScoreSheetPage') },
  { ...bombBustersMeta, load: () => import('./bomb-busters/BombBustersPage') },
  { ...touchPickMeta, load: () => import('./touch-pick/TouchPickPage') },
  { ...statsMeta, load: () => import('./stats/StatsPage') },
  { ...yahtzeeMeta, load: () => import('./yahtzee/YahtzeePage') },
  { ...werewolfMeta, load: () => import('./werewolf/WerewolfPage') },
]

export function findTool(pathname: string): ToolEntry | undefined {
  const id = pathname.replace(/^\/+|\/+$/g, '')
  return tools.find((t) => t.id === id)
}
