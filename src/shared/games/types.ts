import type { I18nKey } from '../i18n/types'

/**
 * 盒图主体色档位。只存档位名不存 hex：消费方要按名取 Tailwind 类名，
 * 存 hex 会绕开 `@theme` 也保不住斜视下的对比度。
 *
 * **不含 `rose`** —— 规范把它留给破坏性操作。取色办法与逐盒依据见 DESIGN.md §2。
 */
export type GameHue =
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'stone'
  | 'brown'

/**
 * 一局结束时怎么记结果。四种都存在，强行统一成一种必然要在统计里编造名次：
 * - `ranked` 比分排名（计分类）
 * - `coop` 全员共胜共败（炸弹克星）
 * - `team` 阵营胜负（狼人杀）
 * - `none` 没有胜负这回事，只记「打过一局」
 */
export type ResultMode = 'ranked' | 'coop' | 'team' | 'none'

export type GameTeam = { id: string; nameKey: I18nKey }

/**
 * 一盒游戏。**独立于工具与计分模板** —— 一个工具可以服务很多盒游戏（计分纸），
 * 一盒游戏也可能没有任何专用工具。统计与分享都按它聚合。
 *
 * **纯数据常量，存 key 不存文案**：本表在模块顶层求值拿不到 hook，
 * 由消费方在渲染期 `t()`，切语言时已渲染的一切才会跟着变。
 */
export type Game = {
  /**
   * 稳定字面量 id。计分类的**必须等于原来的 templateId** —— 老存档里存的就是那个串，
   * 改了等于把历史局的游戏身份丢掉。专用工具的游戏沿用 tool id，
   * 所以两套命名混在一起（camelCase 与 kebab-case），**不要为了整齐去统一它**。
   */
  id: string
  /**
   * BGG 条目 id，**开发期手工策展的常量，运行时不访问 BGG**
   * （其 API 需注册 token 且不发 CORS 头，浏览器直连不通）。
   * 用途是推送到外部平台（BGStats）时按 id 精确匹配游戏，而不是靠名字猜
   */
  bggId?: number
  nameKey: I18nKey
  /**
   * 兜底图标。`cover` 缺失或加载失败（离线、图没抓到）时显示它，
   * 所以**一个都不许删** —— 图挂了列表还得认得出是哪款游戏
   */
  icon: string
  /**
   * 盒图，路径相对 `public/`（由 `.claude/skills/bgg-cover` 抓的 96×96 PNG）。
   * 渲染时必须拼 `import.meta.env.BASE_URL`，`base: './'` 下不许写绝对路径
   */
  cover?: string
  /**
   * 卡面规则线色，取自盒图的主色相。**必填，没有缺省值** ——
   * 全共用一个色时那条线就不再是身份编码了。允许两款共享同一档：
   * 卡上同时有盒图与游戏名，颜色从来不是唯一识别码
   */
  hue: GameHue
  /**
   * **只参与搜索、永不渲染**的别名串（`农家乐`、`翼展`、`车票之旅`）。
   * 桌上的口头叫法常常不是官方译名，只匹配正式名会搜不到
   */
  aliasKey?: I18nKey
  /**
   * 人数区间。**只在有硬依据时填**（规则书、或代码里已有的常量），
   * 拿不准就留空 —— 编一个区间会在开局时误拦真实的桌面
   */
  players?: { min: number; max: number }
  /** 结算面板的默认档。用户仍可改：同一盒游戏常有合作与对抗两种玩法 */
  resultMode: ResultMode
  /** 仅 `team` 模式用得到 */
  teams?: readonly GameTeam[]
}
