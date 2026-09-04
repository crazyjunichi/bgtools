import { isBase36, randomBase36 } from '../random'

/**
 * 联机会话的入场链接（二维码内容）。
 *
 * 三要素全在 fragment 里：room 是房间号，key 是 WebRTC 的加密口令 ——
 * **key 只走二维码**，不进任何信令 relay；relay 只看见一个随机房间号，
 * 不知道里面在玩什么，也解不开配对握手（这是 trystero password 的用途）。
 */

export const ROOM_ID_LEN = 12
export const ROOM_KEY_LEN = 16

export type PlayTarget = {
  tool: string
  room: string
  key: string
}

export function newRoomCredentials(): { id: string; key: string } {
  return { id: randomBase36(ROOM_ID_LEN), key: randomBase36(ROOM_KEY_LEN) }
}

export function encodePlayLink(base: string, p: PlayTarget): string {
  return `${base}#/play?tool=${p.tool}&room=${p.room}&key=${p.key}`
}

/** 二维码是外部输入：形态不对的直接判废，不进会话层 */
export function decodePlayLink(search: string): PlayTarget | null {
  const q = new URLSearchParams(search)
  const tool = q.get('tool') ?? ''
  const room = q.get('room') ?? ''
  const key = q.get('key') ?? ''
  if (!/^[a-z0-9-]+$/.test(tool)) return null
  if (!isBase36(room, ROOM_ID_LEN) || !isBase36(key, ROOM_KEY_LEN)) return null
  return { tool, room, key }
}
