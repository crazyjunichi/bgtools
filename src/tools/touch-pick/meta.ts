import type { ToolMeta } from '../types'

export const touchPickMeta: ToolMeta = {
  id: 'touch-pick',
  nameKey: 'tools.touchPick.name',
  descKey: 'tools.touchPick.desc',
  icon: '👆',
  // emerald：本工具全屏只有一种语义 —— 「这个被选中了」，与 emerald 的「完成」不冲突
  accent: 'emerald',
  category: 'general',
}
