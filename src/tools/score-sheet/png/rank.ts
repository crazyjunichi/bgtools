import type { SheetSnapshot } from '../snapshot'
import { fmtScore } from '../store'
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
  widest,
  type SheetPalette,
} from './paint'

/**
 * 战绩榜：**只出名次、名字、总分**。发群里报结果时别人只想知道谁赢了多少分，
 * 整张矩阵在聊天流的缩略图里根本读不出来。
 *
 * 名次数字是主编码 —— 不用奖牌 emoji（三色圆片在缩略图里分不清），
 * 领先者的高亮只是附加编码。
 */

const PAD = 28
const HEAD_H = 100
const ROW_H = 76
const FOOT_H = 34
const GAP = 10
const INSET = 14
/** 太窄的图在聊天流里会被缩得读不出，宽度不足就把名字那栏拉开补齐 */
const MIN_W = 540
const RANK_W = 56
const NAME_MIN = 200

const F_ICON = `28px ${SANS}`
const F_TITLE = `700 32px ${SANS}`
const F_DATE = `400 16px ${SANS}`
const F_RANK = `700 26px ${MONO}`
const F_NAME = `700 21px ${SANS}`
const F_SCORE = `700 38px ${MONO}`
const F_FOOT = `400 14px ${SANS}`

export function renderRank(s: SheetSnapshot, p: SheetPalette, brand: string): Promise<Blob> {
  const { canvas, ctx } = createPaint()

  /*
   * 按总分降序，**同分同名次**（1,1,3 式）—— 并列第一时两个人都该看到 1。
   * 矩阵那两种形式仍保持座位序，桌上要对得上；只有这里排序，因为它就是「结果」
   */
  const board = s.seats
    .map((seat, i) => ({ seat, total: s.totals[i] }))
    .sort((a, b) => b.total - a.total)
  const rankOf = (total: number) => 1 + board.filter((o) => o.total > total).length

  const scoreW = Math.max(120, widest(ctx, F_SCORE, s.totals.map(fmtScore)) + INSET * 2)
  const nameW = Math.max(NAME_MIN, widest(ctx, F_NAME, s.seats.map((x) => x.name)) + INSET * 2)
  const bodyW = Math.max(
    MIN_W - PAD * 2,
    RANK_W + GAP + nameW + GAP + scoreW,
    // 标题也可能比几行分数宽（长模板名 + 日期）
    widest(ctx, F_TITLE, [s.title]) + 44,
  )
  // 余量全给名字那栏：名次与分数是数字，拉宽只会让它们飘在空白里
  const chipW = bodyW - RANK_W - GAP * 2 - scoreW

  const w = PAD * 2 + bodyW
  const h = PAD * 2 + HEAD_H + ROW_H * s.seats.length + FOOT_H
  beginPaint({ canvas, ctx }, w, h, p)

  // ── 头部：模板 emoji + 名字 + 日期。emoji 是内容标识，与首页宫格同一个字面量
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.font = F_ICON
  ctx.fillStyle = p.text
  ctx.fillText(s.icon, PAD, PAD + 24)
  ctx.font = F_TITLE
  ctx.fillText(fit(ctx, s.title, w - PAD * 2 - 44), PAD + 44, PAD + 24)
  ctx.font = F_DATE
  ctx.fillStyle = p.dim
  ctx.fillText(s.dateText, PAD, PAD + 64)

  // ── 一人一行
  const bodyY = PAD + HEAD_H
  board.forEach(({ seat, total }, i) => {
    const y = bodyY + ROW_H * i
    const rank = rankOf(total)
    const lead = s.bestTotal !== null && total === s.bestTotal

    rrect(ctx, PAD, y + GAP / 2, bodyW, ROW_H - GAP, 12)
    ctx.fillStyle = p.cell
    ctx.fill()
    if (lead) {
      ctx.strokeStyle = p.best
      ctx.lineWidth = 2.5
      ctx.stroke()
    }

    ctx.font = F_RANK
    ctx.fillStyle = lead ? p.best : p.muted
    ctx.textAlign = 'center'
    ctx.fillText(String(rank), PAD + RANK_W / 2, y + ROW_H / 2)

    seatChip(ctx, p, seat, PAD + RANK_W + GAP, y + GAP, chipW, ROW_H - GAP * 2, F_NAME, INSET)

    ctx.font = F_SCORE
    ctx.fillStyle = lead ? p.best : p.text
    ctx.textAlign = 'right'
    ctx.fillText(fmtScore(total), w - PAD - INSET, y + ROW_H / 2)
  })

  footer(ctx, p, brand, w, h - PAD / 2 - 4, F_FOOT)
  return toBlob(canvas)
}
