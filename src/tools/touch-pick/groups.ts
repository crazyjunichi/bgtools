import type { PlayerColor } from '../../shared/players/colors'

/**
 * 组色。直接从玩家色板里挑，不新开一张表 —— 那 16 色已经避开了四个语义色，
 * 也已经配好了 `PLAYER_SOLID` 实心档与 `colorLabelKey` 的色名。
 * 挑的标准是**互相不像**：跨了蓝 / 绿 / 品红 / 暖 / 青 / 大地六个色域。
 *
 * 组号数字才是主编码，颜色是辅助：圈外的胶囊同时出组号和色名，
 * 颜色本身不许是唯一识别方式（DESIGN.md §6）。
 */
const GROUP_COLORS = [
  'blue',
  'lime',
  'fuchsia',
  'orange',
  'cyan',
  'brown',
] as const satisfies readonly PlayerColor[]

/** 组数上限就是色板长度：多一组就必然有两组同色，桌上分不出来 */
export const MAX_GROUPS = GROUP_COLORS.length

/** group 是 1 起的组号 */
export function groupColor(group: number): PlayerColor {
  return GROUP_COLORS[(group - 1) % GROUP_COLORS.length]
}
