/**
 * 用 crypto 而非 Math.random：桌游场景下随机公平性是玩家会当场质疑的点。
 * 拒绝采样丢弃尾部不完整区间，避免取模引入的分布偏差。
 */
export function rollDie(sides: number): number {
  const buf = new Uint32Array(1)
  const limit = Math.floor(0x1_0000_0000 / sides) * sides
  let x: number
  do {
    crypto.getRandomValues(buf)
    x = buf[0]
  } while (x >= limit)
  return (x % sides) + 1
}
