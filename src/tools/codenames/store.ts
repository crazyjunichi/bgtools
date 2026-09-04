import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { newBoard, otherTeam, remaining, type CellKind, type Team } from './game'

type State = {
  phase: 'setup' | 'playing' | 'over'
  words: string[]
  key: CellKind[]
  revealed: boolean[]
  turn: Team
  winner: Team | null
  byAssassin: boolean
  lastActiveAt: number
}

type Actions = {
  newGame(): void
  tapWord(i: number): void
  pass(): void
}

const INITIAL: State = {
  phase: 'setup',
  words: [],
  key: [],
  revealed: [],
  turn: 'red',
  winner: null,
  byAssassin: false,
  lastActiveAt: Date.now(),
}

function endTurn(s: State): Partial<State> {
  return { turn: otherTeam(s.turn), lastActiveAt: Date.now() }
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
          winner: null,
          byAssassin: false,
          lastActiveAt: Date.now(),
        })
      },

      // 口头出题：线索与次数不进系统，点词不限次
      tapWord(i) {
        const s = get()
        if (s.phase !== 'playing' || s.winner !== null) return
        if (i < 0 || i >= s.words.length || s.revealed[i]) return

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
        set(base)
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
