/**
 * 宿主游戏的主色。引擎不知道自己被哪款游戏用着，所以主色由调用方传进来 ——
 * 取值与 `ToolMeta.accent` 一致（发身份浮层与它所属的工具页认色要一样），
 * 但**不 import 那个类型**：shared 不该反向依赖 tools。
 */
export type DealAccent = 'amber' | 'emerald' | 'sky' | 'violet' | 'rose'

/** 实心档：主操作与选中态。显式映射表，Tailwind 扫不到拼接出来的类名。
    eink 反转成黑底白字：-400 在灰阶屏上是中灰块，黑字压上去糊 */
export const ACCENT_SOLID: Record<DealAccent, string> = {
  amber: 'bg-amber-400 text-ink eink-solid',
  emerald: 'bg-emerald-400 text-ink eink-solid',
  sky: 'bg-sky-400 text-ink eink-solid',
  violet: 'bg-violet-400 text-ink eink-solid',
  rose: 'bg-rose-400 text-ink eink-solid',
}

/** 淡底档：已加了张数的身份格、揭示卡的边框。eink 收白：灰阶屏上 15% 灰只是装饰 */
export const ACCENT_SOFT: Record<DealAccent, string> = {
  amber: 'border-amber-500/60 bg-amber-500/15 eink:bg-white',
  emerald: 'border-emerald-500/60 bg-emerald-500/15 eink:bg-white',
  sky: 'border-sky-500/60 bg-sky-500/15 eink:bg-white',
  violet: 'border-violet-500/60 bg-violet-500/15 eink:bg-white',
  rose: 'border-rose-500/60 bg-rose-500/15 eink:bg-white',
}

/** 文字档：淡底上的强调文字 */
export const ACCENT_TEXT: Record<DealAccent, string> = {
  amber: 'text-amber-300',
  emerald: 'text-emerald-300',
  sky: 'text-sky-300',
  violet: 'text-violet-300',
  rose: 'text-rose-300',
}
