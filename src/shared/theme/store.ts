import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 主题设置。深色是默认（无 data-theme 属性时的 CSS 值），浅色/墨水屏靠
 * `<html data-theme>` 上的变量覆盖块（见 index.css）。
 *
 * 墨水屏是主题四选一里的一档。它曾是独立于主题的开关、带 auto=(update: slow)
 * 自动检测 —— 那媒体特性支持面窄，检测错了反而抢用户的手动设置，已收成纯手动。
 *
 * ⚠️ persist 的落盘格式被 index.html 的启动脚本同步读，
 * 改 name / 字段名 / 解析逻辑时两边要一起改 —— 那个脚本必须在首帧前跑，等不到 bundle。
 */

export type ThemeChoice = 'system' | 'light' | 'dark' | 'eink'
export type ResolvedTheme = 'dark' | 'light' | 'eink'

const systemLight = () => matchMedia('(prefers-color-scheme: light)').matches

export function resolveTheme(theme: ThemeChoice): ResolvedTheme {
  if (theme === 'eink') return 'eink'
  if (theme === 'light' || (theme === 'system' && systemLight())) return 'light'
  return 'dark'
}

type ThemeState = {
  theme: ThemeChoice
  setTheme: (theme: ThemeChoice) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'bgtools:theme',
      // v0 → v1：墨水屏从独立开关并进 theme（旧格式 {theme, eink:'on'} → theme:'eink'）
      version: 1,
      migrate: (persisted) => {
        const s = persisted as { theme?: ThemeChoice; eink?: string } | undefined
        return { theme: s?.eink === 'on' ? 'eink' : (s?.theme ?? 'system') }
      },
    },
  ),
)

/** 深色不加属性（CSS 默认值就是深色，零回归）；theme-color 让系统 UI 跟着变 */
const THEME_COLORS: Record<ResolvedTheme, string> = {
  dark: '#0a0a0a',
  light: '#ffffff',
  eink: '#ffffff',
}

function apply() {
  const resolved = resolveTheme(useThemeStore.getState().theme)
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

// 跟随系统档的外部信号变化时重算
matchMedia('(prefers-color-scheme: light)').addEventListener('change', apply)
