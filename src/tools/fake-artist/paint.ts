/**
 * 笔画的 canvas 绘制原语。坐标归一化到 0..1（见 [store.ts](store.ts) 的 `Stroke`），
 * 调用方负责乘回目标画布的像素尺寸。
 *
 * 共画板（[Board](Board.tsx)）、历史详情与画作导出图（[match.tsx](match.tsx)）
 * 三处画的是同一幅画，笔画样式只有这一份。
 */

/** 笔画宽度占画布短边的比例。桌上 50–70cm 斜视，细线读不出形状 */
const STROKE_W = 0.016

export function strokeWidth(w: number, h: number): number {
  return Math.max(6, Math.min(w, h) * STROKE_W)
}

export function paintStroke(
  ctx: CanvasRenderingContext2D,
  pts: readonly [number, number][],
  w: number,
  h: number,
  color: string,
) {
  if (pts.length === 0) return
  const width = strokeWidth(w, h)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  // 点一下就抬笔：一个圆点也算一笔
  if (pts.length === 1) {
    ctx.beginPath()
    ctx.arc(pts[0][0] * w, pts[0][1] * h, width / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.beginPath()
  ctx.moveTo(pts[0][0] * w, pts[0][1] * h)
  for (const [x, y] of pts.slice(1)) ctx.lineTo(x * w, y * h)
  ctx.stroke()
}
