import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { rollDie } from '../../shared/random'

export type Roll = {
  id: string
  sides: number
  values: number[]
  total: number
  at: number
}

export const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100] as const
export const MAX_COUNT = 12
const HISTORY_LIMIT = 20

type DiceState = {
  sides: number
  count: number
  last: Roll | null
  history: Roll[]
  setSides: (sides: number) => void
  setCount: (count: number) => void
  roll: () => Roll
  clearHistory: () => void
}

export const useDiceStore = create<DiceState>()(
  persist(
    (set, get) => ({
      sides: 6,
      count: 2,
      last: null,
      history: [],

      setSides: (sides) => set({ sides }),
      setCount: (count) => set({ count }),

      roll: () => {
        const { sides, count, history } = get()
        const values = Array.from({ length: count }, () => rollDie(sides))
        const roll: Roll = {
          id: crypto.randomUUID(),
          sides,
          values,
          total: values.reduce((a, b) => a + b, 0),
          at: Date.now(),
        }
        set({ last: roll, history: [roll, ...history].slice(0, HISTORY_LIMIT) })
        return roll
      },

      clearHistory: () => set({ history: [], last: null }),
    }),
    {
      name: 'bgtools:dice',
      partialize: ({ sides, count, history }) => ({ sides, count, history }),
    },
  ),
)
