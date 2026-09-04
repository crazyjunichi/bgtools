import { randomBase36 } from '../random'

/**
 * 玩家手机上的 rid 存档：房间号 → 自己的 rid。
 * 只记这个 —— 座位与游戏状态的真源在主机上，手机刷新后凭 rid 认回来。
 * 同 joinStore 的口径：落地页是外人设备，存的东西要克制。
 */
const STORE_KEY = 'bgtools:play'
/** 只留最近玩过的几个房间，外人手机不该无限攒我们的记录 */
const KEEP = 20

function readAll(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return {}
    const m: unknown = JSON.parse(raw)
    return m && typeof m === 'object' ? (m as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export function ridFor(room: string): string {
  const all = readAll()
  const existing = all[room]
  if (existing) return existing
  const rid = randomBase36(12)
  const entries = Object.entries(all).slice(-(KEEP - 1))
  entries.push([room, rid])
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(Object.fromEntries(entries)))
  } catch {
    // 隐私模式写不进：rid 照样用，只是下次刷新认不回座位 —— 不是崩点
  }
  return rid
}
