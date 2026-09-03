import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 主题设置。深色是默认（无 data-theme 属性时的 CSS 值），浅色/墨水屏靠
 * `<html data-theme>` 上的变量覆盖块（见 index.css）。
 *
 * 墨水屏是**独立于主题**的一档：eink 生效时无视 theme 直接落到纯黑白高对比。
 * auto 档跟随 `(update: slow)` —— 这媒体特性支持面窄，只是自动提示，可靠入口是手动开。
 *
 * ⚠️ persist 的落盘格式（`{state:{theme,eink}}`）被 index.html 的启动脚本同步读，
 * 改 name / 字段名 / 解析逻辑时两边要一起改 —— 那个脚本必须在首帧前跑，等不到 bundle。
 */

export type ThemeChoice = 'system' | 'light' | 'dark'
export type EinkChoice = 'auto' | 'on' | 'off'
export type ResolvedTheme = 'dark' | 'light' | 'eink'

const systemLight = () => matchMedia('(prefers-color-scheme: light)').matches
const slowUpdate = () => matchMedia('(update: slow)').matches

export function resolveTheme(theme: ThemeChoice, eink: EinkChoice): ResolvedTheme {
  if (eink === 'on' || (eink === 'auto' && slowUpdate())) return 'eink'
  if (theme === 'light' || (theme === 'system' && systemLight())) return 'light'
  return 'dark'
}

type ThemeState = {
  theme: ThemeChoice
  eink: EinkChoice
  setTheme: (theme: ThemeChoice) => void
  setEink: (eink: EinkChoice) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      eink: 'auto',
      setTheme: (theme) => set({ theme }),
      setEink: (eink) => set({ eink }),
    }),
    { name: 'bgtools:theme' },
  ),
)

/** 深色不加属性（CSS 默认值就是深色，零回归）；theme-color 让系统 UI 跟着变 */
const THEME_COLORS: Record<ResolvedTheme, string> = {
  dark: '#0a0a0a',
  light: '#ffffff',
  eink: '#ffffff',
}

function apply() {
  const resolved = resolveTheme(useThemeStore.getState().theme, useThemeStore.getState().eink)
  const root = document.documentElement
  if (resolved === 'dark') delete root.dataset.theme
  else root.dataset.theme = resolved
  root.style.colorScheme = resolved === 'dark' ? 'dark' : 'light'
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[resolved])
}

/** 给 React 树外的渲染层（canvas / WebGL）读当前解析结果，一次性读取、不订阅 */
export const isEink = () => document.documentElement.dataset.theme === 'eink'

// 模块加载即生效（main.tsx import）。persist rehydrate 是同步的，这里拿到的已是落盘值
apply()
useThemeStore.subscribe(apply)

// 系统档/自动档的外部信号变化时重算
matchMedia('(prefers-color-scheme: light)').addEventListener('change', apply)
matchMedia('(update: slow)').addEventListener('change', apply)
