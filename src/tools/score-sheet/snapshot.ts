import type { TFunction } from 'i18next'
import { dateTimeText } from '../../shared/match/format'
import { toCsv as joinCsv } from '../../shared/match/share/csv'
import type { PlayerColor } from '../../shared/players/colors'
import type { SheetPayload } from './payload'
import { entriesOf, entryLabel, isDirectTotal, rawOf, scoreOf, totalOf } from './store'
import { findTemplate, templateIdentity } from './templates'

/** 一条计分细则一行。`undefined` = 那一格没填过（**不是 0**，两者在纸上必须看得出区别） */
export type SnapshotRow = { name: string; cells: (number | undefined)[] }

/**
 * 一局的**导出中间态**：i18n 与折算都已做完，只剩纯数据。
 *
 * 图片与 CSV 两条出口共用它，所以它们各自都不需要再碰 `t()`、`entriesOf`、`scoreOf` ——
 * 「屏幕上是什么，图里和表里就是什么」这件事只在这一个函数里保证一次。
 *
 * 分数留 `number` 而不是预格式化的串：CSV 必须用 ASCII 的 `-`（Excel 不认
 * [fmtScore](../../shared/match/format.ts) 的 U+2212，整列会被当成文本），
 * 而图上要用 U+2212 才对得齐等宽数字。
 * 两边格式不同，所以格式化留给各自的渲染器。
 */
export type SheetSnapshot = {
  /** 模板名 */
  title: string
  /** 模板 emoji。战绩榜的头部用它做身份标识，同首页宫格那个字面量 */
  icon: string
  /** 归档/导出时刻。只给文件名用，展示走 dateText */
  at: number
  /** 已按界面语言格式化好的日期时间 */
  dateText: string
  /**
   * 格式化好的对局时长。**不由 buildSnapshot 填**：payload 里的 startedAt 是摊表时刻，
   * 真实时长以 [Match](../../shared/match/types.ts) 上的为准（结算面板的滑杆改的就是它），
   * 由导出入口处从 Match 算好补进来
   */
  durationText?: string
  /** 行首列的表头文案（「条目」） */
  entryCol: string
  /** 合计行的行首文案 */
  totalRow: string
  /** 那一晚的席位**快照**：名字与色都是当时存下来的，不跟着名单后来的改动变 */
  seats: { name: string; color: PlayerColor }[]
  rows: SnapshotRow[]
  totals: number[]
  /**
   * 第一名的合计分，用来标记领先者。**并列第一时这几个人都算**（同
   * [SheetGrid](SheetGrid.tsx) 的王冠规则）；全场同分或只有一人时为 null —— 人人有等于没有
   */
  bestTotal: number | null
}

export function buildSnapshot(g: SheetPayload, at: number, t: TFunction): SheetSnapshot {
  const entries = entriesOf(g.templateId, g.customEntries, g.overrides)
  const totals = g.seats.map((s) => totalOf(entries, g.cells, s.id))
  const best = Math.max(...totals)

  const identity = templateIdentity(findTemplate(g.templateId))

  return {
    title: t(identity.nameKey),
    icon: identity.icon,
    at,
    dateText: dateTimeText(at),
    entryCol: t('tools.scoreSheet.entryCol'),
    totalRow: t('tools.scoreSheet.total'),
    // 快照名/色，不走 resolveSeat：那一晚谁拿什么色就该固定住
    seats: g.seats.map((s) => ({ name: s.name, color: s.color })),
    /*
     * **全部条目都出行**，包括一格没填的。导出的是「桌上那张纸」，
     * 少几行反而对不上屏幕；空行本身也是信息（这项谁都没拿到）。
     * 例外是「直接填总分」：那一条合成行与合计行是同一个数，出两遍只会像画错了
     */
    rows: isDirectTotal(entries)
      ? []
      : entries.map((e) => ({
          name: entryLabel(e, t),
          cells: g.seats.map((s) => {
            const raw = rawOf(g.cells, s.id, e.id)
            return raw === undefined ? undefined : scoreOf(e, raw)
          }),
        })),
    totals,
    bestTotal: totals.some((v) => v !== best) && g.seats.length > 1 ? best : null,
  }
}

/**
 * 一行一条目 + 末行合计，**只导得分不导数量**：一列数字混着「4 块田」和「3 分」
 * 没法直接做统计，而折算规则本来就在模板里、不该由表格再表达一遍。
 */
export function toCsv(s: SheetSnapshot): string {
  return joinCsv([
    [s.entryCol, ...s.seats.map((x) => x.name)],
    ...s.rows.map((r) => [r.name, ...r.cells.map((c) => (c === undefined ? '' : String(c)))]),
    [s.totalRow, ...s.totals.map(String)],
  ])
}
