import { create } from 'zustand'

/** tile 面板的伪 id。放在 open 里而不是另开一个 boolean：面板与浮层永远互斥 */
export const QUICK_MENU = 'menu'

type QuickUIState = {
  /** `'menu'` = tile 面板，其余是小工具 id，null = 什么都没开 */
  open: string | null
  openTool: (id: string) => void
  toggleMenu: () => void
  close: () => void
}

/**
 * 顶栏按钮（在 header 内）与浮层（在 App 层）必须分开挂载 —— header 带
 * translate/backdrop-blur，会成为 fixed 的包含块，把浮层一起平移出屏。
 * 所以用 store 而不是 props 把"开哪个"传过去。
 */
export const useQuickUI = create<QuickUIState>()((set, get) => ({
  open: null,
  openTool: (id) => set({ open: id }),
  toggleMenu: () => set({ open: get().open === QUICK_MENU ? null : QUICK_MENU }),
  close: () => set({ open: null }),
}))
