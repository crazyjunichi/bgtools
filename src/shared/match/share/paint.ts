import { PLAYER_HEX, type PlayerColor } from '../../players/colors'

/**
 * 导出图的绘制原语、版面尺度与外观调色板。
 *
 * **这一层不沿用屏幕上的任何取值。** 应用界面的规范（触控目标、最小字号、久盯不刺眼的深底）
 * 全是为「平板平放桌上、多人斜视」推出来的，而导出图是要脱离应用去流传的一张纸：
 * 没人会点它，所以行高由字号与行距推出来；也没有「一屏放完」，宽度由内容定、
 * 长名字折行而不是省略。尺度依据见 docs/DESIGN.md §3，调色板依据见 §2。
 *
 * 「外观」与「内容形式」是正交的两维：内容形式（通用的 [战绩榜](rank.ts)、
 * 各工具自己注册的明细图）只接一张 palette，**加一种外观不用碰任何渲染代码**。
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
const SANS =
  "system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
const MONO = "ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace"

/** 字号阶梯，等比档位，`label` 是正文基准。语义名而非尺寸名 —— 换档位只改这一处 */
export const TYPE = {
  foot: 13,
  meta: 16,
  label: 17,
  name: 20,
  num: 26,
  sum: 32,
  title: 34,
  hero: 44,
} as const

/** 留白单位。所有间距都是它的整数倍，整张图才有统一的呼吸节奏 */
export const U = 8

/** 版心边距。无框版面靠留白立住边界，边距压小了会显得图被裁过 */
export const PAD = U * 5

/** 行距系数。无框版面靠行距而不是框线分行，压紧了没有框线兜着、几行数字会连成一团 */
const LEAD = 1.6

export const lineH = (size: number) => Math.round(size * LEAD)

export const sans = (size: number, weight = 400) => `${weight} ${size}px ${SANS}`
export const mono = (size: number, weight = 700) => `${weight} ${size}px ${MONO}`

/**
 * 一套外观。canvas 拿不到类名，而 Tailwind 4 的色板是 `oklch()`、`fillStyle` 不认时
 * **静默失败**（沿用上一个颜色），所以这里只能是 hex 字面量。取值依据见 docs/DESIGN.md §2。
 */
export type SharePalette = {
  bg: string
  /** 规则线。无框版面只有标题下与合计上两条，所以它必须够实 */
  rule: string
  text: string
  muted: string
  dim: string
  /** 负分。**没有「正分色」** —— 见 `toneOf` */
  neg: string
  /** 领先者 */
  best: string
  /**
   * 玩家色条统一加的描边。浅底上「白」这类亮色条没有边界就看不见
   * （同 `PLAYER_HEX.black.ring` 在深底上的作用）。深色外观不需要，留 undefined
   */
  swatchStroke?: string
}

/**
 * 浅底：能直接打印，也是贴进聊天窗口/文档的默认选择。
 * 语义色走深档 —— 屏幕上那套亮色是为深底调的，放白底上会飘。
 */
const PRINT: SharePalette = {
  bg: '#ffffff',
  rule: '#a1a1aa',
  text: '#18181b',
  muted: '#3f3f46',
  dim: '#71717a',
  neg: '#c2410c',
  best: '#a16207',
  swatchStroke: '#52525b',
}

/**
 * 深色：**不照抄应用界面的深灰**。目标从「久盯不刺眼」换成「聊天流缩略图里一眼读清、
 * 被二次压缩也不糊」，所以底压得更黑、正文提到纯白、语义色更饱和。
 */
const DARK: SharePalette = {
  bg: '#101114',
  rule: '#565c65',
  text: '#ffffff',
  muted: '#c9ced6',
  dim: '#8f959e',
  neg: '#ff9a4d',
  best: '#ffc400',
}

export const PALETTES = { print: PRINT, dark: DARK }

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
export function beginPaint({ canvas, ctx }: Paint, w: number, h: number, p: SharePalette) {
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

export function hline(
  ctx: CanvasRenderingContext2D,
  color: string,
  x1: number,
  x2: number,
  y: number,
  width: number,
) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2, y)
  ctx.stroke()
}

/** 分区的规则线。**别改细** —— 发丝线在聊天软件的二次压缩里会整条消失 */
export function rule(
  ctx: CanvasRenderingContext2D,
  p: SharePalette,
  x1: number,
  x2: number,
  y: number,
  width = 2,
) {
  hline(ctx, p.rule, x1, x2, y, width)
}

/** 超宽就截断加省略号。**只用在宽度真的锁死的地方**（列头），行首列该走 `wrap` */
export function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text
  let s = text
  while (s.length > 1 && ctx.measureText(`${s}…`).width > max) s = s.slice(0, -1)
  return `${s}…`
}

/**
 * 折成最多 `maxLines` 行。最后一行仍超宽就交给 `fit` 截断。
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

/**
 * 明细格的字色。**正分不染色** —— 屏幕上给它上色是为了边填边确认符号，
 * 而一张已结算的图上颜色该留给异常（负分）和结果（合计与领先者）：
 * 明细行染成一片会把合计那排压成次要的，恰好反了。
 */
export function toneOf(p: SharePalette, v: number | undefined): string {
  if (v === undefined || v === 0) return p.dim
  return v < 0 ? p.neg : p.muted
}

/**
 * 玩家色条。**无框版面不画胶囊** —— 名字改用正文色画在旁边，颜色只留一条实心条：
 * 长名字不再受胶囊宽度限制，字也不必迁就十六种底色去反白。
 * 名字必须同时出现（同色允许被两人共用，颜色不许是唯一识别编码）。
 */
export function swatch(
  ctx: CanvasRenderingContext2D,
  p: SharePalette,
  color: PlayerColor,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const hex = PLAYER_HEX[color]
  rrect(ctx, x, y, w, h, Math.min(3, Math.min(w, h) / 2))
  ctx.fillStyle = hex.bg
  ctx.fill()
  // 与底色贴太近的那两个（深底上的黑、浅底上的白）不描边就成不了形
  const stroke = hex.ring ?? p.swatchStroke
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

/**
 * 一个大数字（合计 / 总分），**右对齐**：无框版面靠数位对齐分列，居中会让每列参差。
 * 领先者换 best 色并在下方压一条短线 —— 颜色之外的第二重编码，
 * 聊天软件的二次压缩会让色差失真，只靠颜色标冠军不可靠。
 */
export function bigNum(
  ctx: CanvasRenderingContext2D,
  p: SharePalette,
  text: string,
  lead: boolean,
  right: number,
  cy: number,
  size: number,
) {
  ctx.font = mono(size)
  ctx.fillStyle = lead ? p.best : p.text
  ctx.textAlign = 'right'
  ctx.fillText(text, right, cy)
  if (lead) {
    hline(ctx, p.best, right - ctx.measureText(text).width, right, cy + lineH(size) / 2 - 3, 3)
  }
}

/** 标题块的高度，正文从 `PAD + HEADER_H` 往下排 */
export const HEADER_H = lineH(TYPE.title) + lineH(TYPE.meta) + U

/**
 * 标题块：模板名 + 日期，下方压一条规则线。所有内容形式共用同一个头部 ——
 * 回看一堆导出图时，这两行就是唯一的身份。
 *
 * `icon` 只有战绩榜给：它常被单独转发，需要一眼认出是哪盒游戏。
 */
export function shareHeader(
  ctx: CanvasRenderingContext2D,
  p: SharePalette,
  s: { title: string; dateText: string },
  w: number,
  icon?: string,
) {
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'

  const titleY = PAD + lineH(TYPE.title) / 2
  let x = PAD
  // fillStyle 必须先给：beginPaint 留下的是底色，落墨色 emoji（部分单色字形）会画成隐形
  ctx.fillStyle = p.text
  if (icon) {
    ctx.font = sans(TYPE.title)
    ctx.fillText(icon, x, titleY)
    x += ctx.measureText(icon).width + U * 1.5
  }
  ctx.font = sans(TYPE.title, 700)
  ctx.fillText(fit(ctx, s.title, w - PAD - x), x, titleY)

  ctx.font = sans(TYPE.meta)
  ctx.fillStyle = p.dim
  ctx.fillText(s.dateText, PAD, PAD + lineH(TYPE.title) + lineH(TYPE.meta) / 2)

  rule(ctx, p, PAD, w - PAD, PAD + HEADER_H, 2.5)
}

/** 页脚，占 `U * 2 + lineH(TYPE.foot)`。图片会脱离应用流传，得留一句它是什么工具出的 */
export function footer(ctx: CanvasRenderingContext2D, p: SharePalette, brand: string, h: number) {
  ctx.font = sans(TYPE.foot)
  ctx.fillStyle = p.dim
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(brand, PAD, h - PAD - lineH(TYPE.foot) / 2)
}
