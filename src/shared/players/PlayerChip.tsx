import { PLAYER_DOT, PLAYER_LINE, PLAYER_SOFT } from './colors'
import type { Player } from './store'

type Props = {
  player: Player
  /** 要一眼认人的用 line（底部粗色边）；只是带上身份色的列表行用 soft */
  variant?: 'line' | 'soft'
  size?: 'sm' | 'md'
  /** 退场态（已行动完 / 已淘汰）：压暗 + 删除线，不只靠颜色变化 */
  dim?: boolean
}

const SIZE = {
  sm: 'px-2.5 py-1 text-sm',
  md: 'px-3 py-1.5 text-base',
}

// 线宽按尺寸档分，只给 line 用 —— soft 是全描边，混进来会把它的底边加粗
const LINE_W = { sm: 'border-b-2', md: 'border-b-4' }

/** 玩家胶囊。名字始终在场 —— 同色可被两人共用，颜色不能是唯一识别编码 */
export function PlayerChip({ player, variant = 'line', size = 'md', dim }: Props) {
  // soft 档自带 bg-<c>-500/15，不能再叠 bg-surface-2：两条都是 background-color，
  // 谁赢取决于生成顺序而非类名顺序
  const skin =
    variant === 'line'
      ? `${LINE_W[size]} ${PLAYER_LINE[player.color]}`
      : `border ${PLAYER_SOFT[player.color]}`

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg font-semibold ${SIZE[size]} ${skin} ${
        dim ? 'opacity-50 line-through' : ''
      }`}
    >
      {variant === 'soft' && (
        <span className={`size-2.5 shrink-0 rounded-full ${PLAYER_DOT[player.color]}`} aria-hidden />
      )}
      <span className="truncate">{player.name}</span>
    </span>
  )
}
