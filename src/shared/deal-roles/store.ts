import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RoleCounts } from './types'

type DealRolesState = {
  /**
   * setId -> 各身份张数。按 setId 分组：两款游戏各有一个叫 `villager` 的身份也不会串。
   * 只存用户配过的那几套，没配过的在 [countsOf](deck.ts) 里回落到默认那档预置。
   */
  counts: Record<string, RoleCounts>

  setCount: (setId: string, roleId: string, n: number) => void
  applyPreset: (setId: string, counts: RoleCounts) => void
  clear: (setId: string) => void
}

/**
 * 发身份的配比。**只有配比在这里，洗好的牌堆不进 store 也不持久化** ——
 * 牌堆落盘等于把"谁是狼"留在本机上，翻一下 localStorage 就看得到；
 * 而且「关掉浮层即中断」本来就是这类现场浮层的语义，中断后重开就该重新洗。
 */
export const useDealRolesStore = create<DealRolesState>()(
  persist(
    (set, get) => ({
      counts: {},

      setCount: (setId, roleId, n) => {
        const { counts } = get()
        set({
          counts: { ...counts, [setId]: { ...counts[setId], [roleId]: Math.max(0, n) } },
        })
      },

      applyPreset: (setId, next) => set({ counts: { ...get().counts, [setId]: { ...next } } }),

      clear: (setId) => set({ counts: { ...get().counts, [setId]: {} } }),
    }),
    {
      name: 'bgtools:deal-roles',
      partialize: ({ counts }) => ({ counts }),
    },
  ),
)
