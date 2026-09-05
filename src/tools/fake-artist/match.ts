import type { TFunction } from 'i18next'
import { IconImage } from '../../shared/icons'
import type { MatchExport, MatchTool } from '../../shared/match/detail'
import { dateTimeText, durationText } from '../../shared/match/format'
import { gameLabel } from '../../shared/match/label'
import {
  beginPaint,
  createPaint,
  fit,
  footer,
  HEADER_H,
  lineH,
  PAD,
  rrect,
  sans,
  shareHeader,
  swatch,
  toBlob,
  TYPE,
  U,
  type SharePalette,
} from '../../shared/match/share/paint'
import type { MatchDraft } from '../../shared/match/types'
import { playerHexOf } from '../../shared/players/colors'
import type { SeatView } from '../../shared/players/seats'
import { FakeArtistDetail } from './Detail'
import { paintStroke } from './paint'
import type { Prompt, Stroke } from './store'

/**
 * 归档进 `Match.payload` 的形状。笔画存**座位下标**不存 seatId ——
 * `Match.players` 本身就是座位序快照，id 链回一张可能已经不在的座位表没有意义。
 */
export type FakeArtistPayload = {
  category: string
  word: string
  rounds: number
  /** 作画时的画布纵横比（w/h），回放与导出靠它还原比例；缺失退 4:3 */
  aspect: number
  strokes: { p: number; pts: [number, number][] }[]
}

/** 反解不出来就抛（导出）/ 由调用方 catch 成一句人话（详情）—— 别的版本写下的局面不该把面板带走 */
export function payloadOf(m: MatchDraft): FakeArtistPayload {
  const p = m.payload as Partial<FakeArtistPayload> | undefined
  if (
    !p ||
    typeof p.category !== 'string' ||
    typeof p.word !== 'string' ||
    !Array.isArray(p.strokes)
  ) {
    throw new Error('fake-artist payload unreadable')
  }
  return p as FakeArtistPayload
}

/** 极端比例（误触出的一笔画布、分屏窄条）夹到这个区间，导出图不至于变成一根线 */
const ASPECT_MIN = 0.6
const ASPECT_MAX = 1.8

export const aspectOf = (p: FakeArtistPayload) =>
  Math.min(ASPECT_MAX, Math.max(ASPECT_MIN, p.aspect || 4 / 3))

/** 把一坨笔画按玩家色画满当前画布。详情与导出共用，颜色来源不同（主题/调色板） */
export function paintAll(
  ctx: CanvasRenderingContext2D,
  data: FakeArtistPayload,
  m: MatchDraft,
  w: number,
  h: number,
  tone: 'dark' | 'light',
) {
  for (const s of data.strokes) {
    paintStroke(ctx, s.pts, w, h, playerHexOf(m.players[s.p]?.color ?? 'gray', tone).bg)
  }
}

/**
 * 由当前局面拼一条待归档记录（「再来一局」时落盘的那条）。
 * **null = 这局没什么可记的**：没抽题、一笔没画、还没开画。
 */
export function draftOf(
  s: {
    prompt: Prompt | null
    strokes: Stroke[]
    rounds: number
    startedAt: number | null
    lastActiveAt: number | null
    aspect: number | null
  },
  seats: SeatView[],
): MatchDraft | null {
  if (s.prompt === null || s.startedAt === null || s.strokes.length === 0) return null
  const idxOf = new Map(seats.map((v, i) => [v.id, i]))
  return {
    gameId: 'fake-artist',
    toolId: 'fake-artist',
    // 冒牌有没有被抓是口头投票，工具不记录 —— 这盒没有胜负，只有「打过一局」加那幅画
    mode: 'none',
    startedAt: s.startedAt,
    endAt: s.lastActiveAt ?? s.startedAt,
    players: seats.map((v) => ({ playerId: v.playerId, name: v.name, color: v.color })),
    payload: {
      category: s.prompt.category,
      word: s.prompt.word,
      rounds: s.rounds,
      aspect: s.aspect ?? 4 / 3,
      strokes: s.strokes.map((st) => ({ p: idxOf.get(st.seat) ?? 0, pts: st.pts })),
    },
  }
}

/** 导出图宽度。画作是主角，比战绩榜宽得多；高度由内容推出来 */
const PAINT_W = U * 120
/** 图例两列之间的沟 */
const LEGEND_GAP = U * 4

/** 画作 + 颜色图例一张图：这局没有分数，画本身就是结果 */
function renderPainting(m: MatchDraft, p: SharePalette, t: TFunction): Promise<Blob> {
  const data = payloadOf(m)
  const { canvas, ctx } = createPaint()
  const identity = gameLabel(t, m.gameId)
  const w = PAINT_W

  const answer = t('tools.fakeArtist.board.answer', { word: data.word })
  const category = t('tools.fakeArtist.board.category', { category: data.category })
  const answerH = lineH(TYPE.sum)
  const paintH = Math.round((w - PAD * 2) / aspectOf(data))

  const legendRows = Math.ceil(m.players.length / 2)
  const legendH = legendRows * lineH(TYPE.name) + (legendRows - 1) * U
  const footH = U * 2 + lineH(TYPE.foot) + PAD

  const h = PAD + HEADER_H + U * 2 + answerH + U * 2 + paintH + U * 2 + legendH + footH
  beginPaint({ canvas, ctx }, w, h, p)

  const spent = m.endAt - m.startedAt
  shareHeader(
    ctx,
    p,
    {
      title: identity.name,
      dateText: dateTimeText(m.endAt),
      durationText: spent > 0 ? durationText(t, spent) : undefined,
    },
    w,
    identity.icon ?? undefined,
  )

  let y = PAD + HEADER_H + U * 2

  // 答案行：主题居左、词居右，各占一端，中间留白就是「题面 vs 谜底」的距离
  ctx.font = sans(TYPE.sum, 700)
  ctx.fillStyle = p.text
  ctx.textBaseline = 'middle'
  const cy0 = y + answerH / 2
  ctx.textAlign = 'left'
  ctx.fillText(category, PAD, cy0)
  ctx.textAlign = 'right'
  ctx.fillText(answer, w - PAD, cy0)
  y += answerH + U * 2

  // 画区：圆角边框 + 纸面即底色。clip 防笔画溢出圆角
  ctx.save()
  ctx.translate(PAD, y)
  rrect(ctx, 0, 0, w - PAD * 2, paintH, U * 2)
  ctx.clip()
  paintAll(ctx, data, m, w - PAD * 2, paintH, p.tone)
  ctx.restore()
  rrect(ctx, PAD, y, w - PAD * 2, paintH, U * 2)
  ctx.strokeStyle = p.rule
  ctx.lineWidth = 2
  ctx.stroke()
  y += paintH + U * 2

  // 颜色图例两列：色块 + 名字（同色允许共用，名字必须同框）
  const colW = (w - PAD * 2 - LEGEND_GAP) / 2
  m.players.forEach((pl, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = PAD + col * (colW + LEGEND_GAP)
    const cy = y + row * (lineH(TYPE.name) + U) + lineH(TYPE.name) / 2
    swatch(ctx, p, pl.color, x, cy - U * 1.25, U * 2.5, U * 2.5)
    ctx.font = sans(TYPE.name, 700)
    ctx.fillStyle = p.text
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(fit(ctx, pl.name, colW - U * 4), x + U * 4, cy)
  })

  footer(ctx, p, t('match.share.brand'), h)
  return toBlob(canvas)
}

const PAINTING: MatchExport = {
  id: 'painting',
  nameKey: 'tools.fakeArtist.share.painting',
  icon: IconImage,
  ext: 'png',
  build: renderPainting,
}

export const matchTool: MatchTool = {
  Detail: FakeArtistDetail,
  exports: [PAINTING],
}
