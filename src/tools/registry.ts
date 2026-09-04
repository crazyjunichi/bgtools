import { avalonMeta } from './avalon/meta'
import { bombBustersMeta } from './bomb-busters/meta'
import { scoreSheetMeta } from './score-sheet/meta'
import { scoreMeta } from './score/meta'
import { statsMeta } from './stats/meta'
import { touchPickMeta } from './touch-pick/meta'
import type { ToolEntry } from './types'
import { werewolfMeta } from './werewolf/meta'
import { werewordsMeta } from './werewords/meta'
import { yahtzeeMeta } from './yahtzee/meta'

/**
 * 工具注册表 —— 唯一真源。
 * 新增一个工具：建 tools/<id>/ 目录（meta.ts + 页面组件），在此追加一行即可，
 * 首页入口和路由都会自动出现。
 *
 * `match` 是**回看一局**的注册位（[MatchTool](../shared/match/detail.ts)）：
 * shared 不许反向依赖 tools，所以契约在那边、映射在这里。只有会归档的工具需要它。
 */
export const tools: ToolEntry[] = [
  {
    ...scoreMeta,
    load: () => import('./score/ScorePage'),
    match: () => import('./score/match').then((m) => m.matchTool),
  },
  {
    ...scoreSheetMeta,
    load: () => import('./score-sheet/ScoreSheetPage'),
    match: () => import('./score-sheet/match').then((m) => m.matchTool),
  },
  { ...bombBustersMeta, load: () => import('./bomb-busters/BombBustersPage') },
  { ...touchPickMeta, load: () => import('./touch-pick/TouchPickPage') },
  { ...statsMeta, load: () => import('./stats/StatsPage') },
  { ...yahtzeeMeta, load: () => import('./yahtzee/YahtzeePage') },
  { ...werewolfMeta, load: () => import('./werewolf/WerewolfPage') },
  { ...werewordsMeta, load: () => import('./werewords/WerewordsPage') },
  { ...avalonMeta, load: () => import('./avalon/AvalonPage') },
]

export function findTool(pathname: string): ToolEntry | undefined {
  const id = pathname.replace(/^\/+|\/+$/g, '')
  return tools.find((t) => t.id === id)
}
