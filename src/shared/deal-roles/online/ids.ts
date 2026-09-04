import { isBase36, randomBase36 } from '../../random'

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
  return isBase36(s, ID_LEN)
}
