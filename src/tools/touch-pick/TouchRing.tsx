import { IconCrown } from '../../shared/icons'

export type RingKind =
  /** 触点已按下但人数还不够（<2），不启动倒计时 */
  | 'waiting'
  /** 倒计时中，环上跑进度弧 */
  | 'pending'
  /** 选中者，或排序里的第一名 */
  | 'winner'
  /** 选一个模式里的落选者 */
  | 'loser'
  /** 排序里的第二名及之后 */
  | 'rank'
  /** 分组：配色由调用方按组号给 */
  | 'group'
  /** 结果锁定后才按下的手指，不参与本轮 */
  | 'bystander'

type Props = {
  /** 圆心，相对触摸场左上角的 px */
  x: number
  y: number
  kind: RingKind
  /** 胶囊里的大号数字（名次 / 组号） */
  label?: string
  /** 胶囊里的小字，目前只有组色名 */
  sub?: string
  crown?: boolean
  /** `group` 档的实心色，取 `PLAYER_SOLID` 的一行 */
  colorClass?: string
  /** 0..1，仅 `pending` 用 */
  progress?: number
}

const RING: Record<RingKind, string> = {
  waiting: 'border-line bg-surface-2/70',
  pending: 'border-emerald-400/70 bg-emerald-500/15',
  winner: 'border-emerald-300 bg-emerald-500/35 shadow-[0_0_40px_-4px] shadow-emerald-400/70',
  // 落选压得很透：屏幕上同时有 emerald 实心亮环，反差要够大才在斜视时一眼分出来
  loser: 'border-line bg-surface-2/50 opacity-30',
  rank: 'border-sky-400/80 bg-sky-500/20',
  group: '',
  bystander: 'border-dashed border-line opacity-25',
}

/** 胶囊：与环同一档色，只有会出数字/皇冠的三档需要 */
const TAG: Record<RingKind, string> = {
  waiting: '',
  pending: '',
  winner: 'bg-emerald-400 text-ink',
  loser: '',
  rank: 'bg-sky-400 text-ink',
  group: '',
  bystander: '',
}

const R = 44
const CIRC = 2 * Math.PI * R

/** 环半径 + 胶囊高度：圆心比这还高，胶囊放上面就出界了，翻到下面去 */
const FLIP_Y = 116

/**
 * 一个触点的呈现：手指下的圆环 + 环外的结果胶囊。
 *
 * 数字/皇冠**必须画在环外**（默认上方，贴顶时翻到下方）—— 圆心正好被手指压着，
 * 画在里面等于没画。环直径取"比指腹大一圈"，被压住也露得出颜色。
 *
 * 环与数字都是**固定 px 而不是 vmin**，这是 DESIGN.md 第 4 条的有意例外：
 * 这里的尺寸基准是指腹（物理尺寸，不随屏幕大小变），跟着视口放大只会让环互相叠在一起。
 */
export function TouchRing({ x, y, kind, label, sub, crown, colorClass, progress = 0 }: Props) {
  const solid = kind === 'group' ? colorClass : undefined
  const tag = solid ?? TAG[kind]
  const below = y < FLIP_Y

  return (
    // pointer-events-none 是硬性的：环会跟着手指移动/卸载，让它接事件就会打断
    // 场地元素上的 pointer capture
    <div
      className="pointer-events-none absolute size-36 -translate-x-1/2 -translate-y-1/2 short:size-28"
      style={{ left: x, top: y }}
    >
      <div
        className={`size-full rounded-full border-4 ${solid ? `${solid} border-ink/40` : RING[kind]}`}
      />

      {kind === 'pending' && (
        // -rotate-90 让弧从正上方开始长，桌上任何角度看都是"越来越满"
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className="stroke-emerald-300"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
          />
        </svg>
      )}

      {(label || crown) && (
        <div
          className={`absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1 font-bold ${
            below ? 'top-full mt-1' : 'bottom-full mb-1'
          } ${tag}`}
        >
          {crown && <IconCrown className="size-8 short:size-6" aria-hidden />}
          {label && (
            <span className="font-mono text-4xl leading-none tabular-nums short:text-3xl">
              {label}
            </span>
          )}
          {sub && <span className="text-sm">{sub}</span>}
        </div>
      )}
    </div>
  )
}
