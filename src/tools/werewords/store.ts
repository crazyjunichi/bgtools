import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '../../shared/i18n'
import { rollDie } from '../../shared/random'
import { wordPool, type Difficulty } from './words'

type WerewordsState = {
  difficulty: Difficulty
  /** 本局魔法词（抽词那一刻的语言）。持久化：刷新不能把桌上这局的词弄丢 */
  word: string | null

  setDifficulty: (difficulty: Difficulty) => void
  /** 抽新词并返回它 —— 调用方（开始主持）随即把它快照进 voice-host，所以得同步拿到 */
  drawWord: () => string
}

export const useWerewordsStore = create<WerewordsState>()(
  persist(
    (set, get) => ({
      difficulty: 'easy',
      word: null,

      setDifficulty: (difficulty) => set({ difficulty }),

      drawWord: () => {
        const pool = wordPool(get().difficulty, i18n.language)
        let word = pool[rollDie(pool.length) - 1]
        // 连着两局同一个词太扫兴：重抽一次就够，词池几百个，再撞认命
        if (pool.length > 1 && word === get().word) word = pool[rollDie(pool.length) - 1]
        set({ word })
        return word
      },
    }),
    { name: 'bgtools:werewords', partialize: ({ difficulty, word }) => ({ difficulty, word }) },
  ),
)
