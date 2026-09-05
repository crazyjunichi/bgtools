import { create } from 'zustand'
import type { I18nKey } from './i18n/types'

/**
 * 工具页对顶栏标题的临时接管：计分纸从游戏卡进入时，标题该是那盒游戏而不是「计分纸」。
 * 存 key 不存文案，AppHeader 渲染期 t()，切语言跟着变。
 *
 * **设置方必须在 effect cleanup 里 clear**（同 [backOverride](backOverride.ts)）——
 * 不持久化、跨页面不清，忘了清，下一个工具的标题就被顶替。
 */
type HeaderTitle = { icon: string; nameKey: I18nKey }

type HeaderTitleState = {
  title: HeaderTitle | null
  set: (title: HeaderTitle) => void
  clear: () => void
}

export const useHeaderTitle = create<HeaderTitleState>()((set) => ({
  title: null,
  set: (title) => set({ title }),
  clear: () => set({ title: null }),
}))
