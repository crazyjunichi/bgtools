import type { I18nKey } from '../i18n/types'

/**
 * 玩家标识色，16 个。刻意避开四个语义色（rose / emerald / sky / amber）——
 * 玩家色要能和"危险 / 完成 / 信息 / 警告"同屏共存，撞色就读不出哪个是语义。
 *
 * 排除语义色后 Tailwind 只剩 12 个可用色相，而 16 个格子要"互相不像"，
 * 所以后 4 格换维度取：**棕 / 白 / 灰 / 黑**这类中性与大地色跟任何色相都不可能看混，
 * 也正好对上桌上实物棋子的常见颜色。四行的排法就是四个色域块（暖 / 绿青 / 紫粉 / 中性）。
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
  { id: 'white', labelKey: 'players.colors.white' },
  { id: 'gray', labelKey: 'players.colors.gray' },
  { id: 'black', labelKey: 'players.colors.black' },
] as const satisfies readonly { id: string; labelKey: I18nKey }[]

export type PlayerColor = (typeof PLAYER_COLORS)[number]['id']

export function colorLabelKey(color: PlayerColor): I18nKey | undefined {
  return PLAYER_COLORS.find((c) => c.id === color)?.labelKey
}

// 三张显式映射表而非拼接类名：Tailwind 编译期只扫静态字符串。
// 档位按 DESIGN.md §2：实心 -400 + text-ink（≈9~11:1），淡底 -500/15 + border-500/60。
// brown 不在 Tailwind 色板里，三档定义在 index.css 的 @theme。
// 两处必要的破例，都在 black 上：深底上「黑」只能靠**近黑底 + 亮描边**成形，
// 所以它的实心档是白字（text-ink 在 zinc-950 上等于看不见），淡底档也不能用 /15。

/** `--color-ink`。canvas 那张表要字面量，抄两遍不如提一个常量 */
const INK = '#0a0a0a'

/** 实心态：选中的玩家、需要一眼认人的胶囊 */
export const PLAYER_SOLID: Record<PlayerColor, string> = {
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
  white: 'bg-zinc-100 text-ink',
  gray: 'bg-zinc-400 text-ink',
  black: 'bg-zinc-950 text-text ring-2 ring-zinc-400',
}

/** 淡底态：未选中但要带身份色的行/卡 */
export const PLAYER_SOFT: Record<PlayerColor, string> = {
  red: 'border-red-500/60 bg-red-500/15 text-red-300',
  orange: 'border-orange-500/60 bg-orange-500/15 text-orange-300',
  yellow: 'border-yellow-500/60 bg-yellow-500/15 text-yellow-300',
  lime: 'border-lime-500/60 bg-lime-500/15 text-lime-300',
  green: 'border-green-500/60 bg-green-500/15 text-green-300',
  teal: 'border-teal-500/60 bg-teal-500/15 text-teal-300',
  cyan: 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300',
  blue: 'border-blue-500/60 bg-blue-500/15 text-blue-300',
  indigo: 'border-indigo-500/60 bg-indigo-500/15 text-indigo-300',
  violet: 'border-violet-500/60 bg-violet-500/15 text-violet-300',
  fuchsia: 'border-fuchsia-500/60 bg-fuchsia-500/15 text-fuchsia-300',
  pink: 'border-pink-500/60 bg-pink-500/15 text-pink-300',
  brown: 'border-brown-500/60 bg-brown-500/15 text-brown-300',
  white: 'border-zinc-300/60 bg-zinc-300/15 text-zinc-100',
  gray: 'border-zinc-400/60 bg-zinc-400/15 text-zinc-300',
  black: 'border-zinc-400/60 bg-zinc-950 text-zinc-200',
}

/**
 * canvas 专用的实心档取值。**不是新增颜色** —— 十六个色相仍是上面那批，
 * 只是换了个载体：`<canvas>` 拿不到 Tailwind 类名，而 Tailwind 4 的色板全是 `oklch()`，
 * `fillStyle` 不认时是**静默失败**（保留上一次的颜色），画出来的图会张冠李戴。
 *
 * 值 = `PLAYER_SOLID` 那一档（-400，`black` 是 zinc-950）的 oklch 换算成 sRGB，
 * 源值见 `node_modules/tailwindcss/theme.css`，改版本时按那里重算。
 * `fg` 与 `PLAYER_SOLID` 的文字色一致，`ring` 只有「黑」有 —— 深底上的近黑块只能靠亮描边成形。
 */
export const PLAYER_HEX: Record<PlayerColor, { bg: string; fg: string; ring?: string }> = {
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
  white: { bg: '#f4f4f5', fg: INK }, // zinc-100
  gray: { bg: '#9f9fa9', fg: INK }, // zinc-400
  black: { bg: '#09090b', fg: '#f5f5f5', ring: '#9f9fa9' }, // zinc-950 + text + zinc-400
}

/** 色点：列表行前的小圆点，只需要底色 */
export const PLAYER_DOT: Record<PlayerColor, string> = {
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
  white: 'bg-zinc-100',
  gray: 'bg-zinc-400',
  black: 'bg-zinc-950 ring-1 ring-zinc-400',
}
