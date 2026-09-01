/**
 * 用 crypto 而非 Math.random：桌游场景下随机公平性是玩家会当场质疑的点。
 * 拒绝采样丢弃尾部不完整区间，避免取模引入的分布偏差。
 */
export function rollDie(sides: number): number {
  return randomBelow(sides) + 1
}

/**
 * Fisher–Yates 洗牌，返回新数组。抽签、排座、分组都走这里 ——
 * 随机实现集中在本文件是刻意的：散落各处早晚有人写回 Math.random。
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomBelow(i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** [0, n) 上的均匀整数 */
function randomBelow(n: number): number {
  const buf = new Uint32Array(1)
  const limit = Math.floor(0x1_0000_0000 / n) * n
  let x: number
  do {
    crypto.getRandomValues(buf)
    x = buf[0]
  } while (x >= limit)
  return x % n
}
