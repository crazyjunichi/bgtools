import type { ToolMeta } from '../types'

export const scoreSheetMeta: ToolMeta = {
  id: 'score-sheet',
  nameKey: 'tools.scoreSheet.name',
  descKey: 'tools.scoreSheet.desc',
  icon: '📝',
  // violet 不在四个语义色里，能同时当首页 accent 和「选中格」的主操作色
  accent: 'violet',
}
