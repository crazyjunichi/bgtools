import { create } from 'zustand'

type QuickUIState = {
  /** 当前打开的小工具 id，null = 没开 */
  open: string | null
  openTool: (id: string) => void
  close: () => void
}

/**
 * 顶栏按钮（在 header 内）与浮层（在 App 层）必须分开挂载 —— header 带
 * translate/backdrop-blur，会成为 fixed 的包含块，把浮层一起平移出屏。
 * 所以用 store 而不是 props 把"开哪个"传过去。
 */
export const useQuickUI = create<QuickUIState>()((set) => ({
  open: null,
  openTool: (id) => set({ open: id }),
  close: () => set({ open: null }),
}))
