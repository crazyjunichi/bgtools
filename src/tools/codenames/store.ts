import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { newRoomCredentials } from '../../shared/session/payload'
import { newBoard, otherTeam, remaining, type CellKind, type Team } from './game'

export type Clue = { word: string; n: number }

type State = {
  phase: 'setup' | 'playing' | 'over'
  words: string[]
  key: CellKind[]
  revealed: boolean[]
  turn: Team
  /** 当前线索。null = 还没出题 —— 单机模式下点词不设次数上限 */
  clue: Clue | null
  guessesLeft: number
  winner: Team | null
  byAssassin: boolean
  /** 队伍 → 玩家 rid。座位绑定持久化：主机刷新后手机端能直接认回 */
  seats: Record<Team, string | null>
  /** 联机房间凭据。持久化：主机刷新后同一个二维码依然有效 */
  room: { id: string; key: string } | null
  lastActiveAt: number
}

type Actions = {
  newGame(): void
  openRoom(): void
  closeRoom(): void
  /** 占位。已被别人占着就拒（返回 false）；已坐另一队则换队 */
  claimSeat(rid: string, team: Team): boolean
  freeSeat(team: Team): void
  /** 手机上出题。规则校验全在这里，返回是否受理 */
  submitClue(rid: string, word: string, n: number): boolean
  tapWord(i: number): void
  pass(): void
}

const INITIAL: State = {
  phase: 'setup',
  words: [],
  key: [],
  revealed: [],
  turn: 'red',
  clue: null,
  guessesLeft: 0,
  winner: null,
  byAssassin: false,
  seats: { red: null, blue: null },
  room: null,
  lastActiveAt: Date.now(),
}

function endTurn(s: State): Partial<State> {
  return { turn: otherTeam(s.turn), clue: null, guessesLeft: 0, lastActiveAt: Date.now() }
}

export const useCodenamesStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      newGame() {
        const b = newBoard()
        set({
          phase: 'playing',
          words: b.words,
          key: b.key,
          revealed: b.words.map(() => false),
          turn: b.starting,
          clue: null,
          guessesLeft: 0,
          winner: null,
          byAssassin: false,
          lastActiveAt: Date.now(),
        })
      },

      openRoom() {
        if (!get().room) set({ room: newRoomCredentials() })
      },

      closeRoom() {
        set({ room: null, seats: { red: null, blue: null } })
      },

      claimSeat(rid, team) {
        const { seats } = get()
        if (seats[team] && seats[team] !== rid) return false
        set({ seats: { ...seats, red: seats.red === rid ? null : seats.red, blue: seats.blue === rid ? null : seats.blue, [team]: rid } })
        return true
      },

      freeSeat(team) {
        set((s) => ({ seats: { ...s.seats, [team]: null } }))
      },

      submitClue(rid, word, n) {
        const s = get()
        if (s.phase !== 'playing' || s.clue !== null) return false
        if (s.seats[s.turn] !== rid) return false
        const w = word.trim()
        // 线索词不许落在牌面上（官方规则）；n 卡 0..9
        if (!w || w.length > 12 || s.words.includes(w)) return false
        if (!Number.isInteger(n) || n < 0 || n > 9) return false
        set({ clue: { word: w, n }, guessesLeft: n + 1, lastActiveAt: Date.now() })
        return true
      },

      tapWord(i) {
        const s = get()
        if (s.phase !== 'playing' || s.winner !== null) return
        if (i < 0 || i >= s.words.length || s.revealed[i]) return
        // 手机出了题就按次数走；没出题（单机口头出题）不限次数
        if (s.clue !== null && s.guessesLeft <= 0) return

        const revealed = s.revealed.slice()
        revealed[i] = true
        const cell = s.key[i]
        const base = { revealed, lastActiveAt: Date.now() }

        if (cell === 'assassin') {
          set({ ...base, phase: 'over', winner: otherTeam(s.turn), byAssassin: true })
          return
        }
        const hit = cell === s.turn ? s.turn : cell === 'neutral' ? null : otherTeam(s.turn)
        if (hit && remaining(s.key, revealed, hit) === 0) {
          // 翻出对方最后一词也算对方赢 —— 翻到即归所属队，与归属无关
          set({ ...base, phase: 'over', winner: hit, byAssassin: false })
          return
        }
        if (cell !== s.turn) {
          set({ ...base, ...endTurn({ ...s, revealed }) })
          return
        }
        const guessesLeft = s.clue === null ? 0 : s.guessesLeft - 1
        if (s.clue !== null && guessesLeft <= 0) {
          set({ ...base, ...endTurn({ ...s, revealed }) })
          return
        }
        set({ ...base, guessesLeft })
      },

      pass() {
        const s = get()
        if (s.phase !== 'playing') return
        set(endTurn(s))
      },
    }),
    {
      name: 'bgtools:codenames',
    },
  ),
)
