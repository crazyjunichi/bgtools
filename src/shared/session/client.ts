import type { JsonValue } from '@trystero-p2p/mqtt'
import { loadSessionTransport } from './transport'
import { ridFor } from './playerStore'
import { watchResume } from './resume'
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

/**
 * 连接诊断。卡在 connecting 时全靠它分辨断点在哪一层：
 * relay 0 = 信令都连不上（网络/relay 问题）；relay 有而 peer 0 = 配对没发生
 * （主机不在线）；peer ≥1 而 hello 发了没回音 = 通道通了但主机没回（主机侧的锅）。
 */
export type ClientDebug = {
  relaysOpen: number
  relaysTotal: number
  peers: number
  hellos: number
}

/** 握手没等到第一张视图的重发间隔与总预算 */
const HELLO_INTERVAL_MS = 3000
const CONNECT_BUDGET_MS = 60000
/*
 * 重进房间隔：trystero 只在进房头两秒连发 3 次 announce，之后沉默 60 秒一轮，
 * 公共 MQTT relay 丢消息又是常态 —— 干等 announce 会被 20 秒预算截杀。
 * 没配上就定时 leave + 重新 joinRoom，每轮换一波新的 announce 连发。
 * 抖动用计数推，不引入随机源（冷启动时各端时序本就错开）。
 */
const REJOIN_INTERVAL_MS = 5000
const REJOIN_STAGGER_MS = 1300

export async function joinSession(
  target: PlayTarget,
  onConn: (c: ClientConn) => void,
  onDebug?: (d: ClientDebug) => void,
): Promise<ClientSession> {
  const { joinRoom, getRelaySockets } = await loadSessionTransport()
  const rid = ridFor(target.room)

  let sendUp: ((msg: UpMsg) => void) | null = null

  let seq = 0
  let ready = false
  let closed = false
  /** 第一张视图从哪台 peer 来，主机就是谁 —— 玩家无法从加入顺序认出它 */
  let hostPeer: string | null = null
  let helloTimer = 0
  let budgetTimer = 0
  let rejoinTimer = 0
  let rejoining = false

  let peers = 0
  let hellos = 0
  const emitDebug = () => {
    if (closed || !onDebug) return
    const socks = getRelaySockets() as Record<string, WebSocket>
    const all = Object.values(socks)
    onDebug({
      relaysOpen: all.filter((s) => s.readyState === WebSocket.OPEN).length,
      relaysTotal: all.length,
      peers,
      hellos,
    })
  }
  const debugTimer = window.setInterval(emitDebug, 2000)

  const hello = () => {
    if (closed || ready || !sendUp) return
    hellos += 1
    emitDebug()
    // 广播而非找主机：房间里谁是主机玩家不知道也没必要知道，非主机会静默忽略
    sendUp({ rid, seq: 0, hello: true, data: null })
  }

  const scheduleRejoin = () => {
    window.clearTimeout(rejoinTimer)
    rejoinTimer = window.setTimeout(
      () => void rejoin(),
      REJOIN_INTERVAL_MS + (hellos % 3) * REJOIN_STAGGER_MS,
    )
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
    scheduleRejoin()
  }

  const disarmTimers = () => {
    window.clearInterval(helloTimer)
    window.clearTimeout(budgetTimer)
    window.clearTimeout(rejoinTimer)
  }

  const attach = () => {
    const room = joinRoom({ appId: 'bgtools', password: target.key }, target.room)
    const up = room.makeAction<UpMsg>('up')
    const down = room.makeAction<DownMsg>('down')
    sendUp = (msg) => void up.send(msg)
    peers = 0
    hostPeer = null

    // 主机可能比我们晚开房（先举码后开局），每个新 peer 都试一次握手
    room.onPeerJoin = () => {
      peers += 1
      emitDebug()
      hello()
    }

    room.onPeerLeave = (peerId) => {
      peers = Math.max(0, peers - 1)
      emitDebug()
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

    return room
  }

  let room = attach()

  const rejoin = async () => {
    if (closed || ready || rejoining) return
    rejoining = true
    try {
      const old = room
      sendUp = null
      // joinRoom 对同 roomId 有缓存，必须先 leave 干净再进，否则拿到的是旧房间
      await old.leave()
      if (closed || ready) return
      room = attach()
      emitDebug()
      hello()
    } finally {
      rejoining = false
      if (!ready) scheduleRejoin()
    }
  }

  const close = () => {
    if (closed) return
    closed = true
    disarmTimers()
    window.clearInterval(debugTimer)
    unwatchResume()
    void room.leave()
  }

  // 冻结恢复后旧通道状态不可信：自以为 ready 就降级重握手，否则立刻换一波 announce
  const unwatchResume = watchResume(() => {
    if (closed) return
    if (ready) {
      ready = false
      hostPeer = null
      onConn({ k: 'connecting' })
      armTimers()
    }
    void rejoin()
  })

  armTimers()
  hello()
  emitDebug()

  return {
    send(data) {
      if (closed || !ready) return
      seq += 1
      sendUp?.({ rid, seq, hello: false, data })
    },
    close,
  }
}
