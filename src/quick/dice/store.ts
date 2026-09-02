import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DieSides } from '../../shared/dice/types'
import { rollDie } from '../../shared/random'

export const QUICK_DICE_TYPES = [4, 6, 8, 10, 12, 20] as const satisfies readonly DieSides[]
export const QUICK_MAX_COUNT = 4

type QuickDiceState = {
  /** 收成 DieSides 而不是 number：3D 层只有这六种几何，多的那种在这里就该编译不过 */
  sides: DieSides
  count: number
  /** 上次结果，dialog 关掉再打开还能看见 */
  last: number[] | null
  /** 投掷序号，3D 层靠它逐颗判断该不该起转（这里永远是全部一起转） */
  seq: number
  setSides: (sides: DieSides) => void
  setCount: (count: number) => void
  roll: () => void
}

/**
 * 与骰子工具页完全独立：顺手掷一下不该污染正式记录，也不该冲掉那边的当前结果。
 * 共享的只有 rollDie。
 */
export const useQuickDiceStore = create<QuickDiceState>()(
  persist(
    (set, get) => ({
      sides: 6,
      count: 1,
      last: null,
      seq: 0,

      // 换骰型/改数量要清结果：d20 掷出的 18 在 d6 上根本没有对应骰面，
      // 留着会让 3D 骰子和数字读数各说各话
      setSides: (sides) => set({ sides, last: null }),
      setCount: (count) => set({ count, last: null }),
      roll: () => {
        const { sides, count, seq } = get()
        set({ last: Array.from({ length: count }, () => rollDie(sides)), seq: seq + 1 })
      },
    }),
    {
      name: 'bgtools:quick-dice',
      partialize: ({ sides, count }) => ({ sides, count }),
    },
  ),
)
