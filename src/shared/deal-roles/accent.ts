/**
 * 宿主游戏的主色。引擎不知道自己被哪款游戏用着，所以主色由调用方传进来 ——
 * 取值与 `ToolMeta.accent` 一致（发身份浮层与它所属的工具页认色要一样），
 * 但**不 import 那个类型**：shared 不该反向依赖 tools。
 */
export type DealAccent = 'amber' | 'emerald' | 'sky' | 'violet' | 'rose'

/** 实心档：主操作与选中态。显式映射表，Tailwind 扫不到拼接出来的类名 */
export const ACCENT_SOLID: Record<DealAccent, string> = {
  amber: 'bg-amber-400 text-ink',
  emerald: 'bg-emerald-400 text-ink',
  sky: 'bg-sky-400 text-ink',
  violet: 'bg-violet-400 text-ink',
  rose: 'bg-rose-400 text-ink',
}

/** 淡底档：已加了张数的身份格、揭示卡的边框 */
export const ACCENT_SOFT: Record<DealAccent, string> = {
  amber: 'border-amber-500/60 bg-amber-500/15',
  emerald: 'border-emerald-500/60 bg-emerald-500/15',
  sky: 'border-sky-500/60 bg-sky-500/15',
  violet: 'border-violet-500/60 bg-violet-500/15',
  rose: 'border-rose-500/60 bg-rose-500/15',
}

/** 文字档：淡底上的强调文字 */
export const ACCENT_TEXT: Record<DealAccent, string> = {
  amber: 'text-amber-300',
  emerald: 'text-emerald-300',
  sky: 'text-sky-300',
  violet: 'text-violet-300',
  rose: 'text-rose-300',
}
