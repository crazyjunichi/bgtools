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

const BASE36 = '0123456789abcdefghijklmnopqrstuvwxyz'

/**
 * crypto 的定长 base36 串，用作各类会话/牌局 id。拒绝采样同 randomBelow。
 * 从 deal-roles/online/ids.ts 上提：联机会话（shared/session）是第二个用点。
 */
export function randomBase36(len: number): string {
  const out: string[] = []
  const buf = new Uint8Array(len)
  const limit = Math.floor(256 / BASE36.length) * BASE36.length
  while (out.length < len) {
    crypto.getRandomValues(buf)
    for (const b of buf) {
      if (b >= limit) continue
      out.push(BASE36[b % BASE36.length])
      if (out.length === len) break
    }
  }
  return out.join('')
}

/** base36 定长串的格式校验：二维码里的 id 是外部输入，进网络请求前先按形态卡一道 */
export function isBase36(s: string, len: number): boolean {
  return s.length === len && [...s].every((c) => BASE36.includes(c))
}
