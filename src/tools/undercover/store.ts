import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UndercoverState = {
  /** 盲发：卧底不知道自己是卧底（所有人的牌面只出词、不出身份）。默认关（传统规则：卧底知情） */
  blind: boolean

  setBlind: (blind: boolean) => void
}

export const useUndercoverStore = create<UndercoverState>()(
  persist(
    (set) => ({
      blind: false,

      setBlind: (blind) => set({ blind }),
    }),
    { name: 'bgtools:undercover' },
  ),
)
