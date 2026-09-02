import { PLAYER_HEX } from '../../shared/players/colors'
import type { SheetSnapshot } from './snapshot'
import { fmtScore } from './store'

/**
 * 把一局画成一张 PNG。**不截屏、不复刻 DOM** —— 这是为「拍下来发群里」重排的一张纸：
 * 列宽按实测文字定、不横滚、不裁剪，屏幕上那些只在触屏才有意义的东西（选中环、铅笔图标、
 * 添加条目行）一概不画。
 *
 * 返回 Blob 而非 dataURL：`navigator.share({ files })` 要的就是 `File`，
 * 而 base64 串比二进制明显更占内存。
 */

/** 导出图固定 2x，**不跟设备 DPR** —— 同一局在手机和平板上导出该得到同一张图 */
const DENSITY = 2

/**
 * 字体栈抄自 [index.css](../../index.css) 的 `--font-sans` / `--font-mono`。
 * 没有从 CSS 变量读：Tailwind 4 会把没用到的 theme 变量摇掉，取空串就退成默认衬线体了。
 */
const SANS =
  "system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
const MONO = "ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace"

/**
 * 取值全部对齐 `@theme` 与 [tone.ts](../../shared/tone.ts)：canvas 拿不到类名，
 * 而 Tailwind 4 的色板是 `oklch()`、`fillStyle` 不认时**静默失败**（沿用上一个颜色）。
 * 正负分仍是 teal / orange，第一名仍是 amber，同 [SheetGrid](SheetGrid.tsx)。
 */
const C = {
  bg: '#17181a', // --color-surface
  cell: '#262829', // --color-surface-2
  line: '#454a4f', // --color-line
  text: '#f5f5f5', // --color-text
  muted: '#b4b8bd', // --color-text-muted
  dim: '#8b9096', // --color-text-dim
  pos: '#46ecd5', // teal-300  oklch(85.5% 0.138 181.071)
  neg: '#ffb86a', // orange-300 oklch(83.7% 0.128 66.29)
  best: '#ffd230', // amber-300 oklch(87.9% 0.169 91.605)
}

// 版式（逻辑像素，落笔前统一放大 DENSITY 倍）
const PAD = 28
const TITLE_H = 74
const HEAD_H = 72
const ROW_H = 56
const TOTAL_H = 72
const FOOT_H = 34
/** 行首列上下限：装得下「未使用空地」，又不让某个超长自定义名把整张图拉宽 */
const LEAD_MIN = 160
const LEAD_MAX = 340
/** 与屏幕上的 `w-24` 同宽，四位数仍放得下 */
const COL_MIN = 96
const GAP = 6
const INSET = 12

const F_TITLE = `700 30px ${SANS}`
const F_DATE = `400 16px ${SANS}`
const F_SEAT = `700 19px ${SANS}`
const F_ROW = `600 18px ${SANS}`
const F_CELL = `700 26px ${MONO}`
const F_TOTAL = `700 30px ${MONO}`
const F_FOOT = `400 14px ${SANS}`

/** 圆角矩形。`roundRect` 在旧 Safari 上不存在，缺了要退成直角而不是抛异常 */
function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  // 不能用 `'roundRect' in ctx`：lib.dom 里它是必有成员，`in` 会把 else 分支收窄成 never
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

/** 超宽就截断加省略号 —— 画布不会自动换行，不截就直接压到隔壁列上 */
function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text
  let s = text
  while (s.length > 1 && ctx.measureText(`${s}…`).width > max) s = s.slice(0, -1)
  return `${s}…`
}

function widest(ctx: CanvasRenderingContext2D, font: string, texts: string[]): number {
  ctx.font = font
  return texts.reduce((m, s) => Math.max(m, ctx.measureText(s).width), 0)
}

/** 空格子与屏幕上一致地显示 `·`，不是 0 */
function cellText(v: number | undefined): string {
  return v === undefined ? '·' : fmtScore(v)
}

function toneOf(v: number | undefined): string {
  if (v === undefined) return C.dim
  if (v === 0) return C.dim
  return v > 0 ? C.pos : C.neg
}

export function renderSheetPng(s: SheetSnapshot, brand: string): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('canvas 2d unavailable'))

  // ── 量一遍再定尺寸：列宽由内容决定，宁可图宽一点也不能把数字压得读不出
  const leadW = Math.min(
    LEAD_MAX,
    Math.max(LEAD_MIN, widest(ctx, F_ROW, [...s.rows.map((r) => r.name), s.totalRow]) + INSET * 2),
  )
  const colW = Math.max(
    COL_MIN,
    widest(ctx, F_SEAT, s.seats.map((x) => x.name)) + INSET * 2,
    widest(ctx, F_CELL, s.rows.flatMap((r) => r.cells.map(cellText))) + INSET * 2,
    widest(ctx, F_TOTAL, s.totals.map(fmtScore)) + INSET * 2,
  )

  const w = PAD * 2 + leadW + colW * s.seats.length
  const h = PAD * 2 + TITLE_H + HEAD_H + ROW_H * s.rows.length + TOTAL_H + FOOT_H
  canvas.width = w * DENSITY
  canvas.height = h * DENSITY
  // 设 width 会重置全部绘图状态，所以缩放必须放在量完之后
  ctx.scale(DENSITY, DENSITY)

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, w, h)

  const colX = (i: number) => PAD + leadW + colW * i

  // ── 标题：模板名 + 日期时间。回看一堆导出图时，这两行就是唯一的身份
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.font = F_TITLE
  ctx.fillStyle = C.text
  ctx.fillText(fit(ctx, s.title, w - PAD * 2 - 200), PAD, PAD + 34)
  ctx.font = F_DATE
  ctx.fillStyle = C.dim
  ctx.textAlign = 'right'
  ctx.fillText(s.dateText, w - PAD, PAD + 34)

  // ── 表头：席位色胶囊，与屏幕上的列头同一套配色
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  const headY = PAD + TITLE_H
  s.seats.forEach((seat, i) => {
    const hex = PLAYER_HEX[seat.color]
    const x = colX(i) + GAP / 2
    const cw = colW - GAP
    rrect(ctx, x, headY + GAP, cw, HEAD_H - GAP * 2, 10)
    ctx.fillStyle = hex.bg
    ctx.fill()
    // 「黑」在深底上只能靠亮描边成形，其余色没有 ring
    if (hex.ring) {
      ctx.strokeStyle = hex.ring
      ctx.lineWidth = 2
      ctx.stroke()
    }
    ctx.font = F_SEAT
    ctx.fillStyle = hex.fg
    ctx.fillText(fit(ctx, seat.name, cw - INSET), x + cw / 2, headY + HEAD_H / 2)
  })

  // ── 条目行
  const bodyY = headY + HEAD_H
  s.rows.forEach((row, ri) => {
    const y = bodyY + ROW_H * ri
    ctx.strokeStyle = C.line
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PAD, y + 0.5)
    ctx.lineTo(w - PAD, y + 0.5)
    ctx.stroke()

    ctx.font = F_ROW
    ctx.fillStyle = C.muted
    ctx.textAlign = 'left'
    ctx.fillText(fit(ctx, row.name, leadW - INSET * 2), PAD + INSET, y + ROW_H / 2)

    ctx.textAlign = 'center'
    row.cells.forEach((v, i) => {
      const x = colX(i) + GAP / 2
      const cw = colW - GAP
      rrect(ctx, x, y + GAP / 2, cw, ROW_H - GAP, 8)
      ctx.fillStyle = C.cell
      ctx.fill()
      ctx.font = F_CELL
      ctx.fillStyle = toneOf(v)
      ctx.fillText(cellText(v), x + cw / 2, y + ROW_H / 2)
    })
  })

  // ── 合计行：整条底色 + 上方双线，同屏幕上的 sticky tfoot
  const totalY = bodyY + ROW_H * s.rows.length
  rrect(ctx, PAD, totalY + 4, w - PAD * 2, TOTAL_H - 8, 10)
  ctx.fillStyle = C.cell
  ctx.fill()
  ctx.strokeStyle = C.line
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PAD, totalY + 1)
  ctx.lineTo(w - PAD, totalY + 1)
  ctx.stroke()

  ctx.font = F_ROW
  ctx.fillStyle = C.dim
  ctx.textAlign = 'left'
  ctx.fillText(s.totalRow, PAD + INSET, totalY + TOTAL_H / 2)

  ctx.textAlign = 'center'
  s.totals.forEach((v, i) => {
    const x = colX(i) + GAP / 2
    const cw = colW - GAP
    const lead = s.bestTotal !== null && v === s.bestTotal
    /*
     * 第一名不画王冠（canvas 里没有 lucide 字形），改成 amber 描边框。
     * 颜色不是唯一编码 —— 同一列上方就是名字，而且分数本身也在那儿
     */
    if (lead) {
      rrect(ctx, x, totalY + 8, cw, TOTAL_H - 16, 8)
      ctx.strokeStyle = C.best
      ctx.lineWidth = 2.5
      ctx.stroke()
    }
    ctx.font = F_TOTAL
    ctx.fillStyle = lead ? C.best : C.text
    ctx.fillText(fmtScore(v), x + cw / 2, totalY + TOTAL_H / 2)
  })

  // ── 页脚署名：图片会脱离应用流传，得留一句它是什么工具出的
  ctx.font = F_FOOT
  ctx.fillStyle = C.dim
  ctx.textAlign = 'center'
  ctx.fillText(brand, w / 2, h - PAD / 2 - 4)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('canvas.toBlob failed'))
    }, 'image/png')
  })
}
