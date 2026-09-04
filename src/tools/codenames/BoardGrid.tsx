import type { CellKind } from './game'

/**
 * 桌面牌面、队长偷看层、队长手机端键卡共用的 5×5 网格。
 * 三处同视图：网格/间距/字号一致，只是上色来源不同（showKey 区分）。
 *
 * 队伍色与键卡色是实物游戏的内容色（红蓝两队），不走语义色。
 * 桌面未猜的牌用浅底深字（贴近实体游戏的米色卡面）：整屏最亮的块 = 还没猜，
 * 已猜的任何淡色都压得住它。
 */

// 键卡视图：按键卡实心上色；中立格用米色（tan），不用亮白 —— 整屏最亮的要留给桌面未猜的牌
const KEY_CELL: Record<CellKind, string> = {
  red: 'bg-red-700 text-white',
  blue: 'bg-blue-700 text-white',
  neutral: 'bg-amber-200 text-ink',
  assassin: 'bg-ink text-canvas',
}

// 已猜过的词：淡底淡字不抢眼，桌上只剩未猜的跳出来；刺客保留黑底（终局信号）。
// 键卡与桌面共用这一套 —— 键卡上实色 vs 淡底的差异比降透明度大得多
const REVEALED_CELL: Record<CellKind, string> = {
  red: 'bg-red-500/15 text-red-300/60',
  blue: 'bg-blue-500/15 text-blue-300/60',
  neutral: 'bg-stone-400/15 text-stone-300/60',
  assassin: 'bg-ink text-canvas/40',
}

// 短词尽量大（要让全桌看清），长词留给 break-all 换行
function fontOf(word: string): string {
  if (word.length <= 2) return 'text-2xl wide:text-4xl'
  if (word.length <= 4) return 'text-xl wide:text-3xl'
  if (word.length <= 6) return 'text-lg wide:text-2xl'
  return 'text-base wide:text-xl'
}

type Props = {
  words: string[]
  keys: CellKind[]
  revealed: boolean[]
  /** true = 键卡视图（实心上色）；false = 桌面牌面（已猜的才按结果淡色） */
  showKey: boolean
  /** 给了才可点（桌面牌面）；不给渲染成 div —— 偷看层要求点任意处关闭，disabled button 不吃点击 */
  onTap?: (i: number) => void
  tappable?: boolean
}

export function BoardGrid({ words, keys, revealed, showKey, onTap, tappable }: Props) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-5 grid-rows-5 gap-2">
      {words.map((word, i) => {
        const cls = revealed[i]
          ? `p-2 ${REVEALED_CELL[keys[i]]} ${showKey ? 'line-through' : ''}`
          : showKey
            ? `p-2 ${KEY_CELL[keys[i]]}`
            : 'bg-amber-100 p-2 text-ink enabled:active:scale-95 disabled:opacity-100'
        const cellCls = `flex items-center justify-center rounded-lg text-center leading-tight font-bold break-all transition-transform duration-75 ${fontOf(word)} ${cls}`
        return onTap ? (
          <button
            key={i}
            type="button"
            disabled={!tappable || revealed[i]}
            onClick={() => onTap(i)}
            className={cellCls}
          >
            {word}
          </button>
        ) : (
          <div key={i} className={cellCls}>
            {word}
          </div>
        )
      })}
    </div>
  )
}
