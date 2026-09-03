import { create } from 'zustand'
import type { Seat } from '../players/seats'

/**
 * 「当前这个工具页正在打的一局」的镜像。
 *
 * **它是派生镜像，不是真源** —— 真源永远在各工具自己的 store 里（每个工具页开的是它自己的
 * 一局，参与者只属于那一局）。这层存在只解决一件事：顶栏的 quick 小工具（随机点人）
 * 看不见工具页内部的状态，而桌上 6 人名单、这局只 4 人在打时，点到没在玩的人是错的。
 *
 * **刻意不 persist**：它跟着页面走，刷新后由工具页的 effect 重新写入。
 * 存进 localStorage 只会留下一份过期的席位表。
 */
export type ActiveMatch = {
  toolId: string
  gameId: string | null
  seats: Seat[]
}

type ActiveState = {
  active: ActiveMatch | null
  /** 工具页在 effect 里调（席位变了要跟着更新）；卸载时调 `clear` */
  set: (active: ActiveMatch) => void
  clear: () => void
}

export const useActiveMatch = create<ActiveState>()((set) => ({
  active: null,
  set: (active) => set({ active }),
  clear: () => set({ active: null }),
}))
