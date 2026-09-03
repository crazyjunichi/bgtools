import { fmtScore } from '../format'
import type { RankBoard } from './board'
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
  sans,
  shareHeader,
  swatch,
  toBlob,
  TYPE,
  U,
  widest,
  type SharePalette,
} from './paint'

/**
 * 战绩榜：**只出名次、名字、总分**。发群里报结果时别人只想知道谁赢了多少分，
 * 整张明细矩阵在聊天流的缩略图里根本读不出来。所以它也是**所有工具都能出**的那一种图。
 *
 * 名次数字是主编码 —— 不用奖牌 emoji（三色圆片在缩略图里分不清），
 * 领先者的高亮只是附加编码。
 */

const BAR = 4
const GAP = U * 3
/** 太窄的图在聊天流里会被缩得读不出，宽度不足就把中间的空隙撑开补齐 */
const MIN_W = U * 66
const FOOT_H = U * 2 + lineH(TYPE.foot) + PAD

const F_RANK = mono(TYPE.num)
const F_NAME = sans(TYPE.name, 700)
const F_HERO = mono(TYPE.hero)

export function renderRank(s: RankBoard, p: SharePalette, brand: string): Promise<Blob> {
  const { canvas, ctx } = createPaint()

  /*
   * 按总分降序，**同分同名次**（1,1,3 式）—— 并列第一时两个人都该看到 1。
   * 明细矩阵那些形式仍保持座位序，桌上要对得上；只有这里排序，因为它就是「结果」
   */
  const board = s.seats
    .map((seat, i) => ({ seat, total: s.totals[i] }))
    .sort((a, b) => b.total - a.total)
  const rankOf = (total: number) => 1 + board.filter((o) => o.total > total).length

  const rankW = widest(ctx, F_RANK, board.map((o) => String(rankOf(o.total))))
  const nameW = widest(ctx, F_NAME, s.seats.map((x) => x.name))
  const scoreW = widest(ctx, F_HERO, s.totals.map(fmtScore))
  const nameX = PAD + rankW + U * 2 + BAR + U * 1.5

  const w = Math.max(MIN_W, nameX + nameW + GAP * 2 + scoreW + PAD)
  const rowH = lineH(TYPE.hero)
  const h = PAD + HEADER_H + U * 2 + rowH * s.seats.length + FOOT_H
  beginPaint({ canvas, ctx }, w, h, p)

  shareHeader(ctx, p, s, w, s.icon)

  const bodyTop = PAD + HEADER_H + U * 2
  const nameMax = w - PAD - scoreW - GAP - nameX
  ctx.textBaseline = 'middle'

  board.forEach(({ seat, total }, i) => {
    const cy = bodyTop + rowH * i + rowH / 2
    const lead = s.bestTotal !== null && total === s.bestTotal

    ctx.font = F_RANK
    ctx.fillStyle = lead ? p.best : p.dim
    ctx.textAlign = 'right'
    ctx.fillText(String(rankOf(total)), PAD + rankW, cy)

    swatch(ctx, p, seat.color, PAD + rankW + U * 2, cy - (rowH - U * 3) / 2, BAR, rowH - U * 3)

    ctx.font = F_NAME
    ctx.fillStyle = p.text
    ctx.textAlign = 'left'
    ctx.fillText(fit(ctx, seat.name, nameMax), nameX, cy)

    bigNum(ctx, p, fmtScore(total), lead, w - PAD, cy, TYPE.hero)
  })

  footer(ctx, p, brand, h)
  return toBlob(canvas)
}
