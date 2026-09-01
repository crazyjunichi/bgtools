import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { rollDie } from '../../shared/random'

export const QUICK_DICE_TYPES = [4, 6, 8, 10, 12, 20] as const
export const QUICK_MAX_COUNT = 4

type QuickDiceState = {
  sides: number
  count: number
  /**
   * 上次结果，dialog 关掉再打开还能看见。
   * 每次 roll 都换成**新数组**（哪怕点数完全一样）—— 3D 落点动画靠这个身份变化
   * 判断「又掷了一次」，不要为了省一次渲染改成原地改数组
   */
  last: number[] | null
  setSides: (sides: number) => void
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

      // 换骰型/改数量要清结果：d20 掷出的 18 在 d6 上根本没有对应骰面，
      // 留着会让 3D 骰子和数字读数各说各话
      setSides: (sides) => set({ sides, last: null }),
      setCount: (count) => set({ count, last: null }),
      roll: () => {
        const { sides, count } = get()
        set({ last: Array.from({ length: count }, () => rollDie(sides)) })
      },
    }),
    {
      name: 'bgtools:quick-dice',
      partialize: ({ sides, count }) => ({ sides, count }),
    },
  ),
)
