import { PLAYER_HEX, type PlayerColor } from '../../../shared/players/colors'

/**
 * 导出图的绘制原语与外观调色板。
 *
 * 导出**不截屏、不复刻 DOM** —— 这是为「拍下来发群里 / 打出来」重排的一张纸：
 * 列宽按实测文字定、不横滚、不裁剪，屏幕上那些只在触屏才有意义的东西
 * （选中环、铅笔图标、添加条目行）一概不画。
 *
 * 「外观」与「内容形式」是正交的两维：内容形式（[matrix](matrix.ts) / [rank](rank.ts)）
 * 只接一张 palette，**加一种外观不用碰任何渲染代码**。
 *
 * 返回 Blob 而非 dataURL：`navigator.share({ files })` 要的就是 `File`，
 * 而 base64 串比二进制明显更占内存。
 */

/** 导出图固定 2x，**不跟设备 DPR** —— 同一局在手机和平板上导出该得到同一张图 */
const DENSITY = 2

/**
 * 字体栈抄自 [index.css](../../../index.css) 的 `--font-sans` / `--font-mono`。
 * 没有从 CSS 变量读：Tailwind 4 会把没用到的 theme 变量摇掉，取空串就退成默认衬线体了。
 */
export const SANS =
  "system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
export const MONO = "ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace"

/**
 * 一套外观。canvas 拿不到类名，而 Tailwind 4 的色板是 `oklch()`、`fillStyle` 不认时
 * **静默失败**（沿用上一个颜色），所以这里只能是 hex 字面量。取值依据见 docs/DESIGN.md §2。
 */
export type SheetPalette = {
  bg: string
  /** 格子/条目底 */
  cell: string
  line: string
  text: string
  muted: string
  dim: string
  /** 正分 */
  pos: string
  /** 负分 */
  neg: string
  /** 领先者 */
  best: string
  /**
   * 玩家色胶囊统一加的描边。浅底上「白」这类亮色胶囊没有边界就成不了形
   * （同 `PLAYER_HEX.black.ring` 在深底上的作用）。深色外观不需要，留 undefined
   */
  chipStroke?: string
}

/** 深色：与屏幕上的计分纸同一套取值（`@theme` + [tone.ts](../../../shared/tone.ts)） */
const DARK: SheetPalette = {
  bg: '#17181a', // --color-surface
  cell: '#262829', // --color-surface-2
  line: '#454a4f', // --color-line
  text: '#f5f5f5', // --color-text
  muted: '#b4b8bd', // --color-text-muted
  dim: '#8b9096', // --color-text-dim
  pos: '#46ecd5', // teal-300
  neg: '#ffb86a', // orange-300
  best: '#ffd230', // amber-300
}

/** 浅底印刷：能直接打印或贴进浅色文档。语义色必须换深档，屏幕上那套 300 档在白底上会飘 */
const PRINT: SheetPalette = {
  bg: '#ffffff',
  cell: '#f1f2f4',
  line: '#a1a1aa', // zinc-400
  text: '#18181b', // zinc-900
  muted: '#3f3f46', // zinc-700
  dim: '#71717a', // zinc-500
  pos: '#0f766e', // teal-700
  neg: '#c2410c', // orange-700
  best: '#a16207', // yellow-700
  chipStroke: '#52525b', // zinc-600
}

export const PALETTES = { dark: DARK, print: PRINT }

export type Paint = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }

export function createPaint(): Paint {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d unavailable')
  return { canvas, ctx }
}

/**
 * 定尺寸并铺底。**必须在量完文字之后才调** —— 设 `width` 会重置全部绘图状态，
 * 缩放也只能放在这之后。
 */
export function beginPaint({ canvas, ctx }: Paint, w: number, h: number, p: SheetPalette) {
  canvas.width = w * DENSITY
  canvas.height = h * DENSITY
  ctx.scale(DENSITY, DENSITY)
  ctx.fillStyle = p.bg
  ctx.fillRect(0, 0, w, h)
}

export function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('canvas.toBlob failed'))
    }, 'image/png')
  })
}

/** 圆角矩形。`roundRect` 在旧 Safari 上不存在，缺了要退成直角而不是抛异常 */
export function rrect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  // 不能用 `'roundRect' in ctx`：lib.dom 里它是必有成员，`in` 会把 else 分支收窄成 never
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

/** 超宽就截断加省略号 —— 画布不会自动换行，不截就直接压到隔壁列上 */
export function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text
  let s = text
  while (s.length > 1 && ctx.measureText(`${s}…`).width > max) s = s.slice(0, -1)
  return `${s}…`
}

/**
 * 折成最多 `maxLines` 行。条目名当列头时（[transposed](matrix.ts)）单行会把表拉得极宽，
 * 折行才能把列宽压回可读范围；最后一行仍超宽就交给 `fit` 截断。
 *
 * 英文按空格断，中文没有词边界只能逐字符断 —— 所以先试空格、退化到逐字。
 */
export function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  max: number,
  maxLines: number,
): string[] {
  if (ctx.measureText(text).width <= max) return [text]

  const lines: string[] = []
  let rest = text
  while (rest.length > 0 && lines.length < maxLines - 1) {
    let cut = rest.length
    while (cut > 1 && ctx.measureText(rest.slice(0, cut)).width > max) cut--
    // 断点落在词中间时回退到最近的空格，回退不到（中文/长单词）就照原样切
    const space = rest.lastIndexOf(' ', cut)
    if (space > 0 && cut < rest.length) cut = space
    lines.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest.length > 0) lines.push(fit(ctx, rest, max))
  return lines
}

export function widest(ctx: CanvasRenderingContext2D, font: string, texts: string[]): number {
  ctx.font = font
  return texts.reduce((m, s) => Math.max(m, ctx.measureText(s).width), 0)
}

export function toneOf(p: SheetPalette, v: number | undefined): string {
  if (v === undefined || v === 0) return p.dim
  return v > 0 ? p.pos : p.neg
}

/**
 * 玩家色胶囊，与屏幕上的列头同一套配色。**名字画在胶囊里**：
 * 玩家色允许被两个人共用，颜色不许是唯一识别编码。
 */
export function seatChip(
  ctx: CanvasRenderingContext2D,
  p: SheetPalette,
  seat: { name: string; color: PlayerColor },
  x: number,
  y: number,
  w: number,
  h: number,
  font: string,
  inset: number,
) {
  const hex = PLAYER_HEX[seat.color]
  rrect(ctx, x, y, w, h, 10)
  ctx.fillStyle = hex.bg
  ctx.fill()
  // 深底上只有「黑」需要亮描边成形；浅底上每个胶囊都要，靠 palette 给
  const stroke = hex.ring ?? p.chipStroke
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.stroke()
  }
  ctx.font = font
  ctx.fillStyle = hex.fg
  ctx.textAlign = 'center'
  ctx.fillText(fit(ctx, seat.name, w - inset), x + w / 2, y + h / 2)
}

/** 页脚署名：图片会脱离应用流传，得留一句它是什么工具出的 */
export function footer(
  ctx: CanvasRenderingContext2D,
  p: SheetPalette,
  brand: string,
  w: number,
  y: number,
  font: string,
) {
  ctx.font = font
  ctx.fillStyle = p.dim
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(brand, w / 2, y)
}
