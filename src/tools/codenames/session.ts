import { create } from 'zustand'
import { createHostSession, type HostSession } from '../../shared/session/host'
import { remaining } from './game'
import { useCodenamesStore } from './store'
import type { ClientAction, PublicView, SpymasterView } from './view'

/**
 * 行动代号的主机接线：store 是真源，session 只是把「状态裁剪版发出去、
 * 把动作收进来」的那条边。store 一变就重推，动作校验全在 store 里。
 */

/** 在线玩家数：瞬时连接状态，不进持久化的局面 store */
export const useSessionPeers = create<{ n: number }>(() => ({ n: 0 }))

let session: HostSession | null = null
let opening = false
let unsub: (() => void) | null = null

/** 这些字段变了才重推；peersOnline 这类运行时状态不在其列（它不在这份 store 里） */
const SYNC_FIELDS = [
  'phase',
  'words',
  'revealed',
  'turn',
  'clue',
  'guessesLeft',
  'winner',
  'byAssassin',
  'seats',
] as const

function publicView(s: ReturnType<typeof useCodenamesStore.getState>): PublicView {
  return {
    phase: s.phase,
    words: s.words,
    revealed: s.revealed,
    turn: s.turn,
    clue: s.clue,
    guessesLeft: s.guessesLeft,
    winner: s.winner,
    byAssassin: s.byAssassin,
    remaining: {
      red: s.key.length ? remaining(s.key, s.revealed, 'red') : 0,
      blue: s.key.length ? remaining(s.key, s.revealed, 'blue') : 0,
    },
  }
}

function viewForRid(rid: string): SpymasterView {
  const s = useCodenamesStore.getState()
  const pub = publicView(s)
  const team = s.seats.red === rid ? 'red' : s.seats.blue === rid ? 'blue' : null
  if (!team) {
    return { kind: 'claim', seatsFree: { red: !s.seats.red, blue: !s.seats.blue }, ...pub }
  }
  return { kind: 'spy', team, key: s.key, ...pub }
}

/** 页面在 room 存在期间持续调用；幂等，建好了就直接返回 */
export async function ensureSession(): Promise<void> {
  if (session || opening) return
  const { room } = useCodenamesStore.getState()
  if (!room) return
  opening = true
  try {
    const s = await createHostSession(room.id, room.key, {
      onAction(rid, data) {
        // 网络输入：先卡形状再进 store
        if (!data || typeof data !== 'object') return
        const a = data as ClientAction
        if (a.k === 'claim' && (a.team === 'red' || a.team === 'blue')) {
          useCodenamesStore.getState().claimSeat(rid, a.team)
        } else if (a.k === 'clue' && typeof a.word === 'string' && typeof a.n === 'number') {
          useCodenamesStore.getState().submitClue(rid, a.word, a.n)
        }
      },
      viewFor: viewForRid,
      onPeers: (n) => useSessionPeers.setState({ n }),
    })
    // 等 chunk 加载的间隙里房间可能已被关掉（关联机/离页），迟到的 session 立即销毁
    const cur = useCodenamesStore.getState().room
    if (!cur || cur.id !== room.id) {
      s.close()
      return
    }
    session = s
    unsub = useCodenamesStore.subscribe((state, prev) => {
      if (SYNC_FIELDS.some((f) => state[f] !== prev[f])) s.push()
    })
  } finally {
    opening = false
  }
}

export function closeSession(): void {
  unsub?.()
  unsub = null
  session?.close()
  session = null
  useSessionPeers.setState({ n: 0 })
}
