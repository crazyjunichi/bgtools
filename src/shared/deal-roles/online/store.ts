import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DealTarget } from './backend'

type DealOnlineState = {
  /**
   * 组织者自己的后端地址。**只在这台浏览器里**：不进仓库、不进构建产物，
   * 也不会传给项目作者 —— 玩家那边只通过二维码的 fragment 拿到它。
   */
  target: DealTarget | null

  setTarget: (target: DealTarget) => void
  clearTarget: () => void
}

/**
 * 扫码发牌的后端配置。配得上就有"扫码发牌"，没配就只有轮传 ——
 * **这一处是全项目唯一允许出网的地方**，且必须能完整降级：断网、没配、后端报错，
 * 都只让这一个按钮不可用，轮传发牌一个字不受影响。
 */
export const useDealOnlineStore = create<DealOnlineState>()(
  persist(
    (set) => ({
      target: null,

      setTarget: (target) => set({ target }),
      clearTarget: () => set({ target: null }),
    }),
    {
      name: 'bgtools:deal-online',
      partialize: ({ target }) => ({ target }),
    },
  ),
)
