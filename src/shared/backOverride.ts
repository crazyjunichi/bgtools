import { create } from 'zustand'

/**
 * 工具内子视图对顶栏返回键的临时接管。
 *
 * 顶栏返回默认回首页；工具有子视图时（如狼人真言的主持页），子视图挂载期间
 * 注册一个回调，把返回截到「回工具自己的入口」。视觉始终只有顶栏那一枚返回键。
 *
 * **注册方必须在 effect cleanup 里 clear** —— 不持久化、跨页面不清，
 * 忘了清，下一个工具会继承一枚指向已卸载组件的死回调。
 */
type BackOverrideState = {
  onBack: (() => void) | null
  set: (onBack: () => void) => void
  clear: () => void
}

export const useBackOverride = create<BackOverrideState>()((set) => ({
  onBack: null,
  set: (onBack) => set({ onBack }),
  clear: () => set({ onBack: null }),
}))
