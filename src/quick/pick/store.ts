import { create } from 'zustand'
import { shuffle } from '../../shared/random'

/** 轮播时长，也是 [QuickPick](QuickPick.tsx) 里定时器的依据 */
export const SPIN_MS = 700

type State = {
  /** 抽中的席位 id */
  pickedId: string | null
  pick: (seatIds: string[]) => void
}

/**
 * 随机点人。**刻意不 persist**（quick「关掉状态保留」的惯例在这里不适用）：
 * 席位表跟着工具页走，换一页就整桌换人，存下来只会留一个指向不存在席位的 id。
 */
export const useQuickPickStore = create<State>()((set) => ({
  pickedId: null,
  pick: (seatIds) => set({ pickedId: shuffle(seatIds)[0] ?? null }),
}))
