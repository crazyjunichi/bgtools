import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { IconCrown, IconEdit, IconPlus } from '../../shared/icons'
import { PLAYER_SOLID } from '../../shared/players/colors'
import type { SeatView } from '../../shared/players/seats'
import { tone } from '../../shared/tone'
import {
  entryLabel,
  fmtCell,
  fmtScore,
  isAdjustable,
  rawOf,
  scoreOf,
  totalOf,
  type Entry,
  type Pick,
} from './store'
import { isCount, type Scoring } from './templates'

type Props = {
  seats: SeatView[]
  entries: Entry[]
  cells: Record<string, number>
  /**
   * 只读：列头 / 行首 / 格子全退化成静态元素，不渲染「添加条目」行，也没有选中环。
   * 历史回看走这个（[SheetHistory](SheetHistory.tsx)）—— 和当前局**长得一模一样**，
   * 桌上认知负担最低，而下面那批回调在只读时一个都不需要
   */
  readOnly?: boolean
  /**
   * 左上角那格的游戏名与开局时刻。**只有当前局给** ——
   * 历史回看的浮层标题上已经写着同样两条，表里再写一遍纯属重复
   */
  title?: string
  startedAt?: number
  pick?: Pick | null
  /** 通用空白模板：表尾多一行「添加条目」（行首点开的面板所有模板都有） */
  editable?: boolean
  onPickCell?: (seatId: string, entryId: string) => void
  onEditSeat?: (seatId: string) => void
  onEditEntry?: (entryId: string) => void
  onAddEntry?: () => void
  /** 给了才多出末尾那一列（只读回看不给）。加人紧贴列头：新增的就是一列 */
  onAddSeat?: () => void
}

/** 行首列：条目名要放得下「未使用空地」这种五字词，横屏再宽一点 */
const LEAD = 'w-28 wide:w-32'

/** 每人一列，宽度按「三位数还留得下一位余量」定，容量校核见 docs/DESIGN.md §3 */
const COL = 'w-24'

/**
 * 加人列。**列宽给最小档**：table-fixed 会把富余宽度按各列声明宽度的比例摊下去，
 * 声明得越窄，人少时这条空白带被拉得越少；人多到要横滚时没有富余可摊，它就正好是这个宽度。
 * 全列 sticky 钉在右缘，横滚时 ＋ 不会跟着滚出视野（滚动区在最外层那个 div）。
 */
const ADD_COL = 'sticky right-0 w-12'

/** 列头胶囊。只读态用 span、可编辑态用 button，尺寸必须一致，否则两种视图行高会差一截 */
const SEAT_CHIP =
  'flex min-h-12 w-full items-center justify-center rounded-lg px-1 text-sm font-bold short:min-h-11'

/** 格子。同上，只读态换成 div 但外形不变 */
const CELL = 'flex min-h-14 w-full flex-col items-center justify-center rounded-lg short:!min-h-11'

/**
 * 条目为行 × 玩家为列的矩阵 —— 就是桌上那张计分纸本身。
 *
 * 为什么不像 [ScoreGrid](../score/ScoreGrid.tsx) 那样一人一张卡：这里要看的是
 * 「同一条细则上谁多谁少」和「我这一列还有哪几行没填」，两个都得靠对齐的行列才看得出。
 * 条目多（农场主 15 条）时框内纵滚，表头与合计行 sticky 兜住方向感，页面级仍不滚。
 */
export function SheetGrid({
  seats,
  entries,
  cells,
  readOnly = false,
  title,
  startedAt,
  pick = null,
  editable = false,
  onPickCell,
  onEditSeat,
  onEditEntry,
  onAddEntry,
  onAddSeat,
}: Props) {
  const { t, i18n } = useTranslation()

  const addSeatCol = !readOnly && onAddSeat !== undefined

  /**
   * 选中格滚进可见区。挂在 ref 而不是 effect 上：identity 稳定（useCallback），
   * 所以只在「被选中的按钮换了一个」时触发，键盘上每敲一位数不会重复滚。
   * 农场主 15 条必然框内滚，按「下一条」走到框外就断了线索。
   */
  const revealPicked = useCallback((el: HTMLButtonElement | null) => {
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [])

  const totals = seats.map((s) => totalOf(entries, cells, s.id))
  const best = Math.max(...totals)
  // 全场同分不戴王冠：人人有等于没有，只会让合计行更花
  const hasLeader = totals.some((v) => v !== best) && seats.length > 1

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-line wide:min-w-0">
      {/* min-w-max 让列宽跌到 COL 以下时改为横滚，而不是继续压窄到读不出数字 */}
      <table className="w-full min-w-max table-fixed border-collapse">
        <thead>
          <tr>
            <th className={`sticky left-0 top-0 z-20 bg-surface p-1 ${LEAD}`}>
              {/*
               * sr-only 的列头留着不动：读屏念每一行时要靠它知道首列是什么。
               * 游戏名那块是纯视觉补充（aria-hidden），桌上一眼确认「这张纸是哪个游戏、什么时候开的」
               */}
              <span className="sr-only">{t('tools.scoreSheet.entryCol')}</span>
              {title && (
                <span
                  className="flex min-h-12 flex-col justify-center px-1 short:min-h-11"
                  aria-hidden
                >
                  <span className="truncate text-sm font-bold leading-tight">{title}</span>
                  {startedAt !== undefined && (
                    <span className="truncate text-xs tabular-nums text-text-dim">
                      {fmtStarted(startedAt, i18n.language)}
                    </span>
                  )}
                </span>
              )}
            </th>
            {seats.map((s) => (
              <th key={s.id} scope="col" className={`sticky top-0 z-10 bg-surface p-1 ${COL}`}>
                {/*
                 * 列头整块是按钮：要改的正是这个名字，指到它本身比另起一个笔图标更直接。
                 * 改名/换人/移除都收在它打开的浮层里（[SeatPicker](../../shared/players/SeatPicker.tsx)）：
                 * 列宽摆不下这些按钮，桌上手一抖也点不准
                 */}
                {readOnly ? (
                  <span className={`${SEAT_CHIP} ${PLAYER_SOLID[s.color]}`}>
                    <span className="truncate">{s.name}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onEditSeat?.(s.id)}
                    aria-label={t('tools.scoreSheet.editSeat', { name: s.name })}
                    className={`${SEAT_CHIP} ${PLAYER_SOLID[s.color]}`}
                  >
                    <span className="truncate">{s.name}</span>
                  </button>
                )}
              </th>
            ))}
            {addSeatCol && (
              <th className={`top-0 z-20 bg-surface p-1 ${ADD_COL}`}>
                <button
                  type="button"
                  onClick={onAddSeat}
                  aria-label={t('tools.scoreSheet.addSeat')}
                  className="btn-quiet !min-h-12 w-full short:!min-h-11"
                >
                  <IconPlus className="size-5" aria-hidden />
                </button>
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {entries.map((e) => {
            const name = entryLabel(e, t)
            return (
              <tr key={e.id} className="border-t border-line">
                <td className={`sticky left-0 z-10 bg-surface p-1 ${LEAD}`}>
                  {/*
                   * 可点的行首打开条目面板：换算表的**唯一去处**（放键盘会把键区顶得上下漂），
                   * 也能改这条按数量还是按总分算。改名/删除仍只对自定义条目开放。
                   * 直接填总分的模板条目没东西可调，渲染成纯文本 —— 铅笔图标的有无即区分标记
                   */}
                  {isAdjustable(e) && !readOnly ? (
                    <button
                      type="button"
                      onClick={() => onEditEntry?.(e.id)}
                      aria-label={t('tools.scoreSheet.editEntry', { name })}
                      className="btn-quiet !min-h-12 w-full gap-1.5 !justify-start px-2 text-left short:!min-h-11"
                    >
                      <IconEdit className="size-4 shrink-0 text-text-dim" aria-hidden />
                      <EntryName name={name} scoring={e.scoring} />
                    </button>
                  ) : (
                    // 空图标槽把条目名钉在与可点行同一条竖线上，否则整列名字左右参差
                    <span className="flex min-h-12 w-full items-center gap-1.5 px-2 short:min-h-11">
                      <span className="size-4 shrink-0" aria-hidden />
                      <EntryName name={name} scoring={e.scoring} />
                    </span>
                  )}
                </td>

                {seats.map((s) => {
                  const raw = rawOf(cells, s.id, e.id)
                  const score = scoreOf(e, raw)
                  const selected = pick?.seatId === s.id && pick.entryId === e.id
                  const counted = isCount(e.scoring) && raw !== undefined
                  const inner = (
                    <>
                      <span
                        className={`font-mono text-2xl font-bold leading-none tabular-nums short:text-xl ${tone(
                          score,
                        )}`}
                      >
                        {fmtCell(raw === undefined ? undefined : score)}
                      </span>
                      {/* 折算过的格子要能看出「填的是几个」，否则对不上桌上实物 */}
                      {counted && (
                        <span className="text-xs leading-none tabular-nums text-text-dim">
                          {t('tools.scoreSheet.cellCount', { n: raw })}
                        </span>
                      )}
                    </>
                  )
                  return (
                    <td key={s.id} className={`p-1 ${COL}`}>
                      {/*
                       * 只读态换成 div：外形与可点态完全一致，只是没有选中环、点了也没反应。
                       * 读屏这边不再拼 aria-label —— 那是给按钮取名用的，
                       * 静态表格靠 `th scope="col"` 与行首文字关联，本来就是原生行为
                       */}
                      {readOnly ? (
                        <div className={`${CELL} bg-surface-2`}>{inner}</div>
                      ) : (
                        <button
                          type="button"
                          ref={selected ? revealPicked : undefined}
                          onClick={() => onPickCell?.(s.id, e.id)}
                          // 数量模式要念出「几个 = 几分」，否则读屏只听到得分，对不上桌上实物
                          aria-label={t(
                            raw === undefined
                              ? 'tools.scoreSheet.cellEmpty'
                              : counted
                                ? 'tools.scoreSheet.cellCounted'
                                : 'tools.scoreSheet.cell',
                            { name: s.name, entry: name, n: raw, score: fmtScore(score) },
                          )}
                          className={`${CELL} ${
                            selected ? 'bg-violet-500/15 ring-2 ring-violet-400' : 'bg-surface-2'
                          }`}
                        >
                          {inner}
                        </button>
                      )}
                    </td>
                  )
                })}

                {/* 加人列在正文里只是一条空白带，给底色是为了横滚时盖住从下面滚过去的格子 */}
                {addSeatCol && <td className={`z-10 bg-surface p-1 ${ADD_COL}`} />}
              </tr>
            )
          })}

          {editable && !readOnly && (
            <tr className="border-t border-line">
              <td colSpan={seats.length + 1} className="p-1">
                <button
                  type="button"
                  onClick={onAddEntry}
                  className="btn-quiet !min-h-12 w-full gap-2 text-sm short:!min-h-11"
                >
                  <IconPlus className="size-5" aria-hidden />
                  {t('tools.scoreSheet.addEntry')}
                </button>
              </td>
              {/* 这一行也留出加人列，否则横滚时它的按钮会从别人被遮住的位置探出来 */}
              {addSeatCol && <td className={`z-10 bg-surface p-1 ${ADD_COL}`} />}
            </tr>
          )}
        </tbody>

        <tfoot>
          <tr className="border-t-2 border-line">
            <td
              className={`sticky bottom-0 left-0 z-20 bg-surface-2 px-2 py-1 ${LEAD}`}
            >
              <span className="section-label">{t('tools.scoreSheet.total')}</span>
            </td>
            {seats.map((s, i) => (
              <td
                key={s.id}
                className={`sticky bottom-0 z-10 bg-surface-2 p-1 text-center ${COL}`}
              >
                <span className="flex items-center justify-center gap-1">
                  {hasLeader && totals[i] === best && (
                    <IconCrown className="size-4 shrink-0 text-amber-300" aria-hidden />
                  )}
                  <span className="font-mono text-data-sm font-bold leading-none tabular-nums">
                    {fmtScore(totals[i])}
                  </span>
                </span>
              </td>
            ))}
            {addSeatCol && <td className={`bottom-0 z-20 bg-surface-2 p-1 ${ADD_COL}`} />}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

/**
 * 开局时刻。**掐掉年与秒**：行首列窄，完整的 `toLocaleString` 一定被截断，
 * 而桌上要认的只是「是不是刚开的那局」。跨天回看落在历史浮层，那里给的是全量时间。
 */
function fmtStarted(at: number, lang: string): string {
  return new Date(at).toLocaleString(lang, {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** 数量模式的条目要在行首就标出「格子里填的是数量」，否则点进键盘才发现语义变了 */
function EntryName({ name, scoring }: { name: string; scoring: Scoring }) {
  const { t } = useTranslation()
  return (
    <span className="flex min-w-0 flex-col items-start">
      <span className="truncate text-sm font-semibold">{name}</span>
      {scoring.kind === 'perUnit' && (
        <span className="truncate text-xs text-text-dim">
          {t('tools.scoreSheet.perUnit', { n: fmtScore(scoring.per) })}
        </span>
      )}
      {scoring.kind === 'perGroup' && (
        <span className="truncate text-xs text-text-dim">
          {t('tools.scoreSheet.perGroup', {
            every: scoring.every,
            score: fmtScore(scoring.score),
          })}
        </span>
      )}
      {scoring.kind === 'table' && (
        <span className="truncate text-xs text-text-dim">{t('tools.scoreSheet.byTable')}</span>
      )}
    </span>
  )
}
