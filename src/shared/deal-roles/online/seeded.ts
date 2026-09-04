import { randomBase36 } from '../../random'

/**
 * 可复现的洗牌。
 *
 * 各玩家的手机彼此不通信，只能各自从"配比 + 种子"算出同一副牌，再按排队序号取自己那张 ——
 * 所以这里必须是确定性的，不能用 [random.ts](../../random.ts) 的 crypto 洗牌。
 *
 * **公平性仍由 crypto 保证**：种子由 `newSeed()` 生成，一局一个新的；确定性的只是
 * "种子 → 序列"这段展开。任何情况下都不许用 `Math.random` 生成种子。
 */
const SEED_LEN = 11

/** 一局一个新种子，进二维码 */
export function newSeed(): string {
  return randomBase36(SEED_LEN)
}

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const rand = sfc32(cyrb128(seed))
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** 字符串 → 四个 32 位种子字（cyrb128）。种子只有十来个字符，直接喂 PRNG 状态会撞初值 */
function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703
  let h2 = 3144134277
  let h3 = 1013904242
  let h4 = 2773480762
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i)
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067)
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213)
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179)
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0]
}

/** sfc32：小状态、无乘法依赖，同一段 JS 在各浏览器上逐位一致 —— 跨设备复现要的就是这个 */
function sfc32([sa, sb, sc, sd]: [number, number, number, number]): () => number {
  let a = sa
  let b = sb
  let c = sc
  let d = sd
  return () => {
    a |= 0
    b |= 0
    c |= 0
    d |= 0
    const t = (((a + b) | 0) + d) | 0
    d = (d + 1) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    c = (c + t) | 0
    return (t >>> 0) / 4294967296
  }
}
