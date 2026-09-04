import type { JsonValue } from '@trystero-p2p/mqtt'
import { loadSessionTransport } from './transport'
import { ridFor } from './playerStore'
import type { PlayTarget } from './payload'
import type { DownMsg, UpMsg } from './types'

/**
 * 联机会话的玩家侧（手机）。哑终端：渲染主机下发的视图、把点击变成动作上报，
 * 不算任何游戏规则。
 *
 * 主机会在局中途消失又回来（平板刷新页面、切后台被回收）：room 凭据不变，
 * 它重新出现在房间里时玩家要重新握手认回座位 —— 靠记下主机 peerId、
 * 它掉线就回到 connecting 再发 hello。
 */

export type ClientConn =
  | { k: 'connecting' }
  | { k: 'ready'; view: JsonValue }
  | { k: 'rejected' }
  | { k: 'failed' }

export type ClientSession = {
  send(data: JsonValue): void
  close(): void
}

/** 握手没等到第一张视图的重发间隔与总预算 */
const HELLO_INTERVAL_MS = 3000
const CONNECT_BUDGET_MS = 20000

export async function joinSession(
  target: PlayTarget,
  onConn: (c: ClientConn) => void,
): Promise<ClientSession> {
  const { joinRoom } = await loadSessionTransport()
  const rid = ridFor(target.room)
  const room = joinRoom({ appId: 'bgtools', password: target.key }, target.room)

  const up = room.makeAction<UpMsg>('up')
  const down = room.makeAction<DownMsg>('down')

  let seq = 0
  let ready = false
  let closed = false
  /** 第一张视图从哪台 peer 来，主机就是谁 —— 玩家无法从加入顺序认出它 */
  let hostPeer: string | null = null
  let helloTimer = 0
  let budgetTimer = 0

  const hello = () => {
    if (closed || ready) return
    // 广播而非找主机：房间里谁是主机玩家不知道也没必要知道，非主机会静默忽略
    void up.send({ rid, seq: 0, hello: true, data: null })
  }

  const armTimers = () => {
    window.clearInterval(helloTimer)
    window.clearTimeout(budgetTimer)
    helloTimer = window.setInterval(hello, HELLO_INTERVAL_MS)
    budgetTimer = window.setTimeout(() => {
      if (!ready) {
        onConn({ k: 'failed' })
        close()
      }
    }, CONNECT_BUDGET_MS)
  }

  const disarmTimers = () => {
    window.clearInterval(helloTimer)
    window.clearTimeout(budgetTimer)
  }

  // 主机可能比我们晚开房（先举码后开局），每个新 peer 都试一次握手
  room.onPeerJoin = () => hello()

  room.onPeerLeave = (peerId) => {
    if (peerId !== hostPeer || closed) return
    hostPeer = null
    ready = false
    onConn({ k: 'connecting' })
    armTimers()
    hello()
  }

  down.onMessage = (msg, { peerId }) => {
    if (closed || !msg || typeof msg !== 'object') return
    if (msg.ok) {
      hostPeer = peerId
      ready = true
      disarmTimers()
      onConn({ k: 'ready', view: msg.view })
    } else {
      onConn({ k: 'rejected' })
      close()
    }
  }

  const close = () => {
    if (closed) return
    closed = true
    disarmTimers()
    void room.leave()
  }

  armTimers()
  hello()

  return {
    send(data) {
      if (closed || !ready) return
      seq += 1
      void up.send({ rid, seq, hello: false, data })
    },
    close,
  }
}
