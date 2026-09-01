/**
 * 玩家标识色。刻意避开四个语义色（rose / emerald / sky / amber）——
 * 玩家色要能和"危险 / 完成 / 信息 / 警告"同屏共存，撞色就读不出哪个是语义。
 * 取的都是桌上实物棋子常见的色相，玩家能直接对上手里的棋子。
 *
 * label 是必需的而非装饰：同色允许被两个玩家共用，颜色本身不足以区分，
 * 所有展示玩家色的地方都得再出名字或中文色名（DESIGN.md §6）。
 */
export const PLAYER_COLORS = [
  { id: 'red', label: '红' },
  { id: 'orange', label: '橙' },
  { id: 'yellow', label: '黄' },
  { id: 'green', label: '绿' },
  { id: 'cyan', label: '青' },
  { id: 'blue', label: '蓝' },
  { id: 'violet', label: '紫' },
  { id: 'pink', label: '粉' },
] as const

export type PlayerColor = (typeof PLAYER_COLORS)[number]['id']

export function colorLabel(color: PlayerColor): string {
  return PLAYER_COLORS.find((c) => c.id === color)?.label ?? ''
}

// 三张显式映射表而非拼接类名：Tailwind 编译期只扫静态字符串。
// 档位按 DESIGN.md §2：实心 -400 + text-ink（≈9~11:1），淡底 -500/15 + border-500/60

/** 实心态：选中的玩家、需要一眼认人的胶囊 */
export const PLAYER_SOLID: Record<PlayerColor, string> = {
  red: 'bg-red-400 text-ink',
  orange: 'bg-orange-400 text-ink',
  yellow: 'bg-yellow-400 text-ink',
  green: 'bg-green-400 text-ink',
  cyan: 'bg-cyan-400 text-ink',
  blue: 'bg-blue-400 text-ink',
  violet: 'bg-violet-400 text-ink',
  pink: 'bg-pink-400 text-ink',
}

/** 淡底态：未选中但要带身份色的行/卡 */
export const PLAYER_SOFT: Record<PlayerColor, string> = {
  red: 'border-red-500/60 bg-red-500/15 text-red-300',
  orange: 'border-orange-500/60 bg-orange-500/15 text-orange-300',
  yellow: 'border-yellow-500/60 bg-yellow-500/15 text-yellow-300',
  green: 'border-green-500/60 bg-green-500/15 text-green-300',
  cyan: 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300',
  blue: 'border-blue-500/60 bg-blue-500/15 text-blue-300',
  violet: 'border-violet-500/60 bg-violet-500/15 text-violet-300',
  pink: 'border-pink-500/60 bg-pink-500/15 text-pink-300',
}

/** 色点：列表行前的小圆点，只需要底色 */
export const PLAYER_DOT: Record<PlayerColor, string> = {
  red: 'bg-red-400',
  orange: 'bg-orange-400',
  yellow: 'bg-yellow-400',
  green: 'bg-green-400',
  cyan: 'bg-cyan-400',
  blue: 'bg-blue-400',
  violet: 'bg-violet-400',
  pink: 'bg-pink-400',
}
