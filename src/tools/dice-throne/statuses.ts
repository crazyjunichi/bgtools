import type { I18nKey } from '../../shared/i18n/types'

export type StatusDef = {
  id: string
  /**
   * 状态标记是**内容标识**而非功能按钮，所以用 emoji（同 meta.icon 的依据：
   * 彩色轮廓在桌上斜视时更好认）。名字始终同时显示，emoji 不是唯一编码
   */
  icon: string
  nameKey: I18nKey
}

/**
 * 常见状态一览，跨赛季通用款。只收「会在桌面上反复增删」的 ——
 * 英雄专属的冷门状态不进列表（那是规则书的事，面板只替 token）。
 * 数组顺序即「添加」区的显示顺序：减益在前（挂给对手、最常操作），增益在后。
 */
export const STATUSES: readonly StatusDef[] = [
  { id: 'burn', icon: '🔥', nameKey: 'tools.diceThrone.status.burn' },
  { id: 'poison', icon: '🧪', nameKey: 'tools.diceThrone.status.poison' },
  { id: 'bleed', icon: '🩸', nameKey: 'tools.diceThrone.status.bleed' },
  { id: 'chill', icon: '🧊', nameKey: 'tools.diceThrone.status.chill' },
  { id: 'stun', icon: '💫', nameKey: 'tools.diceThrone.status.stun' },
  { id: 'concussion', icon: '🥴', nameKey: 'tools.diceThrone.status.concussion' },
  { id: 'knockdown', icon: '⬇️', nameKey: 'tools.diceThrone.status.knockdown' },
  { id: 'blind', icon: '🙈', nameKey: 'tools.diceThrone.status.blind' },
  { id: 'paralyze', icon: '⚡', nameKey: 'tools.diceThrone.status.paralyze' },
  { id: 'hex', icon: '🌀', nameKey: 'tools.diceThrone.status.hex' },
  { id: 'evasive', icon: '💨', nameKey: 'tools.diceThrone.status.evasive' },
  { id: 'untargetable', icon: '👻', nameKey: 'tools.diceThrone.status.untargetable' },
  { id: 'protect', icon: '🛡️', nameKey: 'tools.diceThrone.status.protect' },
  { id: 'counter', icon: '⚔️', nameKey: 'tools.diceThrone.status.counter' },
  { id: 'regeneration', icon: '💚', nameKey: 'tools.diceThrone.status.regeneration' },
  { id: 'berserk', icon: '😡', nameKey: 'tools.diceThrone.status.berserk' },
]

export const STATUS_MAX = 9

export function findStatus(id: string): StatusDef | undefined {
  return STATUSES.find((s) => s.id === id)
}
