import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { rollDie } from '../random'
import { DICE_SETS, findDiceSet } from './presets'
import type { DiceSet } from './types'

export type DieResult = {
  /** 面号 1..N，取内容是 `spec.faces[face - 1]` */
  face: number
  locked: boolean
  /** 投掷序号，3D 层靠它判断这一颗该不该起转 */
  spin: number
}

type DiceState = {
  setId: string
  /** 参与投掷的骰子下标（骰组 dice 数组的 index），保持升序 = 骰组顺序 */
  selected: number[]
  /** 下标 → 结果。只有掷过的骰子在里面 */
  results: Record<number, DieResult>
  seq: number

  /** 进游戏页时调。骰组变了清结果，同一组则只做一次越界清理 */
  setSet: (id: string) => void
  toggleDie: (index: number) => void
  selectAll: () => void
  selectNone: () => void
  roll: () => void
  toggleLock: (index: number) => void
  clear: () => void
}

const allOf = (set: DiceSet) => set.dice.map((_, i) => i)

/**
 * 骰子界面的当前局面。**跨游戏共用一份** —— 同一时刻桌上只会在玩一盒游戏，
 * 每个游戏页各持一份状态只会让「上次掷的还在」变得难以预期。
 *
 * 与顶栏快捷骰子（[quick/dice/store.ts](../../quick/dice/store.ts)）刻意分开：
 * 顺手掷一下不该冲掉正在进行的那局结果。
 */
export const useDiceStore = create<DiceState>()(
  persist(
    (set, get) => ({
      setId: DICE_SETS[0].id,
      selected: allOf(DICE_SETS[0]),
      results: {},
      seq: 0,

      setSet: (id) => {
        const target = findDiceSet(id)
        if (!target) return
        if (get().setId === id) {
          // 持久化存的是下标：骰组改小过之后，旧下标会指到不存在的骰子上
          const valid = get().selected.filter((i) => i < target.dice.length)
          if (valid.length !== get().selected.length) set({ selected: valid, results: {} })
          return
        }
        set({ setId: id, selected: allOf(target), results: {} })
      },

      toggleDie: (index) => {
        const { selected, results } = get()
        if (selected.includes(index)) {
          // 不参与投掷的骰子不该还留着读数：汇总会把它算进去
          const { [index]: _dropped, ...rest } = results
          set({ selected: selected.filter((i) => i !== index), results: rest })
        } else {
          set({ selected: [...selected, index].sort((a, b) => a - b) })
        }
      },

      selectAll: () => {
        const target = findDiceSet(get().setId)
        if (target) set({ selected: allOf(target) })
      },
      selectNone: () => set({ selected: [], results: {} }),

      roll: () => {
        const { setId, selected, results, seq } = get()
        const target = findDiceSet(setId)
        if (!target || !selected.length) return
        const spin = seq + 1
        const next: Record<number, DieResult> = {}
        for (const i of selected) {
          const prev = results[i]
          // 锁定的连 spin 一起原样留下，3D 那边才不会跟着重掷动一下
          next[i] = prev?.locked
            ? prev
            : { face: rollDie(target.dice[i].sides), locked: false, spin }
        }
        set({ results: next, seq: spin })
      },

      toggleLock: (index) => {
        const prev = get().results[index]
        if (!prev) return
        set({ results: { ...get().results, [index]: { ...prev, locked: !prev.locked } } })
      },

      clear: () => set({ results: {} }),
    }),
    {
      name: 'bgtools:dice',
      // results / seq 是当前一掷，留在内存里够了（离开页面再回来还看得见），
      // 但不值得写盘：真正要记住的是「桌上这盒游戏、勾了哪几颗」
      partialize: ({ setId, selected }) => ({ setId, selected }),
    },
  ),
)
