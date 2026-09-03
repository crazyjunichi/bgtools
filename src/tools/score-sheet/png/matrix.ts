import { fmtScore } from '../../../shared/match/format'
import {
  beginPaint,
  bigNum,
  createPaint,
  fit,
  footer,
  HEADER_H,
  lineH,
  mono,
  PAD,
  rule,
  sans,
  shareHeader,
  swatch,
  toBlob,
  toneOf,
  TYPE,
  U,
  widest,
  wrap,
  type SharePalette,
} from '../../../shared/match/share/paint'
import type { SheetSnapshot } from '../snapshot'
import { fmtCell } from '../store'

/**
 * 完整矩阵的两种朝向：**条目为行**（与屏幕上一致）和**席位为行**（转置）。
 * 转置不是另一种外观而是另一种内容形式 —— 条目多而人少时（火星殖民 9 条目 3 人）
 * 条目为行的表窄而长，宽高比很差，转过来才好发出去。
 *
 * 版面**无框**：不画格子、不画逐行的分隔线，靠留白与右对齐的数位分列，
 * 只在标题下和合计上各压一条规则线。所以行高与列距都不能再往回压。
 */

/** 列间距。无框版面全靠它分列，也是数字与行首文字之间的最小间隙 */
const GAP = U * 3
/** 玩家色条厚度 */
const BAR = 4
/** 数字列宽下限：四位数带负号仍不至于贴到隔壁列 */
const COL_MIN = U * 9
/** 行首列宽上下限。到了上限就折行，**不截断** —— 图片没有「一屏放完」的约束 */
const LEAD_MIN = U * 16
const LEAD_MAX = U * 38
/** 条目名当列头时的列宽上限 —— 再宽下去九个条目会把图拉成一条横带 */
const ENTRY_COL_MAX = U * 19
/** 页脚区：与正文之间的留白 + 一行字 + 下边距 */
const FOOT_H = U * 2 + lineH(TYPE.foot) + PAD

const F_LABEL = sans(TYPE.label, 600)
const F_COL = sans(TYPE.meta, 600)
const F_SEAT = sans(TYPE.name, 700)
const F_NUM = mono(TYPE.num)
const F_SUM = mono(TYPE.sum)

/** 一格分数，右对齐。空格子与屏幕上一致地显示 `·`，不是 0 */
function scoreAt(
  ctx: CanvasRenderingContext2D,
  p: SharePalette,
  v: number | undefined,
  right: number,
  cy: number,
) {
  ctx.font = F_NUM
  ctx.fillStyle = toneOf(p, v)
  ctx.textAlign = 'right'
  ctx.fillText(fmtCell(v), right, cy)
}

/** 条目为行、席位为列 —— 与屏幕上的矩阵同一个朝向 */
export function renderMatrix(s: SheetSnapshot, p: SharePalette, brand: string): Promise<Blob> {
  const { canvas, ctx } = createPaint()

  // ── 量一遍再定尺寸：列宽由内容决定，宁可图宽一点也不能把数字压得读不出
  const leadW = Math.min(
    LEAD_MAX,
    Math.max(LEAD_MIN, widest(ctx, F_LABEL, [...s.rows.map((r) => r.name), s.totalRow])),
  )
  // 顶到上限的长条目名折两行，那一行跟着变高
  ctx.font = F_LABEL
  const rowLines = s.rows.map((r) => wrap(ctx, r.name, leadW, 2))
  const rowH = rowLines.map((l) => Math.max(lineH(TYPE.num), lineH(TYPE.label) * l.length))

  const colW = Math.max(
    COL_MIN,
    widest(ctx, F_SEAT, s.seats.map((x) => x.name)) + GAP,
    widest(ctx, F_NUM, s.rows.flatMap((r) => r.cells.map(fmtCell))) + GAP,
    widest(ctx, F_SUM, s.totals.map(fmtScore)) + GAP,
  )

  const headH = lineH(TYPE.name) + U + BAR + U * 2
  const bodyH = rowH.reduce((a, b) => a + b, 0)
  const totalH = U * 2.5 + lineH(TYPE.sum)

  const w = PAD * 2 + leadW + colW * s.seats.length
  const h = PAD + HEADER_H + U * 2 + headH + bodyH + totalH + FOOT_H
  beginPaint({ canvas, ctx }, w, h, p)

  /** 每列数字的右缘。最后一列正好与版心右缘齐平，间隙都留在列的左侧 */
  const colRight = (i: number) => PAD + leadW + colW * (i + 1)

  shareHeader(ctx, p, s, w)

  /*
   * ── 列头：席位名 + 名字下方一条玩家色条（无框版面里颜色不再是胶囊底）。
   * 行首那格**故意空着**：条目名自己就在下面那一列，标一句「条目」不提供信息，只多一处噪声
   */
  const contentTop = PAD + HEADER_H + U * 2
  const nameCy = contentTop + lineH(TYPE.name) / 2
  const barY = contentTop + lineH(TYPE.name) + U

  ctx.textBaseline = 'middle'
  s.seats.forEach((seat, i) => {
    ctx.font = F_SEAT
    ctx.fillStyle = p.text
    ctx.textAlign = 'right'
    ctx.fillText(fit(ctx, seat.name, colW - GAP), colRight(i), nameCy)
    swatch(ctx, p, seat.color, colRight(i) - (colW - GAP), barY, colW - GAP, BAR)
  })

  // ── 条目行：无分隔线，靠行距分行
  const bodyTop = contentTop + headH
  let y = bodyTop
  s.rows.forEach((row, ri) => {
    const cy = y + rowH[ri] / 2

    ctx.font = F_LABEL
    ctx.fillStyle = p.muted
    ctx.textAlign = 'left'
    const lines = rowLines[ri]
    const top = cy - ((lines.length - 1) * lineH(TYPE.label)) / 2
    lines.forEach((line, li) => {
      ctx.fillText(line, PAD, top + lineH(TYPE.label) * li)
    })

    row.cells.forEach((v, i) => {
      scoreAt(ctx, p, v, colRight(i), cy)
    })
    y += rowH[ri]
  })

  // ── 合计：一条规则线压住表身，下面一排大数
  rule(ctx, p, PAD, w - PAD, y + U)
  const sumCy = y + U * 2.5 + lineH(TYPE.sum) / 2
  ctx.font = F_LABEL
  ctx.fillStyle = p.muted
  ctx.textAlign = 'left'
  ctx.fillText(fit(ctx, s.totalRow, leadW), PAD, sumCy)
  s.totals.forEach((v, i) => {
    const lead = s.bestTotal !== null && v === s.bestTotal
    bigNum(ctx, p, fmtScore(v), lead, colRight(i), sumCy, TYPE.sum)
  })

  footer(ctx, p, brand, h)
  return toBlob(canvas)
}

/** 席位为行、条目为列。合计挪到最右列，条目名折两行压住列宽 */
export function renderTransposed(s: SheetSnapshot, p: SharePalette, brand: string): Promise<Blob> {
  const { canvas, ctx } = createPaint()

  const nameW = Math.min(
    LEAD_MAX - BAR - U * 1.5,
    widest(ctx, F_SEAT, s.seats.map((x) => x.name)),
  )
  const leadW = Math.max(LEAD_MIN, BAR + U * 1.5 + nameW)

  // 条目名按折两行估宽（取整行宽的一半），但分数永远优先：压到读不出就本末倒置了
  const nameHalf = widest(ctx, F_COL, s.rows.map((r) => r.name)) / 2 + GAP
  const colW = Math.max(
    COL_MIN,
    widest(ctx, F_NUM, s.rows.flatMap((r) => r.cells.map(fmtCell))) + GAP,
    Math.min(ENTRY_COL_MAX, nameHalf),
  )
  // 合计列多留一份间距把它与明细拉开 —— 无框版面里这就是「竖分隔线」的替代
  const sumW =
    U * 2 +
    Math.max(
      COL_MIN,
      widest(ctx, F_SUM, s.totals.map(fmtScore)) + GAP,
      widest(ctx, F_COL, [s.totalRow]) + GAP,
    )

  const w = PAD * 2 + leadW + colW * s.rows.length + sumW
  const colRight = (i: number) => PAD + leadW + colW * (i + 1)
  const sumRight = w - PAD

  // 列头行数由最长的那个条目名决定，整排列头对齐同一个基线组
  ctx.font = F_COL
  const headLines = s.rows.map((r) => wrap(ctx, r.name, colW - GAP, 2))
  const headH = lineH(TYPE.meta) * Math.max(1, ...headLines.map((l) => l.length)) + U * 2
  const rowH = lineH(TYPE.num)

  const h = PAD + HEADER_H + U * 2 + headH + rowH * s.seats.length + FOOT_H
  beginPaint({ canvas, ctx }, w, h, p)

  shareHeader(ctx, p, s, w)

  // ── 列头：条目名（最多两行）+ 最右的「合计」
  const contentTop = PAD + HEADER_H + U * 2
  const headBottom = contentTop + headH - U * 2
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'right'
  ctx.font = F_COL
  headLines.forEach((lines, i) => {
    ctx.fillStyle = p.muted
    // 底对齐：行数不同的列头下缘齐平，才看得出它们同属一排
    const top = headBottom - (lines.length - 0.5) * lineH(TYPE.meta)
    lines.forEach((line, li) => {
      ctx.fillText(line, colRight(i), top + lineH(TYPE.meta) * li)
    })
  })
  ctx.fillStyle = p.dim
  ctx.fillText(fit(ctx, s.totalRow, sumW - GAP), sumRight, headBottom - lineH(TYPE.meta) / 2)

  // ── 席位行：色条 + 名字 + 各条目 + 合计
  const bodyTop = contentTop + headH
  s.seats.forEach((seat, si) => {
    const cy = bodyTop + rowH * si + rowH / 2
    swatch(ctx, p, seat.color, PAD, cy - (rowH - U * 2) / 2, BAR, rowH - U * 2)

    ctx.font = F_SEAT
    ctx.fillStyle = p.text
    ctx.textAlign = 'left'
    ctx.fillText(fit(ctx, seat.name, nameW), PAD + BAR + U * 1.5, cy)

    s.rows.forEach((row, i) => {
      scoreAt(ctx, p, row.cells[si], colRight(i), cy)
    })

    const lead = s.bestTotal !== null && s.totals[si] === s.bestTotal
    bigNum(ctx, p, fmtScore(s.totals[si]), lead, sumRight, cy, TYPE.sum)
  })

  footer(ctx, p, brand, h)
  return toBlob(canvas)
}
