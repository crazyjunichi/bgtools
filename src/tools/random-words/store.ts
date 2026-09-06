import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { shuffle } from '../../shared/random'
import { WORDS } from '../codenames/words'

export const MIN_BATCH = 1
export const MAX_BATCH = 6

/** 词卡左上角的角标编号方式 */
export type Labeling = 'none' | 'number' | 'letter'

type RandomWordsState = {
  /** 每一批出几个词，开局前定好 */
  batchSize: number
  labeling: Labeling
  running: boolean
  /** 洗过牌的整副词库，按 cursor 顺序出，抽干重洗（一轮内不重复） */
  deck: string[]
  cursor: number
  setBatchSize: (n: number) => void
  setLabeling: (l: Labeling) => void
  start: () => void
  next: () => void
  exit: () => void
}

/**
 * 只持久化设置项（下局大概率不变）。牌堆与 cursor 是瞬时状态：
 * 刷新即回设置页重开一局，留在内存里就好。
 */
export const useRandomWordsStore = create<RandomWordsState>()(
  persist(
    (set, get) => ({
      batchSize: 1,
      labeling: 'none',
      running: false,
      deck: [],
      cursor: 0,

      setBatchSize: (n) => set({ batchSize: Math.min(MAX_BATCH, Math.max(MIN_BATCH, n)) }),

      setLabeling: (labeling) => set({ labeling }),

      start: () => set({ running: true, deck: shuffle(WORDS), cursor: 0 }),

      next: () => {
        const { deck, cursor, batchSize } = get()
        const at = cursor + batchSize
        // 抽干整副就重洗接着来：点「下一批」永远有词，退出只能靠手动
        if (at >= deck.length) set({ deck: shuffle(WORDS), cursor: 0 })
        else set({ cursor: at })
      },

      exit: () => set({ running: false }),
    }),
    {
      name: 'bgtools:random-words',
      partialize: ({ batchSize, labeling }) => ({ batchSize, labeling }),
    },
  ),
)
