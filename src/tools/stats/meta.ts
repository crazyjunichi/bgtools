import type { ToolMeta } from '../types'

export const statsMeta: ToolMeta = {
  id: 'stats',
  nameKey: 'tools.stats.name',
  descKey: 'tools.stats.desc',
  icon: '📊',
  // sky：整个工具只有一种语义 ——「这是信息」，正是 sky 在规范里的分工
  accent: 'sky',
  category: 'general',
}
