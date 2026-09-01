import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MAX_GROUPS } from './groups'

export type PickMode = 'one' | 'order' | 'group'

const MIN_GROUPS = 2

type TouchPickState = {
  mode: PickMode
  /** 分组模式的目标组数。实际组数还要受触点数限制，见 [pick.ts](pick.ts) */
  groups: number
  setMode: (mode: PickMode) => void
  /** 窄条里只放得下一个按钮，所以是循环递增而不是 Stepper */
  cycleGroups: () => void
}

/**
 * 只存设置。触点与结果是**瞬时状态**，留在 [TouchField](TouchField.tsx) 的组件 state 里：
 * 触点坐标每帧都在变，进 store 会让整页跟着重渲染，落 localStorage 更是毫无意义。
 */
export const useTouchPickStore = create<TouchPickState>()(
  persist(
    (set, get) => ({
      mode: 'one',
      groups: MIN_GROUPS,

      setMode: (mode) => set({ mode }),

      cycleGroups: () => {
        const next = get().groups + 1
        set({ groups: next > MAX_GROUPS ? MIN_GROUPS : next })
      },
    }),
    {
      name: 'bgtools:touch-pick',
      partialize: ({ mode, groups }) => ({ mode, groups }),
    },
  ),
)
