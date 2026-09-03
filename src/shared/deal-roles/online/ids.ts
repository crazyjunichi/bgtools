/**
 * 牌局 id 与领取 id。
 *
 * **定长 12 是协议的一部分**：数据库规则里硬校验 `$gameId.length === 12` /
 * `$rid.length === 12`，改长度就得让所有组织者重新发布规则。
 *
 * gameId 还兼作"猜不到的入口"：只读权限是全开的，别人拿到数据库地址也得先猜到
 * gameId 才能看见那一局的时间戳（而时间戳里没有身份信息）。
 */
const ID_LEN = 12

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

/** 牌局 id，由组织者生成，进二维码 */
export function newGameId(): string {
  return randomBase36(ID_LEN)
}

/** 领取 id，由玩家自己生成，只有他自己知道 —— 服务端不认人，凭这个 id 幂等重领 */
export function newRid(): string {
  return randomBase36(ID_LEN)
}

/** 二维码里的 id 是外部输入，进网络请求前先按协议形态卡一道 */
export function isId(s: string): boolean {
  return s.length === ID_LEN && [...s].every((c) => ALPHABET.includes(c))
}

/**
 * crypto 的定长 base36 串。拒绝采样丢掉尾部不完整区间，否则取模会让开头几个字母偏多。
 * 同 [random.ts](../../random.ts)：随机不用 Math.random，桌游场景公平性会被当场质疑。
 */
export function randomBase36(len: number): string {
  const out: string[] = []
  const buf = new Uint8Array(len)
  const limit = Math.floor(256 / ALPHABET.length) * ALPHABET.length
  while (out.length < len) {
    crypto.getRandomValues(buf)
    for (const b of buf) {
      if (b >= limit) continue
      out.push(ALPHABET[b % ALPHABET.length])
      if (out.length === len) break
    }
  }
  return out.join('')
}
