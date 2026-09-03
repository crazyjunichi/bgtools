import type { SheetSnapshot } from '../snapshot'
import { fmtCell, fmtScore } from '../store'
import {
  beginPaint,
  createPaint,
  fit,
  footer,
  MONO,
  rrect,
  SANS,
  seatChip,
  toBlob,
  toneOf,
  widest,
  wrap,
  type SheetPalette,
} from './paint'

/**
 * 完整矩阵的两种朝向：**条目为行**（与屏幕上一致）和**席位为行**（转置）。
 * 转置不是另一种外观而是另一种内容形式 —— 条目多而人少时（火星殖民 9 条目 3 人）
 * 条目为行的表窄而长，宽高比很差，转过来才好发出去。
 *
 * 两者的量算方式必然不同（合计一个在底行一个在右列），共用的是格子与合计格的画法。
 */

// 版式（逻辑像素，落笔前统一放大 DENSITY 倍）
const PAD = 28
const TITLE_H = 74
const HEAD_H = 72
/** 转置版的列头装两行条目名 */
const HEAD_WRAP_H = 86
const ROW_H = 56
const TOTAL_H = 72
const FOOT_H = 34
/** 行首列上下限：装得下「未使用空地」，又不让某个超长自定义名把整张图拉宽 */
const LEAD_MIN = 160
const LEAD_MAX = 340
/** 与屏幕上的 `w-24` 同宽，四位数仍放得下 */
const COL_MIN = 96
/** 条目名当列头时的列宽上限 —— 再宽下去九个条目会把图拉成一条横带 */
const ENTRY_COL_MAX = 148
const GAP = 6
const INSET = 12
const WRAP_LINE_H = 21

const F_TITLE = `700 30px ${SANS}`
const F_DATE = `400 16px ${SANS}`
const F_SEAT = `700 19px ${SANS}`
const F_ROW = `600 18px ${SANS}`
const F_COL = `600 16px ${SANS}`
const F_CELL = `700 26px ${MONO}`
const F_TOTAL = `700 30px ${MONO}`
const F_FOOT = `400 14px ${SANS}`

/** 模板名 + 日期时间。回看一堆导出图时，这两行就是唯一的身份 */
function titleRow(ctx: CanvasRenderingContext2D, p: SheetPalette, s: SheetSnapshot, w: number) {
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.font = F_TITLE
  ctx.fillStyle = p.text
  ctx.fillText(fit(ctx, s.title, w - PAD * 2 - 200), PAD, PAD + 34)
  ctx.font = F_DATE
  ctx.fillStyle = p.dim
  ctx.textAlign = 'right'
  ctx.fillText(s.dateText, w - PAD, PAD + 34)
}

/** 一格分数。空格子与屏幕上一致地显示 `·`，不是 0 */
function scoreCell(
  ctx: CanvasRenderingContext2D,
  p: SheetPalette,
  v: number | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  rrect(ctx, x, y, w, h, 8)
  ctx.fillStyle = p.cell
  ctx.fill()
  ctx.font = F_CELL
  ctx.fillStyle = toneOf(p, v)
  ctx.textAlign = 'center'
  ctx.fillText(fmtCell(v), x + w / 2, y + h / 2)
}

/**
 * 合计格。领先者**不画王冠**（canvas 里没有 lucide 字形），改成描边框 —— 颜色不是唯一编码，
 * 同一格里就是分数本身，旁边还有名字。
 */
function totalCell(
  ctx: CanvasRenderingContext2D,
  p: SheetPalette,
  v: number,
  lead: boolean,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (lead) {
    rrect(ctx, x, y, w, h, 8)
    ctx.strokeStyle = p.best
    ctx.lineWidth = 2.5
    ctx.stroke()
  }
  ctx.font = F_TOTAL
  ctx.fillStyle = lead ? p.best : p.text
  ctx.textAlign = 'center'
  ctx.fillText(fmtScore(v), x + w / 2, y + h / 2)
}

function hline(ctx: CanvasRenderingContext2D, p: SheetPalette, x1: number, x2: number, y: number, width = 1) {
  ctx.strokeStyle = p.line
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2, y)
  ctx.stroke()
}

/** 条目为行、席位为列 —— 与屏幕上的矩阵同一个朝向 */
export function renderMatrix(s: SheetSnapshot, p: SheetPalette, brand: string): Promise<Blob> {
  const { canvas, ctx } = createPaint()

  // ── 量一遍再定尺寸：列宽由内容决定，宁可图宽一点也不能把数字压得读不出
  const leadW = Math.min(
    LEAD_MAX,
    Math.max(LEAD_MIN, widest(ctx, F_ROW, [...s.rows.map((r) => r.name), s.totalRow]) + INSET * 2),
  )
  const colW = Math.max(
    COL_MIN,
    widest(ctx, F_SEAT, s.seats.map((x) => x.name)) + INSET * 2,
    widest(ctx, F_CELL, s.rows.flatMap((r) => r.cells.map(fmtCell))) + INSET * 2,
    widest(ctx, F_TOTAL, s.totals.map(fmtScore)) + INSET * 2,
  )

  const w = PAD * 2 + leadW + colW * s.seats.length
  const h = PAD * 2 + TITLE_H + HEAD_H + ROW_H * s.rows.length + TOTAL_H + FOOT_H
  beginPaint({ canvas, ctx }, w, h, p)

  const colX = (i: number) => PAD + leadW + colW * i
  const cw = colW - GAP

  titleRow(ctx, p, s, w)

  // ── 表头：席位色胶囊
  ctx.textBaseline = 'middle'
  const headY = PAD + TITLE_H
  s.seats.forEach((seat, i) => {
    seatChip(ctx, p, seat, colX(i) + GAP / 2, headY + GAP, cw, HEAD_H - GAP * 2, F_SEAT, INSET)
  })

  // ── 条目行
  const bodyY = headY + HEAD_H
  s.rows.forEach((row, ri) => {
    const y = bodyY + ROW_H * ri
    hline(ctx, p, PAD, w - PAD, y + 0.5)

    ctx.font = F_ROW
    ctx.fillStyle = p.muted
    ctx.textAlign = 'left'
    ctx.fillText(fit(ctx, row.name, leadW - INSET * 2), PAD + INSET, y + ROW_H / 2)

    row.cells.forEach((v, i) => {
      scoreCell(ctx, p, v, colX(i) + GAP / 2, y + GAP / 2, cw, ROW_H - GAP)
    })
  })

  // ── 合计行：整条底色 + 上方双线，同屏幕上的 sticky tfoot
  const totalY = bodyY + ROW_H * s.rows.length
  rrect(ctx, PAD, totalY + 4, w - PAD * 2, TOTAL_H - 8, 10)
  ctx.fillStyle = p.cell
  ctx.fill()
  hline(ctx, p, PAD, w - PAD, totalY + 1, 2)

  ctx.font = F_ROW
  ctx.fillStyle = p.dim
  ctx.textAlign = 'left'
  ctx.fillText(s.totalRow, PAD + INSET, totalY + TOTAL_H / 2)

  s.totals.forEach((v, i) => {
    const lead = s.bestTotal !== null && v === s.bestTotal
    totalCell(ctx, p, v, lead, colX(i) + GAP / 2, totalY + 8, cw, TOTAL_H - 16)
  })

  footer(ctx, p, brand, w, h - PAD / 2 - 4, F_FOOT)
  return toBlob(canvas)
}

/** 席位为行、条目为列。合计挪到最右列，条目名折两行压住列宽 */
export function renderTransposed(s: SheetSnapshot, p: SheetPalette, brand: string): Promise<Blob> {
  const { canvas, ctx } = createPaint()

  const leadW = Math.min(
    LEAD_MAX,
    Math.max(LEAD_MIN, widest(ctx, F_SEAT, s.seats.map((x) => x.name)) + INSET * 2),
  )
  // 条目名按折两行来估宽（取整行宽的一半），但分数永远优先：压到读不出就本末倒置了
  const numW = Math.max(
    COL_MIN,
    widest(ctx, F_CELL, s.rows.flatMap((r) => r.cells.map(fmtCell))) + INSET * 2,
  )
  const nameW = widest(ctx, F_COL, s.rows.map((r) => r.name)) / 2 + INSET * 2
  const colW = Math.max(numW, Math.min(ENTRY_COL_MAX, nameW))
  const totalW = Math.max(
    COL_MIN,
    widest(ctx, F_COL, [s.totalRow]) + INSET * 2,
    widest(ctx, F_TOTAL, s.totals.map(fmtScore)) + INSET * 2,
  )

  const w = PAD * 2 + leadW + colW * s.rows.length + totalW
  const h = PAD * 2 + TITLE_H + HEAD_WRAP_H + ROW_H * s.seats.length + FOOT_H
  beginPaint({ canvas, ctx }, w, h, p)

  const colX = (i: number) => PAD + leadW + colW * i
  const totalX = PAD + leadW + colW * s.rows.length
  const cw = colW - GAP

  titleRow(ctx, p, s, w)

  // ── 列头：条目名（最多两行）+ 最右一列的「合计」
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  const headY = PAD + HEAD_WRAP_H / 2 + TITLE_H
  ctx.font = F_COL
  s.rows.forEach((row, i) => {
    ctx.fillStyle = p.muted
    const lines = wrap(ctx, row.name, cw - INSET, 2)
    const top = headY - ((lines.length - 1) * WRAP_LINE_H) / 2
    lines.forEach((line, li) => {
      ctx.fillText(line, colX(i) + colW / 2, top + WRAP_LINE_H * li)
    })
  })
  ctx.fillStyle = p.dim
  ctx.fillText(fit(ctx, s.totalRow, totalW - INSET), totalX + totalW / 2, headY)

  // ── 席位行：行首胶囊 + 各条目 + 合计
  const bodyY = PAD + TITLE_H + HEAD_WRAP_H
  s.seats.forEach((seat, si) => {
    const y = bodyY + ROW_H * si
    hline(ctx, p, PAD, w - PAD, y + 0.5)
    seatChip(ctx, p, seat, PAD, y + GAP / 2, leadW - GAP, ROW_H - GAP, F_SEAT, INSET)

    s.rows.forEach((row, i) => {
      scoreCell(ctx, p, row.cells[si], colX(i) + GAP / 2, y + GAP / 2, cw, ROW_H - GAP)
    })

    const lead = s.bestTotal !== null && s.totals[si] === s.bestTotal
    totalCell(ctx, p, s.totals[si], lead, totalX + GAP / 2, y + GAP / 2, totalW - GAP, ROW_H - GAP)
  })

  // 合计列与明细之间画一条竖线，否则最右那列读起来像第 N+1 个条目
  const sepX = totalX + 0.5
  ctx.strokeStyle = p.line
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(sepX, PAD + TITLE_H + GAP)
  ctx.lineTo(sepX, bodyY + ROW_H * s.seats.length)
  ctx.stroke()

  footer(ctx, p, brand, w, h - PAD / 2 - 4, F_FOOT)
  return toBlob(canvas)
}
