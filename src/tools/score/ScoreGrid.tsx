import { useTranslation } from 'react-i18next'
import { IconCrown } from '../../shared/icons'
import { PLAYER_SOLID } from '../../shared/players/colors'
import type { SeatView } from '../../shared/players/seats'
import { tone } from '../../shared/tone'
import { signed, totalOf, type Round } from './store'

type Props = {
  seats: SeatView[]
  rounds: Round[]
  draft: Record<string, number>
  /** 打开某一位的调分浮层 */
  onOpenSeat: (seatId: string) => void
}

/** 卡内只回顾最近几轮，再往前去「记录」浮层看完整矩阵 */
const RECENT = 3

/**
 * 席位数到这个数就进密集档：合计再降一号、卡内历史撤掉。
 *
 * 阈值取「开始排 5 列多行」那一刻 —— 在此之前行数是钉死的（一行或两行），卡高够装任何东西；
 * 到了这一档卡高骤降，宽高同时吃紧。撤的是历史那三行而不是别的：它信息密度最低，
 * 而完整矩阵在「记录」浮层里随时能看。不等到卡高最矮的档位才撤，因为人数只增不减，
 * 少跳一次布局。各档卡高见 docs/DESIGN.md §3。
 */
const DENSE_FROM = 13

/**
 * 席位数 → 网格列数 + 合计字号。两个值一处出，因为它们由同一件事决定（横屏排几列），
 * 拆成两个函数早晚会漂移 —— 列数序列不是单调的：单行档是 4,5,6，双行档又回到 4,4,5,5,6,6。
 *
 * **行数是显式的**（≤6 一行、≤12 两行、更多才 5 列多行）而不是交给 `auto-fit`：
 * 一屏不滚是硬约束，而 `auto-fit` 只看宽度，会排出行数装不下的网格。
 *
 * **字号跟着列数走，不跟人数走。** 卡宽 = 可用宽 / 列数，等宽数字高宽联动，
 * 列数一多卡就窄，四位合计放不进去只能降档。所以 6 席（一行 6 列）的数字比
 * 7 席（两行 4 列）的**小** —— 加一个人反而变大，是几何结果不是 bug。
 * 各档的卡宽与字号上限见 docs/DESIGN.md §3。
 *
 * 竖屏列数一律比横屏少：可用宽比横屏窄不少，高度反而更充裕。
 */
function layout(n: number): { cols: string; size: string } {
  if (n === 1) return { cols: 'grid-cols-1', size: 'text-data' }
  if (n === 2) return { cols: 'grid-cols-1 wide:grid-cols-2', size: 'text-data' }
  if (n === 3) return { cols: 'grid-cols-1 wide:grid-cols-3', size: 'text-data' }
  // 六人及以下横屏一行：一排卡片对得上一圈人的座位，扫一遍不用换行
  if (n === 4) return { cols: 'grid-cols-2 wide:grid-cols-4', size: 'text-data' }
  if (n === 5) return { cols: 'grid-cols-2 wide:grid-cols-5', size: 'text-data' }
  if (n === 6) return { cols: 'grid-cols-2 wide:grid-cols-6', size: 'text-data-md' }
  // 七到十二人横屏两行，列数 = ceil(n/2)
  if (n <= 8) return { cols: 'grid-cols-2 wide:grid-cols-4', size: 'text-data' }
  if (n <= 10) return { cols: 'grid-cols-3 wide:grid-cols-5', size: 'text-data' }
  if (n < DENSE_FROM) return { cols: 'grid-cols-3 wide:grid-cols-6', size: 'text-data-md' }
  return { cols: 'grid-cols-3 wide:grid-cols-5', size: 'text-data-sm' }
}

/**
 * 主界面：一人一张卡。
 *
 * **为什么不是矩阵**：合计是全桌整晚瞄得最多的数字，而等宽字体高宽联动、列宽就是它的
 * 天花板 —— 矩阵把每人压到一列，合计只能做到卡片布局的一半大。代价是主界面没有
 * "同一轮所有人排成一行"的横向对比，那个换到「记录」浮层（[ScoreHistory]）里，
 * 需要时才看，它本来也不是记分时看的东西。两种布局的实测字号见 docs/DESIGN.md §3。
 *
 * **整张卡是一个按钮**，点哪儿都开调分浮层（[SeatSheet]）：操作点和反馈点必须重合。
 *
 * 行高走 `minmax(…,1fr)`：人少时 `1fr` 平分容器高度把卡拉满，多到连密集档都装不下时
 * 锁在下限改为框内纵滚 —— 席位数不设上限，总有排不完的时候，但那时页面仍不滚。
 */
export function ScoreGrid({ seats, rounds, draft, onOpenSeat }: Props) {
  const { t } = useTranslation()

  const totals = seats.map((s) => totalOf(rounds, draft, s.id))
  /*
   * 全场同分时谁都不算领先（开局全 0、或只有一个人），否则一片王冠等于没有信息。
   * 并列最高则一起戴 —— 桌上并列第一是常态，藏起来反而要自己比数字。
   */
  const lead =
    totals.length > 1 && Math.min(...totals) !== Math.max(...totals) ? Math.max(...totals) : null

  const dense = seats.length >= DENSE_FROM
  const { cols, size } = layout(seats.length)
  // 倒序：最近一轮在最上面，手边永远是刚发生的事
  const recent = rounds.slice(-RECENT).reverse()

  return (
    <div
      className={`grid min-h-0 flex-1 auto-rows-[minmax(8.5rem,1fr)] gap-2 overflow-y-auto wide:min-w-0 short:gap-1.5 ${cols}`}
    >
      {seats.map((s, i) => {
        const delta = draft[s.id] ?? 0
        const leading = lead !== null && totals[i] === lead
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onOpenSeat(s.id)}
            aria-label={t(leading ? 'tools.score.seatCellLeader' : 'tools.score.seatCell', {
              name: s.name,
              total: totals[i],
              delta: signed(delta),
            })}
            className="card flex min-h-0 flex-col items-stretch gap-1 !p-3 transition-transform duration-75 active:scale-95 short:!p-2"
          >
            {/*
             * 合计是卡里唯一的弹性块，吃掉全部余量并居中 —— 人少时卡很高，让空白落在
             * 数字周围而不是堆在名字下面。`items-start` 让王冠对齐数字顶端当上标，
             * `shrink-0` 保证宁可它探出一点也绝不压缩数字本身。
             */}
            <span
              className={`flex min-h-0 flex-1 items-center justify-center ${size}`}
            >
              {/* 字号挂在外层，王冠的 em 才跟着数字走（同 [TimerAlarm] 的做法）；
                  这层负责让王冠对齐数字顶端，而不是对齐弹性容器的顶端 */}
              <span className="flex items-start">
                <span className="font-mono font-bold leading-none tabular-nums">{totals[i]}</span>
                {leading && (
                  <IconCrown className="size-[0.4em] shrink-0 text-yellow-300" aria-hidden />
                )}
              </span>
            </span>

            <span
              className={`shrink-0 truncate rounded-lg px-2 py-1 text-lg font-bold short:text-base ${
                PLAYER_SOLID[s.color]
              }`}
            >
              {s.name}
            </span>

            {/*
             * 「本轮」二字跟着数字一起显示，不靠位置暗示。这轮没记分就整层隐掉，
             * 空白即"还没记"，扫一眼就知道还差谁 —— 用 `invisible` 而不是不渲染，
             * 否则没记分的卡片名字会往下掉，一排卡的名字就不在同一水平线上了。
             */}
            <span
              className={`flex shrink-0 items-baseline justify-center gap-1 rounded-lg border py-1 ${
                delta ? 'border-sky-500/60 bg-sky-500/15' : 'invisible border-transparent'
              }`}
            >
              <span className="text-sm font-semibold text-sky-300 short:text-xs">
                {t('tools.score.thisRound')}
              </span>
              <span
                className={`font-mono text-xl font-semibold tabular-nums short:text-lg ${tone(
                  delta,
                )}`}
              >
                {signed(delta)}
              </span>
            </span>

            {/*
             * 最近三轮：只回顾，不是主体，所以压到最小字号并靠分隔线降权。
             * `short:hidden` 不是嫌它挤 —— 矮屏下这三行吃掉的高度会让合计跌破它自己的
             * 下限（校核见 docs/DESIGN.md §3）。矮屏是手持场景，回顾本来就该去「记录」浮层。
             */}
            {!dense && recent.length > 0 && (
              <span className="flex shrink-0 flex-col border-t border-line pt-1 font-mono text-xs tabular-nums short:hidden">
                {recent.map((r, j) => (
                  <span key={r.id} className="flex items-baseline justify-between px-1">
                    <span className="text-text-dim">
                      {t('tools.score.roundNo', { n: rounds.length - j })}
                    </span>
                    <span className={tone(r.delta[s.id])}>
                      {r.delta[s.id] ? signed(r.delta[s.id]) : '·'}
                    </span>
                  </span>
                ))}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
