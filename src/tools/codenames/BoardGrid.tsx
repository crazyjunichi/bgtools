import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CellKind, Mark } from './game'
import { TEAM_NAME } from './teams'

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
  red: 'bg-red-800 text-white',
  blue: 'bg-blue-800 text-white',
  neutral: 'bg-amber-200 text-ink',
  // ink 是常量近黑，深色主题下 canvas 也近黑：字必须写死白，边界靠描边，否则整张牌隐形
  assassin: 'bg-ink text-white border border-neutral-600',
}

// 已猜过的词：淡底淡字不抢眼，桌上只剩未猜的跳出来；刺客保留黑底（终局信号）。
// 键卡与桌面共用这一套 —— 键卡上实色 vs 淡底的差异比降透明度大得多
const REVEALED_CELL: Record<CellKind, string> = {
  red: 'bg-red-500/10 text-red-300/40',
  blue: 'bg-blue-500/10 text-blue-300/40',
  neutral: 'bg-stone-400/10 text-stone-300/40',
  assassin: 'bg-ink text-white/40 border border-neutral-600',
}

// 翻出方角标：实心圆 + 序号。桌面端是队色（红/蓝），手机端会落到牌面归属色（含中立/刺客）
const MARK_BG: Record<CellKind, string> = {
  red: 'bg-red-800',
  blue: 'bg-blue-800',
  neutral: 'bg-stone-500',
  assassin: 'bg-ink',
}

type Props = {
  words: string[]
  keys: CellKind[]
  revealed: boolean[]
  /** 给了且格子已翻就显示「谁在第几回合翻的」角标；队长手机端没有这个数据，不传 */
  marks?: readonly (Mark | null)[]
  /** true = 键卡视图（实心上色）；false = 桌面牌面（已猜的才按结果淡色） */
  showKey: boolean
  /** 缺省 true 铺满父容器；false 按宽度取正方形、下部留空（队长手机落地页，对齐桌面偷看层的卡片比例） */
  fill?: boolean
  /** 给了才可点（桌面牌面）；不给渲染成 div —— 偷看层要求点任意处关闭，disabled button 不吃点击 */
  onTap?: (i: number) => void
  tappable?: boolean
}

export function BoardGrid({ words, keys, revealed, marks, showKey, fill = true, onTap, tappable }: Props) {
  const { t } = useTranslation()
  const gridRef = useRef<HTMLDivElement>(null)
  const [gridW, setGridW] = useState(0)

  useLayoutEffect(() => {
    const el = gridRef.current
    if (!el) return
    const update = () => setGridW(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 统一字号：以当局最长词占卡片宽 80% 反推，全桌同大；词长按字素数（中文一字一宽）
  const maxLen = Math.max(1, ...words.map((w) => [...w].length))
  const fontSize = gridW
    ? Math.min(64, Math.max(14, (((gridW - 32) / 5 - 16) * 0.8) / maxLen))
    : undefined

  return (
    <div
      ref={gridRef}
      className={`grid grid-cols-5 grid-rows-5 gap-2 ${fill ? 'min-h-0 flex-1' : 'aspect-square w-full'}`}
    >
      {words.map((word, i) => {
        const cls = revealed[i]
          ? `p-2 ${REVEALED_CELL[keys[i]]} ${showKey ? 'line-through' : ''}`
          : showKey
            ? `p-2 ${KEY_CELL[keys[i]]}`
            : 'bg-amber-100 p-2 text-ink enabled:active:scale-95 disabled:opacity-100'
        const cellCls = `relative flex items-center justify-center rounded-lg text-center leading-tight font-bold break-all transition-transform duration-75 ${cls}`
        const mark = revealed[i] ? marks?.[i] : undefined
        const markLabel =
          mark &&
          (mark.by === 'red' || mark.by === 'blue'
            ? t('tools.codenames.markedBy', { team: t(TEAM_NAME[mark.by]), n: mark.turn })
            : t('tools.codenames.marked', { n: mark.turn }))
        const content = (
          <>
            {word}
            {mark && (
              <span
                role="img"
                aria-label={markLabel ?? undefined}
                className={`absolute top-1 right-1 flex size-5 items-center justify-center rounded-full text-xs font-bold text-white opacity-60 ${MARK_BG[mark.by]}`}
              >
                <span aria-hidden>{mark.turn}</span>
              </span>
            )}
          </>
        )
        return onTap ? (
          <button
            key={i}
            type="button"
            disabled={!tappable || revealed[i]}
            onClick={() => onTap(i)}
            className={cellCls}
            style={fontSize ? { fontSize } : undefined}
          >
            {content}
          </button>
        ) : (
          <div key={i} className={cellCls} style={fontSize ? { fontSize } : undefined}>
            {content}
          </div>
        )
      })}
    </div>
  )
}
