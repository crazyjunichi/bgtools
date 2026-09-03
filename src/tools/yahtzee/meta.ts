import type { ToolMeta } from '../types'

export const yahtzeeMeta: ToolMeta = {
  id: 'yahtzee',
  nameKey: 'tools.yahtzee.name',
  descKey: 'tools.yahtzee.desc',
  icon: '🎲',
  cover: 'covers/yahtzee.png',
  // amber 沿用「琥珀 = 骰子」的认知，与顶栏快捷骰子一致
  accent: 'amber',
  category: 'game',
}
