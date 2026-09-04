import type { JsonValue, Room } from '@trystero-p2p/mqtt'
import { loadSessionTransport } from './transport'
import type { DownMsg, UpMsg } from './types'

/**
 * 联机会话的主机侧。**主机就是桌上那台平板**：它持有游戏状态真源，
 * 玩家手机只发动作、收自己该看的视图（主机权威模型，没有服务器）。
 *
 * 传输是 WebRTC DataChannel（P2P 直连），公共 MQTT relay 只在配对瞬间做信令，
 * 游戏数据一个字节都不经过它。
 */

export type HostHooks = {
  /**
   * 游戏动作入口。seq 幂等已由会话层过滤（重发不会到这），
   * 但 `data` 的内容是外部输入，形状校验由游戏自己做。
   */
  onAction(rid: string, data: JsonValue): void
  /** 某个 rid 此刻该看见的视图，按人裁剪在这里做。返回 null = 不接待它 */
  viewFor(rid: string): JsonValue | null
  /** 在线玩家数变化（给「已连接 X 台」用） */
  onPeers?(n: number): void
}

export type HostSession = {
  /** 状态变了，给所有在线玩家重推视图 */
  push(): void
  close(): void
}

export async function createHostSession(
  roomId: string,
  password: string,
  hooks: HostHooks,
): Promise<HostSession> {
  const { joinRoom } = await loadSessionTransport()
  const room: Room = joinRoom({ appId: 'bgtools', password }, roomId)

  // rid → 当前连接的 peerId。rid 稳定、peerId 每次重连都变，绑定关系只活在内存里
  const bound = new Map<string, string>()
  const lastSeq = new Map<string, number>()

  const up = room.makeAction<UpMsg>('up')
  const down = room.makeAction<DownMsg>('down')

  const pushTo = (rid: string) => {
    const peerId = bound.get(rid)
    if (!peerId) return
    const view = hooks.viewFor(rid)
    const msg: DownMsg = view === null ? { ok: false } : { ok: true, view }
    void down.send(msg, { target: peerId })
  }

  up.onMessage = (msg, { peerId }) => {
    // 网络输入先卡形状
    if (!msg || typeof msg !== 'object') return
    const { rid, seq, hello, data } = msg
    if (typeof rid !== 'string' || typeof seq !== 'number') return

    if (hello) {
      bound.set(rid, peerId)
      lastSeq.set(rid, 0)
      hooks.onPeers?.(bound.size)
      pushTo(rid)
      return
    }
    if (bound.get(rid) !== peerId) return
    if (seq <= (lastSeq.get(rid) ?? 0)) return
    lastSeq.set(rid, seq)
    hooks.onAction(rid, data)
  }

  room.onPeerLeave = (peerId) => {
    for (const [rid, pid] of bound) {
      if (pid === peerId) {
        bound.delete(rid)
        hooks.onPeers?.(bound.size)
        break
      }
    }
  }

  return {
    push() {
      for (const rid of bound.keys()) pushTo(rid)
    },
    close() {
      void room.leave()
    },
  }
}
