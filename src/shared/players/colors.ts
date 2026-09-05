import type { I18nKey } from '../i18n/types'

/**
 * 玩家标识色，15 个。刻意避开四个语义色（rose / emerald / sky / amber）——
 * 玩家色要能和"危险 / 完成 / 信息 / 警告"同屏共存，撞色就读不出哪个是语义。
 *
 * 排除语义色后 Tailwind 只剩 12 个可用色相，其余名额用**棕 / 灰 / 墨**这类
 * 中性与大地色补足：跟任何色相都不可能看混，也正好对上桌上实物棋子的常见颜色。
 * 「墨」是主题相反色（深主题下呈亮、浅/墨水屏下呈深）—— 它顶替了旧的白/黑两格：
 * 固定白在浅主题、固定黑在深主题都必然隐形，canvas 画板上更是只能叠描边硬凑，
 * 一根随主题翻面的中性色是这些场景的共同解。
 *
 * 色名是必需的而非装饰：同色允许被两个玩家共用，颜色本身不足以区分，
 * 所有展示玩家色的地方都得再出名字或色名（DESIGN.md §6）。
 */
export const PLAYER_COLORS = [
  { id: 'red', labelKey: 'players.colors.red' },
  { id: 'orange', labelKey: 'players.colors.orange' },
  { id: 'yellow', labelKey: 'players.colors.yellow' },
  { id: 'lime', labelKey: 'players.colors.lime' },
  { id: 'green', labelKey: 'players.colors.green' },
  { id: 'teal', labelKey: 'players.colors.teal' },
  { id: 'cyan', labelKey: 'players.colors.cyan' },
  { id: 'blue', labelKey: 'players.colors.blue' },
  { id: 'indigo', labelKey: 'players.colors.indigo' },
  { id: 'violet', labelKey: 'players.colors.violet' },
  { id: 'fuchsia', labelKey: 'players.colors.fuchsia' },
  { id: 'pink', labelKey: 'players.colors.pink' },
  { id: 'brown', labelKey: 'players.colors.brown' },
  { id: 'gray', labelKey: 'players.colors.gray' },
  { id: 'ink', labelKey: 'players.colors.ink' },
] as const satisfies readonly { id: string; labelKey: I18nKey }[]

export type PlayerColor = (typeof PLAYER_COLORS)[number]['id']

/**
 * 旧存档里的「白/黑」。色板已撤掉这两格，但名单与各工具 persist 里可能还存着 ——
 * 五张映射表各留一行别名让它们照常渲染（样式即当时那一档），不另做数据迁移。
 * 新代码不该再产生这两个值。
 */
type LegacyPlayerColor = 'white' | 'black'

export function colorLabelKey(color: PlayerColor): I18nKey | undefined {
  // 旧存档的白/黑已渲染成「墨」的样式，色名也回落到墨
  return (
    PLAYER_COLORS.find((c) => c.id === color)?.labelKey ??
    ((color as string) === 'white' || (color as string) === 'black'
      ? 'players.colors.ink'
      : undefined)
  )
}

// 五张显式映射表而非拼接类名：Tailwind 编译期只扫静态字符串。
// 档位按 DESIGN.md §2：实心 -400 + text-ink，淡底 -500/15 + border-500/60。
// brown 不在 Tailwind 色板里，三档定义在 index.css 的 @theme。
// 中性色不走 index.css 的全局重映射（同一档在不同处要的东西相反），
// 它们的浅色主题例外都收在这几张表里的 `light:` 类名级（light: 同时命中 eink）。

/** `--color-ink`。canvas 那张表要字面量，抄两遍不如提一个常量 */
const INK = '#0a0a0a'

/** 实心态：颜色自身的展示面（选色板、touch-pick 的分组圆环）。用户卡片一律用 PLAYER_LINE，不用这张 */
export const PLAYER_SOLID: Record<PlayerColor | LegacyPlayerColor, string> = {
  red: 'bg-red-400 text-ink',
  orange: 'bg-orange-400 text-ink',
  yellow: 'bg-yellow-400 text-ink',
  lime: 'bg-lime-400 text-ink',
  green: 'bg-green-400 text-ink',
  teal: 'bg-teal-400 text-ink',
  cyan: 'bg-cyan-400 text-ink',
  blue: 'bg-blue-400 text-ink',
  indigo: 'bg-indigo-400 text-ink',
  violet: 'bg-violet-400 text-ink',
  fuchsia: 'bg-fuchsia-400 text-ink',
  pink: 'bg-pink-400 text-ink',
  brown: 'bg-brown-400 text-ink',
  gray: 'bg-zinc-400 text-ink',
  ink: 'bg-zinc-100 text-ink light:bg-zinc-900 light:text-white',
  white: 'bg-zinc-100 text-ink light:ring-2 light:ring-zinc-400',
  black: 'bg-zinc-950 text-text ring-2 ring-zinc-400 light:text-white',
}

/**
 * 底线态：用户卡片的标准形态 —— 卡面无底色，身份色由底部一条粗边承载，文字保持默认色。
 * 只给颜色，线宽由调用点按尺寸档自己补 `border-b-*`。
 * 每条都带 `rounded-b-none`：底角必须方，否则粗边会顺着圆角向上卷起（调用点的
 * btn-base / rounded-* 只管得到顶角）。
 * 名字始终在场（颜色不许是唯一编码），所以底线在 eink 上洗成灰不必兜底。
 */
export const PLAYER_LINE: Record<PlayerColor | LegacyPlayerColor, string> = {
  red: 'rounded-b-none border-b-red-400',
  orange: 'rounded-b-none border-b-orange-400',
  yellow: 'rounded-b-none border-b-yellow-400',
  lime: 'rounded-b-none border-b-lime-400',
  green: 'rounded-b-none border-b-green-400',
  teal: 'rounded-b-none border-b-teal-400',
  cyan: 'rounded-b-none border-b-cyan-400',
  blue: 'rounded-b-none border-b-blue-400',
  indigo: 'rounded-b-none border-b-indigo-400',
  violet: 'rounded-b-none border-b-violet-400',
  fuchsia: 'rounded-b-none border-b-fuchsia-400',
  pink: 'rounded-b-none border-b-pink-400',
  brown: 'rounded-b-none border-b-brown-400',
  gray: 'rounded-b-none border-b-zinc-400',
  ink: 'rounded-b-none border-b-zinc-100 light:border-b-zinc-900',
  white: 'rounded-b-none border-b-zinc-100 light:border-b-zinc-400',
  black: 'rounded-b-none border-b-zinc-400 light:border-b-zinc-950',
}

/** 淡底态：未选中但要带身份色的行/卡。eink 收白：灰阶屏上 15% 灰只是装饰，身份由文字/色名承载 */
export const PLAYER_SOFT: Record<PlayerColor | LegacyPlayerColor, string> = {
  red: 'border-red-500/60 bg-red-500/15 text-red-300 eink:bg-white',
  orange: 'border-orange-500/60 bg-orange-500/15 text-orange-300 eink:bg-white',
  yellow: 'border-yellow-500/60 bg-yellow-500/15 text-yellow-300 eink:bg-white',
  lime: 'border-lime-500/60 bg-lime-500/15 text-lime-300 eink:bg-white',
  green: 'border-green-500/60 bg-green-500/15 text-green-300 eink:bg-white',
  teal: 'border-teal-500/60 bg-teal-500/15 text-teal-300 eink:bg-white',
  cyan: 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300 eink:bg-white',
  blue: 'border-blue-500/60 bg-blue-500/15 text-blue-300 eink:bg-white',
  indigo: 'border-indigo-500/60 bg-indigo-500/15 text-indigo-300 eink:bg-white',
  violet: 'border-violet-500/60 bg-violet-500/15 text-violet-300 eink:bg-white',
  fuchsia: 'border-fuchsia-500/60 bg-fuchsia-500/15 text-fuchsia-300 eink:bg-white',
  pink: 'border-pink-500/60 bg-pink-500/15 text-pink-300 eink:bg-white',
  brown: 'border-brown-500/60 bg-brown-500/15 text-brown-300 eink:bg-white',
  gray: 'border-zinc-400/60 bg-zinc-400/15 text-zinc-300 light:text-zinc-600 eink:bg-white',
  ink: 'border-zinc-300/60 bg-zinc-300/15 text-zinc-100 light:border-zinc-500/60 light:bg-zinc-500/15 light:text-zinc-700 eink:bg-white',
  white: 'border-zinc-300/60 bg-zinc-300/15 text-zinc-100 light:border-zinc-400/60 light:text-zinc-600 eink:bg-white',
  // 近黑底两个主题下都成立，文字保持亮
  black: 'border-zinc-400/60 bg-zinc-950 text-zinc-200',
}

/** canvas 色值：纸面明暗。「墨」按纸面取反，深纸上亮、浅纸上深 */
export type PaperTone = 'dark' | 'light'

/**
 * canvas 专用的实心档取值。**不是新增颜色** —— 色相仍是上面那批，
 * 只是换了个载体：`<canvas>` 拿不到 Tailwind 类名，而 Tailwind 4 的色板全是 `oklch()`，
 * `fillStyle` 不认时是**静默失败**（保留上一次的颜色），画出来的图会张冠李戴。
 *
 * 值 = `PLAYER_SOLID` 那一档（-400）的 oklch 换算成 sRGB，
 * 源值见 `node_modules/tailwindcss/theme.css`，改版本时按那里重算。
 * `fg` 与 `PLAYER_SOLID` 的文字色一致。
 * 「墨」不在这张表里：它没有固定值，走 [playerHexOf] 按纸面明暗取。
 * 白/黑两行只给旧存档兜底。
 */
export const PLAYER_HEX: Record<Exclude<PlayerColor, 'ink'> | LegacyPlayerColor, PlayerHex> = {
  red: { bg: '#ff6467', fg: INK }, // oklch(70.4% 0.191 22.216)
  orange: { bg: '#ff8904', fg: INK }, // oklch(75% 0.183 55.934)
  yellow: { bg: '#fdc700', fg: INK }, // oklch(85.2% 0.199 91.936)
  lime: { bg: '#9ae600', fg: INK }, // oklch(84.1% 0.238 128.85)
  green: { bg: '#05df72', fg: INK }, // oklch(79.2% 0.209 151.711)
  teal: { bg: '#00d5be', fg: INK }, // oklch(77.7% 0.152 181.912)
  cyan: { bg: '#00d3f2', fg: INK }, // oklch(78.9% 0.154 211.53)
  blue: { bg: '#51a2ff', fg: INK }, // oklch(70.7% 0.165 254.624)
  indigo: { bg: '#7c86ff', fg: INK }, // oklch(67.3% 0.182 276.935)
  violet: { bg: '#a684ff', fg: INK }, // oklch(70.2% 0.183 293.541)
  fuchsia: { bg: '#ed6aff', fg: INK }, // oklch(74% 0.238 322.16)
  pink: { bg: '#fb64b6', fg: INK }, // oklch(71.8% 0.202 349.761)
  brown: { bg: '#c79a6b', fg: INK }, // index.css 的 @theme 自定义，本来就是 hex
  gray: { bg: '#9f9fa9', fg: INK }, // zinc-400
  white: { bg: '#f4f4f5', fg: INK }, // zinc-100（旧存档）
  black: { bg: '#09090b', fg: '#f5f5f5' }, // zinc-950（旧存档）
}

export type PlayerHex = { bg: string; fg: string }

/** 「墨」的两副面孔：深纸（zinc-100）/ 浅纸（zinc-900） */
const INK_HEX: Record<PaperTone, PlayerHex> = {
  dark: { bg: '#f4f4f5', fg: INK },
  light: { bg: '#18181b', fg: '#f5f5f5' },
}

/** canvas 取色唯一入口：固定色查表，「墨」按纸面明暗取反 */
export function playerHexOf(color: PlayerColor, on: PaperTone): PlayerHex {
  return color === 'ink' ? INK_HEX[on] : PLAYER_HEX[color]
}

/**
 * 页面当前主题的纸面明暗。canvas 拿不到主题类名，只能读 `<html data-theme>`；
 * 深色是默认（无属性），浅色与墨水屏同属浅纸。
 */
export function paperTone(): PaperTone {
  const t = document.documentElement.dataset.theme
  return t === 'light' || t === 'eink' ? 'light' : 'dark'
}

/** 色点：列表行前的小圆点，只需要底色 */
export const PLAYER_DOT: Record<PlayerColor | LegacyPlayerColor, string> = {
  red: 'bg-red-400',
  orange: 'bg-orange-400',
  yellow: 'bg-yellow-400',
  lime: 'bg-lime-400',
  green: 'bg-green-400',
  teal: 'bg-teal-400',
  cyan: 'bg-cyan-400',
  blue: 'bg-blue-400',
  indigo: 'bg-indigo-400',
  violet: 'bg-violet-400',
  fuchsia: 'bg-fuchsia-400',
  pink: 'bg-pink-400',
  brown: 'bg-brown-400',
  gray: 'bg-zinc-400',
  ink: 'bg-zinc-100 light:bg-zinc-900',
  white: 'bg-zinc-100 light:ring-1 light:ring-zinc-400',
  black: 'bg-zinc-950 ring-1 ring-zinc-400',
}
