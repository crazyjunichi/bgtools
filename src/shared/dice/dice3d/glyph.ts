import * as THREE from 'three'

const SIZE = 128
/** 字形可占的比例，留白既是视觉余量也给 emoji 自带的内边距让位 */
const SAFE = 0.86

const cache = new Map<string, THREE.Texture>()

/**
 * 骰面字形贴图。数字、符号 emoji 走同一条路 —— 面上画什么由骰组数据给，
 * 这里只负责把它画进一张正方形贴图。
 *
 * 缓存在模块级且故意不 dispose：一个骰型最多 20 张 128² 贴图，换骰型、
 * 重开界面都能直接复用，比每次重建再释放划算得多。key 带上字色，
 * 同一个字形在不同骰身色上要用不同的字色。
 */
export function glyphTexture(glyph: string, ink: string): THREE.Texture {
  const key = `${glyph}|${ink}`
  const hit = cache.get(key)
  if (hit) return hit

  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = ink

  /*
   * 字号靠实测收，不按字符数写死档位：一位数、两位数、emoji、双字符文本的字形
   * 尺寸差得远，写死必有一种顶出贴片。宽高都要量 —— emoji 常常是高度先撞边。
   */
  const base = SIZE * 0.84
  ctx.font = fontOf(base)
  const m = ctx.measureText(glyph)
  const height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
  const fit = Math.min(
    1,
    (SIZE * SAFE) / Math.max(m.width, 1),
    height > 0 ? (SIZE * SAFE) / height : 1,
  )
  ctx.font = fontOf(base * fit)

  // 6 和 9 转 180° 就是彼此，真骰子靠下划线区分，这里照抄
  const underline = glyph === '6' || glyph === '9'
  ctx.fillText(glyph, SIZE / 2, SIZE / 2 - (underline ? SIZE * 0.06 : 0))
  if (underline) {
    const w = SIZE * 0.34
    ctx.fillRect((SIZE - w) / 2, SIZE * 0.8, w, SIZE * 0.06)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  // 骰面是斜的，各向异性过滤直接决定倾斜时字形还认不认得出
  texture.anisotropy = 4
  cache.set(key, texture)
  return texture
}

function fontOf(px: number) {
  return `bold ${px}px system-ui, sans-serif`
}
