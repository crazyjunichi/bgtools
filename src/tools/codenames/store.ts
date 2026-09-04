import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { newBoard, otherTeam, remaining, type CellKind, type Mark, type Team } from './game'

type State = {
  phase: 'setup' | 'playing' | 'over'
  words: string[]
  key: CellKind[]
  revealed: boolean[]
  /** 与 revealed 等长。旧存档没有这字段，浅合并补成空数组，老格子视为无角标 */
  marks: (Mark | null)[]
  /** 各队自己的回合计数（从 1 起）：角标显示的是「我队第 N 回合」，双方首回合都是 1 */
  turnNo: Record<Team, number>
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
  marks: [],
  turnNo: { red: 0, blue: 0 },
  turn: 'red',
  winner: null,
  byAssassin: false,
  lastActiveAt: Date.now(),
}

function endTurn(s: State): Partial<State> {
  const next = otherTeam(s.turn)
  return {
    turn: next,
    turnNo: { ...s.turnNo, [next]: s.turnNo[next] + 1 },
    lastActiveAt: Date.now(),
  }
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
          marks: b.words.map(() => null),
          turnNo: { red: 0, blue: 0, [b.starting]: 1 },
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
        // 旧存档 marks 是空数组，先补齐再落标记；turnNo 同为后补字段，缺省从 1 记起
        const marks = s.marks.length === s.words.length ? s.marks.slice() : s.words.map(() => null)
        marks[i] = { by: s.turn, turn: Math.max(1, s.turnNo[s.turn]) }
        const cell = s.key[i]
        const base = { revealed, marks, lastActiveAt: Date.now() }

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
