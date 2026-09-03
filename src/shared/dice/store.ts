import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { rollDie } from '../random'
import { findDiceSet } from './presets'
import type { DiceSet } from './types'

export type DieResult = {
  /** 面号 1..N，取内容是 `spec.faces[face - 1]` */
  face: number
  locked: boolean
  /** 投掷序号，3D 层靠它判断这一颗该不该起转 */
  spin: number
}

/** 一个骰组的局面 */
export type DiceSlice = {
  /** 参与投掷的骰子下标（骰组 dice 数组的 index），保持升序 = 骰组顺序 */
  selected: number[]
  /** 下标 → 结果。只有掷过的骰子在里面 */
  results: Record<number, DieResult>
  seq: number
}

type DiceState = {
  /** 骰组 id → 局面 */
  sets: Record<string, DiceSlice>

  toggleDie: (setId: string, index: number) => void
  selectAll: (setId: string) => void
  selectNone: (setId: string) => void
  roll: (setId: string) => void
  toggleLock: (setId: string, index: number) => void
  clear: (setId: string) => void
}

const allOf = (set: DiceSet) => set.dice.map((_, i) => i)
const EMPTY: DiceSlice = { selected: [], results: {}, seq: 0 }

/**
 * 某骰组的局面，没存过就是「全选、还没掷」。
 *
 * 顺带裁掉越界下标：持久化存的是下标，骰组改小过之后旧下标会指到不存在的骰子上。
 * 裁过就连结果一起清 —— 剩下那些的下标含义也未必还对得上。
 */
function sliceOf(stored: DiceSlice | undefined, setId: string): DiceSlice {
  const set = findDiceSet(setId)
  if (!set) return EMPTY
  if (!stored) return { selected: allOf(set), results: {}, seq: 0 }
  const valid = stored.selected.filter((i) => i < set.dice.length)
  if (valid.length === stored.selected.length) return stored
  return { selected: valid, results: {}, seq: stored.seq }
}

/**
 * 骰子界面的局面，**按骰组分开存**：一盒游戏里可能有两套骰（资源骰 / 战斗骰），
 * 各自记着勾了哪几颗、上一掷是什么，互不冲掉。
 *
 * 与顶栏快捷骰子（[quick/dice/store.ts](../../quick/dice/store.ts)）刻意分开：
 * 顺手掷一下不该冲掉正在进行的那局结果。
 */
export const useDiceStore = create<DiceState>()(
  persist(
    (set, get) => {
      /** 所有写操作的唯一入口：兜底缺失的分片、拒掉不存在的骰组、原样返回时不惊动订阅者 */
      const update = (setId: string, patch: (cur: DiceSlice, target: DiceSet) => DiceSlice) => {
        const target = findDiceSet(setId)
        if (!target) return
        const { sets } = get()
        const next = patch(sliceOf(sets[setId], setId), target)
        if (next === sets[setId]) return
        set({ sets: { ...sets, [setId]: next } })
      }

      return {
        sets: {},

        toggleDie: (setId, index) =>
          update(setId, (cur) => {
            if (!cur.selected.includes(index)) {
              return { ...cur, selected: [...cur.selected, index].sort((a, b) => a - b) }
            }
            // 不参与投掷的骰子不该还留着读数：汇总会把它算进去
            const { [index]: _dropped, ...rest } = cur.results
            return { ...cur, selected: cur.selected.filter((i) => i !== index), results: rest }
          }),

        selectAll: (setId) => update(setId, (cur, target) => ({ ...cur, selected: allOf(target) })),
        selectNone: (setId) => update(setId, (cur) => ({ ...cur, selected: [], results: {} })),

        roll: (setId) =>
          update(setId, (cur, target) => {
            if (!cur.selected.length) return cur
            const spin = cur.seq + 1
            const results: Record<number, DieResult> = {}
            for (const i of cur.selected) {
              const prev = cur.results[i]
              // 锁定的连 spin 一起原样留下，3D 那边才不会跟着重掷动一下
              results[i] = prev?.locked
                ? prev
                : { face: rollDie(target.dice[i].sides), locked: false, spin }
            }
            return { ...cur, results, seq: spin }
          }),

        toggleLock: (setId, index) =>
          update(setId, (cur) => {
            const prev = cur.results[index]
            if (!prev) return cur
            return { ...cur, results: { ...cur.results, [index]: { ...prev, locked: !prev.locked } } }
          }),

        clear: (setId) => update(setId, (cur) => ({ ...cur, results: {} })),
      }
    },
    {
      name: 'bgtools:dice',
      version: 1,
      // v0 存的是「全局唯一一个当前骰组」，跟分片后的 sets 没有对应关系，直接从头来
      migrate: () => ({ sets: {} }),
      // 要记住的只是「这盒游戏勾了哪几颗」。results / seq 是当前一掷，
      // 留在内存里够了（离开页面再回来还看得见），不值得每掷一次都写盘
      partialize: ({ sets }) => ({
        sets: Object.fromEntries(
          Object.entries(sets).map(([id, s]) => [id, { selected: s.selected, results: {}, seq: 0 }]),
        ),
      }),
    },
  ),
)

/**
 * 组件读局面的唯一入口。兜底值必须记忆化 —— 每次渲染新建对象会让
 * 3D 画布的重摆 effect 白跑一轮（它按 dice 数组身份判断要不要重建）。
 */
export function useDiceSlice(setId: string): DiceSlice {
  const stored = useDiceStore((s) => s.sets[setId])
  return useMemo(() => sliceOf(stored, setId), [stored, setId])
}
