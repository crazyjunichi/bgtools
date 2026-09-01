import * as THREE from 'three'

const SIZE = 128
/** 与 text-ink 同色：琥珀骰身上的深字对比度 ≈9:1，斜视下也不糊 */
const INK = '#0a0a0a'

const cache = new Map<number, THREE.Texture>()

/**
 * 骰面数字贴图。缓存在模块级且故意不 dispose —— 最多 20 张 128² 贴图，
 * 换骰型、关掉再打开 dialog 都能直接复用，比每次重建再释放划算得多。
 */
export function numeralTexture(value: number): THREE.Texture {
  const hit = cache.get(value)
  if (hit) return hit

  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')

  const label = String(value)
  // 两位数得缩一档才不顶到贴片边缘
  ctx.font = `bold ${label.length > 1 ? SIZE * 0.62 : SIZE * 0.84}px system-ui, sans-serif`
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 6 和 9 转 180° 就是彼此，真骰子靠下划线区分，这里照抄
  const underline = value === 6 || value === 9
  ctx.fillText(label, SIZE / 2, SIZE / 2 - (underline ? SIZE * 0.06 : 0))
  if (underline) {
    const w = SIZE * 0.34
    ctx.fillRect((SIZE - w) / 2, SIZE * 0.8, w, SIZE * 0.06)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  // 骰面是斜的，各向异性过滤直接决定倾斜时数字还认不认得出
  texture.anisotropy = 4
  cache.set(value, texture)
  return texture
}
