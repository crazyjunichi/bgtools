import type { I18nKey } from '../../shared/i18n/types'

/**
 * 分段档位：数量 **≥ from** 时得 score 分。
 *
 * 只存下界不存区间：桌游的换算表末档一律是「5 个及以上」，存上界就得给最后一档编一个假的
 * `Infinity`；存下界则查表 = 取最后一个 `from ≤ 数量` 的档，末档天然开口。
 * 显示用的区间（`2–3 个`）由下一档的 `from - 1` 反推，见 [EntryPanel](EntryPanel.tsx)。
 * **必须按 from 升序**。
 */
export type Step = { from: number; score: number }

/**
 * 一条细则怎么把格子里的数变成分。桌上四种都存在，强行统一成一种必然把算术推回给玩家：
 * - `direct` 填的就是分（卡牌分、额外分）
 * - `perUnit` 填数量，线性折算（家庭成员每人 3 分）
 * - `perGroup` 填数量，**每满 N 个**才得分，不满的零头不算（七大奇迹金币 3 枚 1 分）
 * - `table` 填数量，查分段表（田地 4 块 = 3 分 —— 这类**不是乘法**，早先版本让人自己查表，错了）
 */
export type Scoring =
  | { kind: 'direct' }
  | { kind: 'perUnit'; per: number }
  | { kind: 'perGroup'; every: number; score: number }
  | { kind: 'table'; steps: readonly Step[] }

export const DIRECT: Scoring = { kind: 'direct' }

/** 格子里填的是数量（而非得分）—— 矩阵角标、键盘标签、浮层文案都按它分叉 */
export function isCount(s: Scoring): boolean {
  return s.kind !== 'direct'
}

/**
 * 模板里的一条计分细则。**纯数据常量，存 key 不存文案**
 * （模块顶层求值拿不到 hook，切语言时已渲染的表格要跟着变）。
 */
export type SheetEntry = {
  /**
   * 稳定字面量 id，参与 [store](store.ts) 里 `cells` 与 `overrides` 的键。
   * **不许改**：改了等于把老存档里这一行的分数丢掉。带模板前缀避免跨模板撞键。
   */
  id: string
  nameKey: I18nKey
  /** 缺省 = [DIRECT](#DIRECT)。用户可在行首浮层里改，改动存 store 的 overrides，这里的常量不动 */
  scoring?: Scoring
}

export type SheetTemplate = {
  id: string
  nameKey: I18nKey
  /**
   * 兜底图标。`cover` 缺失或加载失败（离线、文件没抓到）时显示它，
   * 所以**一个都不许删** —— 图挂了列表还得认得出是哪款游戏
   */
  icon: string
  /**
   * 盒图，路径相对 `public/`（由 `.claude/skills/bgg-cover` 抓的 96×96 PNG）。
   * 渲染时必须拼 `import.meta.env.BASE_URL`，`base: './'` 下不许写绝对路径
   */
  cover?: string
  /**
   * **只参与搜索、永不渲染**的别名串（`农家乐`、`翼展`、`车票之旅`）。
   * 桌上的口头叫法常常不是官方译名，只匹配正式名会搜不到
   */
  aliasKey?: I18nKey
  entries: readonly SheetEntry[]
  /** 条目可增删改名。只有 custom 是 true，它的条目来自 store 的 customEntries */
  editable?: boolean
}

/** 通用空白模板的 id。它在列表里钉在首位，也是模板 id 失效时的落点 */
export const BLANK_ID = 'custom'

const custom: SheetTemplate = {
  id: BLANK_ID,
  nameKey: 'tools.scoreSheet.templates.custom',
  // 不是一款游戏、BGG 上没有条目，所以只有 emoji（与 meta.icon 一致）
  icon: '📝',
  entries: [],
  editable: true,
}

// 农场主的四张换算表，形状重合的直接共用一份（牧场 = 蔬菜，谷物 = 羊）
const T_FIELDS: readonly Step[] = [
  { from: 0, score: -1 },
  { from: 2, score: 1 },
  { from: 3, score: 2 },
  { from: 4, score: 3 },
  { from: 5, score: 4 },
]
const T_ONE_EACH: readonly Step[] = [
  { from: 0, score: -1 },
  { from: 1, score: 1 },
  { from: 2, score: 2 },
  { from: 3, score: 3 },
  { from: 4, score: 4 },
]
const T_BY_THREE: readonly Step[] = [
  { from: 0, score: -1 },
  { from: 1, score: 1 },
  { from: 4, score: 2 },
  { from: 6, score: 3 },
  { from: 8, score: 4 },
]
const T_BY_TWO: readonly Step[] = [
  { from: 0, score: -1 },
  { from: 1, score: 1 },
  { from: 3, score: 2 },
  { from: 5, score: 3 },
  { from: 7, score: 4 },
]
const T_CATTLE: readonly Step[] = [
  { from: 0, score: -1 },
  { from: 1, score: 1 },
  { from: 2, score: 2 },
  { from: 4, score: 3 },
  { from: 6, score: 4 },
]

/** 七大奇迹的科技符号：同种 n 个得 n² 分。三种符号形状重合，共用一份 */
const T_SQUARE: readonly Step[] = [
  { from: 0, score: 0 },
  { from: 1, score: 1 },
  { from: 2, score: 4 },
  { from: 3, score: 9 },
  { from: 4, score: 16 },
  { from: 5, score: 25 },
  { from: 6, score: 36 },
]

/** 《农场主》局末计分。木屋房间 0 分，故不列行 */
const agricola: SheetTemplate = {
  id: 'agricola',
  nameKey: 'tools.scoreSheet.templates.agricola',
  icon: '🌾',
  cover: 'covers/sheet/agricola.png',
  aliasKey: 'tools.scoreSheet.templateAlias.agricola',
  entries: [
    { id: 'ag.fields', nameKey: 'tools.scoreSheet.agricola.fields', scoring: { kind: 'table', steps: T_FIELDS } },
    {
      id: 'ag.pastures',
      nameKey: 'tools.scoreSheet.agricola.pastures',
      scoring: { kind: 'table', steps: T_ONE_EACH },
    },
    { id: 'ag.grain', nameKey: 'tools.scoreSheet.agricola.grain', scoring: { kind: 'table', steps: T_BY_THREE } },
    { id: 'ag.veg', nameKey: 'tools.scoreSheet.agricola.veg', scoring: { kind: 'table', steps: T_ONE_EACH } },
    { id: 'ag.sheep', nameKey: 'tools.scoreSheet.agricola.sheep', scoring: { kind: 'table', steps: T_BY_THREE } },
    { id: 'ag.boar', nameKey: 'tools.scoreSheet.agricola.boar', scoring: { kind: 'table', steps: T_BY_TWO } },
    { id: 'ag.cattle', nameKey: 'tools.scoreSheet.agricola.cattle', scoring: { kind: 'table', steps: T_CATTLE } },
    { id: 'ag.unused', nameKey: 'tools.scoreSheet.agricola.unused', scoring: { kind: 'perUnit', per: -1 } },
    { id: 'ag.stables', nameKey: 'tools.scoreSheet.agricola.stables', scoring: { kind: 'perUnit', per: 1 } },
    { id: 'ag.clayRooms', nameKey: 'tools.scoreSheet.agricola.clayRooms', scoring: { kind: 'perUnit', per: 1 } },
    { id: 'ag.stoneRooms', nameKey: 'tools.scoreSheet.agricola.stoneRooms', scoring: { kind: 'perUnit', per: 2 } },
    { id: 'ag.family', nameKey: 'tools.scoreSheet.agricola.family', scoring: { kind: 'perUnit', per: 3 } },
    { id: 'ag.begging', nameKey: 'tools.scoreSheet.agricola.begging', scoring: { kind: 'perUnit', per: -3 } },
    { id: 'ag.cards', nameKey: 'tools.scoreSheet.agricola.cards' },
    { id: 'ag.bonus', nameKey: 'tools.scoreSheet.agricola.bonus' },
  ],
}

/**
 * 《卡坦岛》。最长道路 / 最大骑士团是**一次性 2 分**，不是数量 ——
 * 用 direct 让人直接填 2，走 perUnit 反而要先想「这算 1 个还是 2 个」
 */
const catan: SheetTemplate = {
  id: 'catan',
  nameKey: 'tools.scoreSheet.templates.catan',
  icon: '🏝',
  cover: 'covers/sheet/catan.png',
  aliasKey: 'tools.scoreSheet.templateAlias.catan',
  entries: [
    { id: 'ct.settlements', nameKey: 'tools.scoreSheet.catan.settlements', scoring: { kind: 'perUnit', per: 1 } },
    { id: 'ct.cities', nameKey: 'tools.scoreSheet.catan.cities', scoring: { kind: 'perUnit', per: 2 } },
    { id: 'ct.longestRoad', nameKey: 'tools.scoreSheet.catan.longestRoad' },
    { id: 'ct.largestArmy', nameKey: 'tools.scoreSheet.catan.largestArmy' },
    { id: 'ct.vpCards', nameKey: 'tools.scoreSheet.catan.vpCards', scoring: { kind: 'perUnit', per: 1 } },
    { id: 'ct.bonus', nameKey: 'tools.scoreSheet.catan.bonus' },
  ],
}

/** 《璀璨宝石》。两行就完了 —— 短模板也值得存，省的是「每局重新加五个空条目」 */
const splendor: SheetTemplate = {
  id: 'splendor',
  nameKey: 'tools.scoreSheet.templates.splendor',
  icon: '💎',
  cover: 'covers/sheet/splendor.png',
  aliasKey: 'tools.scoreSheet.templateAlias.splendor',
  entries: [
    { id: 'sp.cards', nameKey: 'tools.scoreSheet.splendor.cards' },
    { id: 'sp.nobles', nameKey: 'tools.scoreSheet.splendor.nobles', scoring: { kind: 'perUnit', per: 3 } },
  ],
}

/** 《花砖物语》。面板分是局中累计的，只有三项局末奖励要折算 */
const azul: SheetTemplate = {
  id: 'azul',
  nameKey: 'tools.scoreSheet.templates.azul',
  icon: '🎨',
  cover: 'covers/sheet/azul.png',
  aliasKey: 'tools.scoreSheet.templateAlias.azul',
  entries: [
    { id: 'az.board', nameKey: 'tools.scoreSheet.azul.board' },
    { id: 'az.rows', nameKey: 'tools.scoreSheet.azul.rows', scoring: { kind: 'perUnit', per: 2 } },
    { id: 'az.cols', nameKey: 'tools.scoreSheet.azul.cols', scoring: { kind: 'perUnit', per: 7 } },
    { id: 'az.colors', nameKey: 'tools.scoreSheet.azul.colors', scoring: { kind: 'perUnit', per: 10 } },
  ],
}

/**
 * 《铁路之旅》。「未完成面值」填的是**车票面值总和**而非张数（每张扣的分各不相同），
 * 靠 `perUnit -1` 把这个和取负 —— 行首会显示「每个 −1 分」，填 12 得 −12
 */
const ticketToRide: SheetTemplate = {
  id: 'ticketToRide',
  nameKey: 'tools.scoreSheet.templates.ticketToRide',
  icon: '🚂',
  cover: 'covers/sheet/ticket-to-ride.png',
  aliasKey: 'tools.scoreSheet.templateAlias.ticketToRide',
  entries: [
    { id: 'tr.routes', nameKey: 'tools.scoreSheet.ticketToRide.routes' },
    { id: 'tr.tickets', nameKey: 'tools.scoreSheet.ticketToRide.tickets' },
    { id: 'tr.failed', nameKey: 'tools.scoreSheet.ticketToRide.failed', scoring: { kind: 'perUnit', per: -1 } },
    { id: 'tr.longest', nameKey: 'tools.scoreSheet.ticketToRide.longest' },
    { id: 'tr.stations', nameKey: 'tools.scoreSheet.ticketToRide.stations', scoring: { kind: 'perUnit', per: 4 } },
  ],
}

/** 《卡卡颂》。局末只剩没围完的那些：城市按「板块 + 纹章」数，修道院按「自己 + 周围板块」数 */
const carcassonne: SheetTemplate = {
  id: 'carcassonne',
  nameKey: 'tools.scoreSheet.templates.carcassonne',
  icon: '🧩',
  cover: 'covers/sheet/carcassonne.png',
  aliasKey: 'tools.scoreSheet.templateAlias.carcassonne',
  entries: [
    { id: 'ca.track', nameKey: 'tools.scoreSheet.carcassonne.track' },
    { id: 'ca.city', nameKey: 'tools.scoreSheet.carcassonne.city', scoring: { kind: 'perUnit', per: 1 } },
    { id: 'ca.road', nameKey: 'tools.scoreSheet.carcassonne.road', scoring: { kind: 'perUnit', per: 1 } },
    { id: 'ca.cloister', nameKey: 'tools.scoreSheet.carcassonne.cloister', scoring: { kind: 'perUnit', per: 1 } },
    { id: 'ca.farmers', nameKey: 'tools.scoreSheet.carcassonne.farmers', scoring: { kind: 'perUnit', per: 3 } },
    { id: 'ca.bonus', nameKey: 'tools.scoreSheet.carcassonne.bonus' },
  ],
}

/** 《展翅翱翔》。官方计分表的六行，后三行都是「数一遍实物」 */
const wingspan: SheetTemplate = {
  id: 'wingspan',
  nameKey: 'tools.scoreSheet.templates.wingspan',
  icon: '🐦',
  cover: 'covers/sheet/wingspan.png',
  aliasKey: 'tools.scoreSheet.templateAlias.wingspan',
  entries: [
    { id: 'ws.birds', nameKey: 'tools.scoreSheet.wingspan.birds' },
    { id: 'ws.bonus', nameKey: 'tools.scoreSheet.wingspan.bonus' },
    { id: 'ws.goals', nameKey: 'tools.scoreSheet.wingspan.goals' },
    { id: 'ws.eggs', nameKey: 'tools.scoreSheet.wingspan.eggs', scoring: { kind: 'perUnit', per: 1 } },
    { id: 'ws.food', nameKey: 'tools.scoreSheet.wingspan.food', scoring: { kind: 'perUnit', per: 1 } },
    { id: 'ws.tucked', nameKey: 'tools.scoreSheet.wingspan.tucked', scoring: { kind: 'perUnit', per: 1 } },
  ],
}

/** 《拼布》。空格是唯一的负分行（每格 −2） */
const patchwork: SheetTemplate = {
  id: 'patchwork',
  nameKey: 'tools.scoreSheet.templates.patchwork',
  icon: '🧵',
  cover: 'covers/sheet/patchwork.png',
  aliasKey: 'tools.scoreSheet.templateAlias.patchwork',
  entries: [
    { id: 'pw.buttons', nameKey: 'tools.scoreSheet.patchwork.buttons', scoring: { kind: 'perUnit', per: 1 } },
    { id: 'pw.empty', nameKey: 'tools.scoreSheet.patchwork.empty', scoring: { kind: 'perUnit', per: -2 } },
    { id: 'pw.special', nameKey: 'tools.scoreSheet.patchwork.special' },
  ],
}

/** 《绮丽庄园》。前四行都是「把卡上的数加起来」，只有点数令牌是一个个数 */
const everdell: SheetTemplate = {
  id: 'everdell',
  nameKey: 'tools.scoreSheet.templates.everdell',
  icon: '🌳',
  cover: 'covers/sheet/everdell.png',
  aliasKey: 'tools.scoreSheet.templateAlias.everdell',
  entries: [
    { id: 'ev.cards', nameKey: 'tools.scoreSheet.everdell.cards' },
    { id: 'ev.prosperity', nameKey: 'tools.scoreSheet.everdell.prosperity' },
    { id: 'ev.events', nameKey: 'tools.scoreSheet.everdell.events' },
    { id: 'ev.journey', nameKey: 'tools.scoreSheet.everdell.journey' },
    { id: 'ev.tokens', nameKey: 'tools.scoreSheet.everdell.tokens', scoring: { kind: 'perUnit', per: 1 } },
  ],
}

/**
 * 《七大奇迹》。两处非线性都在这儿：
 * 金币**每 3 枚 1 分**（零头不算，`perGroup`），三种科技符号**同种 n 个得 n²**（`T_SQUARE`），
 * 三种各出一套再额外 7 分（`sets`）—— 科技拆成四行才算得清，合成一行必然要玩家自己乘
 */
const sevenWonders: SheetTemplate = {
  id: 'sevenWonders',
  nameKey: 'tools.scoreSheet.templates.sevenWonders',
  icon: '🏛',
  cover: 'covers/sheet/seven-wonders.png',
  aliasKey: 'tools.scoreSheet.templateAlias.sevenWonders',
  entries: [
    { id: '7w.military', nameKey: 'tools.scoreSheet.sevenWonders.military' },
    {
      id: '7w.coins',
      nameKey: 'tools.scoreSheet.sevenWonders.coins',
      scoring: { kind: 'perGroup', every: 3, score: 1 },
    },
    { id: '7w.wonders', nameKey: 'tools.scoreSheet.sevenWonders.wonders' },
    { id: '7w.civilian', nameKey: 'tools.scoreSheet.sevenWonders.civilian' },
    { id: '7w.commerce', nameKey: 'tools.scoreSheet.sevenWonders.commerce' },
    { id: '7w.guilds', nameKey: 'tools.scoreSheet.sevenWonders.guilds' },
    { id: '7w.gears', nameKey: 'tools.scoreSheet.sevenWonders.gears', scoring: { kind: 'table', steps: T_SQUARE } },
    { id: '7w.tablets', nameKey: 'tools.scoreSheet.sevenWonders.tablets', scoring: { kind: 'table', steps: T_SQUARE } },
    {
      id: '7w.compasses',
      nameKey: 'tools.scoreSheet.sevenWonders.compasses',
      scoring: { kind: 'table', steps: T_SQUARE },
    },
    { id: '7w.sets', nameKey: 'tools.scoreSheet.sevenWonders.sets', scoring: { kind: 'perUnit', per: 7 } },
  ],
}

/**
 * 《阿纳克遗迹》。研究轨迹的放大镜与笔记本各停在一格、各印一个分值，
 * 拆成两行 —— 合成一行等于让人先自己加一遍。神像分随槽位变，只能直接填
 */
const arnak: SheetTemplate = {
  id: 'arnak',
  nameKey: 'tools.scoreSheet.templates.arnak',
  icon: '🏺',
  cover: 'covers/sheet/arnak.png',
  aliasKey: 'tools.scoreSheet.templateAlias.arnak',
  entries: [
    { id: 'ak.magnifier', nameKey: 'tools.scoreSheet.arnak.magnifier' },
    { id: 'ak.notebook', nameKey: 'tools.scoreSheet.arnak.notebook' },
    { id: 'ak.temple', nameKey: 'tools.scoreSheet.arnak.temple' },
    { id: 'ak.idols', nameKey: 'tools.scoreSheet.arnak.idols' },
    { id: 'ak.guardians', nameKey: 'tools.scoreSheet.arnak.guardians', scoring: { kind: 'perUnit', per: 5 } },
    { id: 'ak.cards', nameKey: 'tools.scoreSheet.arnak.cards' },
    { id: 'ak.fear', nameKey: 'tools.scoreSheet.arnak.fear', scoring: { kind: 'perUnit', per: -1 } },
  ],
}

/**
 * 《喀斯喀迪亚》。全项目最长的一张表，也是它最该被逐项填的原因：
 * 五种动物 + 五种地形各自独立结算，一行一项才对得上桌上那张官方计分纸。
 *
 * 动物分随本局抽到的计分卡变（同一种动物不同卡算法完全不同），
 * 地形行填的是「最大走廊格数 + 多数奖励」，两者都算不出通式，所以全是直接填分
 */
const cascadia: SheetTemplate = {
  id: 'cascadia',
  nameKey: 'tools.scoreSheet.templates.cascadia',
  icon: '🦌',
  cover: 'covers/sheet/cascadia.png',
  aliasKey: 'tools.scoreSheet.templateAlias.cascadia',
  entries: [
    { id: 'cs.bear', nameKey: 'tools.scoreSheet.cascadia.bear' },
    { id: 'cs.elk', nameKey: 'tools.scoreSheet.cascadia.elk' },
    { id: 'cs.salmon', nameKey: 'tools.scoreSheet.cascadia.salmon' },
    { id: 'cs.hawk', nameKey: 'tools.scoreSheet.cascadia.hawk' },
    { id: 'cs.fox', nameKey: 'tools.scoreSheet.cascadia.fox' },
    { id: 'cs.mountain', nameKey: 'tools.scoreSheet.cascadia.mountain' },
    { id: 'cs.forest', nameKey: 'tools.scoreSheet.cascadia.forest' },
    { id: 'cs.prairie', nameKey: 'tools.scoreSheet.cascadia.prairie' },
    { id: 'cs.wetland', nameKey: 'tools.scoreSheet.cascadia.wetland' },
    { id: 'cs.river', nameKey: 'tools.scoreSheet.cascadia.river' },
    { id: 'cs.nature', nameKey: 'tools.scoreSheet.cascadia.nature', scoring: { kind: 'perUnit', per: 1 } },
  ],
}

/**
 * 《火星殖民地》。城市那行填的是**邻接绿地数**而不是城市数 ——
 * 城市本身不给分，分全来自身边的绿地（谁种的都算）
 */
const terraformingMars: SheetTemplate = {
  id: 'terraformingMars',
  nameKey: 'tools.scoreSheet.templates.terraformingMars',
  icon: '🚀',
  cover: 'covers/sheet/terraforming-mars.png',
  aliasKey: 'tools.scoreSheet.templateAlias.terraformingMars',
  entries: [
    { id: 'tf.tr', nameKey: 'tools.scoreSheet.terraformingMars.tr' },
    {
      id: 'tf.milestones',
      nameKey: 'tools.scoreSheet.terraformingMars.milestones',
      scoring: { kind: 'perUnit', per: 5 },
    },
    { id: 'tf.awards', nameKey: 'tools.scoreSheet.terraformingMars.awards' },
    { id: 'tf.greenery', nameKey: 'tools.scoreSheet.terraformingMars.greenery', scoring: { kind: 'perUnit', per: 1 } },
    { id: 'tf.cities', nameKey: 'tools.scoreSheet.terraformingMars.cities', scoring: { kind: 'perUnit', per: 1 } },
    { id: 'tf.cards', nameKey: 'tools.scoreSheet.terraformingMars.cards' },
  ],
}

/**
 * 《泰拉神秘之地》。四条教派轨迹各自排名给分，拆四行。
 *
 * 剩余资源那行按金币折算（其他资源先自行换成金币）；炼金术士的换算率与众不同，
 * 用那个种族时把这一行在行首浮层里改成「直接填得分」
 */
const terraMystica: SheetTemplate = {
  id: 'terraMystica',
  nameKey: 'tools.scoreSheet.templates.terraMystica',
  icon: '🧙',
  cover: 'covers/sheet/terra-mystica.png',
  aliasKey: 'tools.scoreSheet.templateAlias.terraMystica',
  entries: [
    { id: 'tm.track', nameKey: 'tools.scoreSheet.terraMystica.track' },
    { id: 'tm.network', nameKey: 'tools.scoreSheet.terraMystica.network' },
    { id: 'tm.fire', nameKey: 'tools.scoreSheet.terraMystica.fire' },
    { id: 'tm.water', nameKey: 'tools.scoreSheet.terraMystica.water' },
    { id: 'tm.earth', nameKey: 'tools.scoreSheet.terraMystica.earth' },
    { id: 'tm.air', nameKey: 'tools.scoreSheet.terraMystica.air' },
    {
      id: 'tm.coins',
      nameKey: 'tools.scoreSheet.terraMystica.coins',
      scoring: { kind: 'perGroup', every: 3, score: 1 },
    },
  ],
}

/**
 * 《大西部之路》。城市徽章与目标卡**可以是负的**，所以这两行留直接填分 ——
 * 键盘上有正负号键。工人那行只数站在计分格上的那几个，不是全部工人
 */
const greatWesternTrail: SheetTemplate = {
  id: 'greatWesternTrail',
  nameKey: 'tools.scoreSheet.templates.greatWesternTrail',
  icon: '🤠',
  cover: 'covers/sheet/great-western-trail.png',
  aliasKey: 'tools.scoreSheet.templateAlias.greatWesternTrail',
  entries: [
    {
      id: 'gw.money',
      nameKey: 'tools.scoreSheet.greatWesternTrail.money',
      scoring: { kind: 'perGroup', every: 5, score: 1 },
    },
    { id: 'gw.buildings', nameKey: 'tools.scoreSheet.greatWesternTrail.buildings' },
    { id: 'gw.cities', nameKey: 'tools.scoreSheet.greatWesternTrail.cities' },
    { id: 'gw.stations', nameKey: 'tools.scoreSheet.greatWesternTrail.stations' },
    { id: 'gw.hazards', nameKey: 'tools.scoreSheet.greatWesternTrail.hazards' },
    { id: 'gw.cattle', nameKey: 'tools.scoreSheet.greatWesternTrail.cattle' },
    { id: 'gw.objectives', nameKey: 'tools.scoreSheet.greatWesternTrail.objectives' },
    { id: 'gw.stationMaster', nameKey: 'tools.scoreSheet.greatWesternTrail.stationMaster' },
    { id: 'gw.workers', nameKey: 'tools.scoreSheet.greatWesternTrail.workers', scoring: { kind: 'perUnit', per: 4 } },
    { id: 'gw.bonus', nameKey: 'tools.scoreSheet.greatWesternTrail.bonus' },
  ],
}

/**
 * 《勃艮第城堡》。区域、售货、动物那些分局中就走计分轨了，事后没法逐项回溯，
 * 所以只给一行「计分轨」抄总数，剩下四行才是真正的终局结算
 */
const castlesOfBurgundy: SheetTemplate = {
  id: 'castlesOfBurgundy',
  nameKey: 'tools.scoreSheet.templates.castlesOfBurgundy',
  icon: '🏰',
  cover: 'covers/sheet/castles-of-burgundy.png',
  aliasKey: 'tools.scoreSheet.templateAlias.castlesOfBurgundy',
  entries: [
    { id: 'cb.track', nameKey: 'tools.scoreSheet.castlesOfBurgundy.track' },
    { id: 'cb.knowledge', nameKey: 'tools.scoreSheet.castlesOfBurgundy.knowledge' },
    { id: 'cb.goods', nameKey: 'tools.scoreSheet.castlesOfBurgundy.goods', scoring: { kind: 'perUnit', per: 1 } },
    { id: 'cb.silver', nameKey: 'tools.scoreSheet.castlesOfBurgundy.silver', scoring: { kind: 'perUnit', per: 1 } },
    {
      id: 'cb.workers',
      nameKey: 'tools.scoreSheet.castlesOfBurgundy.workers',
      scoring: { kind: 'perGroup', every: 2, score: 1 },
    },
    { id: 'cb.bonus', nameKey: 'tools.scoreSheet.castlesOfBurgundy.bonus' },
  ],
}

/** 《Clank!》。神器、皇冠、秘密标记的面值各不相同，只有偶像与精通标记是定额 */
const clank: SheetTemplate = {
  id: 'clank',
  nameKey: 'tools.scoreSheet.templates.clank',
  icon: '💀',
  cover: 'covers/sheet/clank.png',
  aliasKey: 'tools.scoreSheet.templateAlias.clank',
  entries: [
    { id: 'ck.artifacts', nameKey: 'tools.scoreSheet.clank.artifacts' },
    { id: 'ck.crowns', nameKey: 'tools.scoreSheet.clank.crowns' },
    { id: 'ck.secrets', nameKey: 'tools.scoreSheet.clank.secrets' },
    { id: 'ck.monkey', nameKey: 'tools.scoreSheet.clank.monkey', scoring: { kind: 'perUnit', per: 5 } },
    { id: 'ck.gold', nameKey: 'tools.scoreSheet.clank.gold', scoring: { kind: 'perUnit', per: 1 } },
    { id: 'ck.cards', nameKey: 'tools.scoreSheet.clank.cards' },
    { id: 'ck.mastery', nameKey: 'tools.scoreSheet.clank.mastery', scoring: { kind: 'perUnit', per: 20 } },
  ],
}

/**
 * 声明顺序**不决定显示顺序** —— [SheetSettings](SheetSettings.tsx) 把通用空白钉在首位、
 * 其余按当前语言的名字排。这个数组只是 `findTemplate` 的查找源
 */
export const TEMPLATES: readonly SheetTemplate[] = [
  custom,
  agricola,
  catan,
  splendor,
  azul,
  ticketToRide,
  carcassonne,
  wingspan,
  patchwork,
  everdell,
  sevenWonders,
  arnak,
  cascadia,
  terraformingMars,
  terraMystica,
  greatWesternTrail,
  castlesOfBurgundy,
  clank,
]

export function findTemplate(id: string): SheetTemplate {
  // 存档里的模板 id 失效（比如以后删了某个模板）就退回通用空白，不让整页崩
  return TEMPLATES.find((t) => t.id === id) ?? custom
}
