import type { Game } from './types'

/**
 * 游戏目录 —— 唯一真源。
 *
 * 一条 = 桌上真有的那盒游戏。**它不是工具列表**：计分纸一个工具服务这里的大半条，
 * 而骰子、计时器这些不属于任何一盒游戏，压根不在这里。
 *
 * 新增一盒：在此追加一行 + 两个 locale 补 `games.name.<id>`（有别名再补 `games.alias.<id>`）。
 * 要给它配一张计分表就在 [templates](../../tools/score-sheet/templates.ts) 里加一条指回来。
 */
export const GAMES: readonly Game[] = [
  {
    id: 'agricola',
    nameKey: 'games.name.agricola',
    icon: '🌾',
    cover: 'covers/sheet/agricola.png',
    hue: 'amber',
    aliasKey: 'games.alias.agricola',
    resultMode: 'ranked',
  },
  {
    id: 'catan',
    nameKey: 'games.name.catan',
    icon: '🏝',
    cover: 'covers/sheet/catan.png',
    hue: 'red',
    aliasKey: 'games.alias.catan',
    resultMode: 'ranked',
  },
  {
    id: 'splendor',
    nameKey: 'games.name.splendor',
    icon: '💎',
    cover: 'covers/sheet/splendor.png',
    hue: 'indigo',
    aliasKey: 'games.alias.splendor',
    resultMode: 'ranked',
  },
  {
    id: 'azul',
    nameKey: 'games.name.azul',
    icon: '🎨',
    cover: 'covers/sheet/azul.png',
    hue: 'cyan',
    aliasKey: 'games.alias.azul',
    resultMode: 'ranked',
  },
  {
    id: 'ticketToRide',
    nameKey: 'games.name.ticketToRide',
    icon: '🚂',
    cover: 'covers/sheet/ticket-to-ride.png',
    hue: 'orange',
    aliasKey: 'games.alias.ticketToRide',
    resultMode: 'ranked',
  },
  {
    id: 'carcassonne',
    nameKey: 'games.name.carcassonne',
    icon: '🧩',
    cover: 'covers/sheet/carcassonne.png',
    hue: 'lime',
    aliasKey: 'games.alias.carcassonne',
    resultMode: 'ranked',
  },
  {
    id: 'wingspan',
    nameKey: 'games.name.wingspan',
    icon: '🐦',
    cover: 'covers/sheet/wingspan.png',
    hue: 'sky',
    aliasKey: 'games.alias.wingspan',
    resultMode: 'ranked',
  },
  {
    id: 'patchwork',
    nameKey: 'games.name.patchwork',
    icon: '🧵',
    cover: 'covers/sheet/patchwork.png',
    hue: 'pink',
    aliasKey: 'games.alias.patchwork',
    // 只有双人玩法，人数区间是规则书写死的
    players: { min: 2, max: 2 },
    resultMode: 'ranked',
  },
  {
    id: 'everdell',
    nameKey: 'games.name.everdell',
    icon: '🌳',
    cover: 'covers/sheet/everdell.png',
    hue: 'yellow',
    aliasKey: 'games.alias.everdell',
    resultMode: 'ranked',
  },
  {
    id: 'sevenWonders',
    nameKey: 'games.name.sevenWonders',
    icon: '🏛',
    cover: 'covers/sheet/seven-wonders.png',
    hue: 'brown',
    aliasKey: 'games.alias.sevenWonders',
    resultMode: 'ranked',
  },
  {
    id: 'arnak',
    nameKey: 'games.name.arnak',
    icon: '🏺',
    cover: 'covers/sheet/arnak.png',
    hue: 'emerald',
    aliasKey: 'games.alias.arnak',
    resultMode: 'ranked',
  },
  {
    id: 'cascadia',
    nameKey: 'games.name.cascadia',
    icon: '🦌',
    cover: 'covers/sheet/cascadia.png',
    hue: 'blue',
    aliasKey: 'games.alias.cascadia',
    resultMode: 'ranked',
  },
  {
    id: 'terraformingMars',
    nameKey: 'games.name.terraformingMars',
    icon: '🚀',
    cover: 'covers/sheet/terraforming-mars.png',
    hue: 'orange',
    aliasKey: 'games.alias.terraformingMars',
    resultMode: 'ranked',
  },
  {
    id: 'terraMystica',
    nameKey: 'games.name.terraMystica',
    icon: '🧙',
    cover: 'covers/sheet/terra-mystica.png',
    hue: 'violet',
    aliasKey: 'games.alias.terraMystica',
    resultMode: 'ranked',
  },
  {
    id: 'greatWesternTrail',
    nameKey: 'games.name.greatWesternTrail',
    icon: '🤠',
    cover: 'covers/sheet/great-western-trail.png',
    hue: 'stone',
    aliasKey: 'games.alias.greatWesternTrail',
    resultMode: 'ranked',
  },
  {
    id: 'castlesOfBurgundy',
    nameKey: 'games.name.castlesOfBurgundy',
    icon: '🏰',
    cover: 'covers/sheet/castles-of-burgundy.png',
    hue: 'green',
    aliasKey: 'games.alias.castlesOfBurgundy',
    resultMode: 'ranked',
  },
  {
    id: 'clank',
    nameKey: 'games.name.clank',
    icon: '💀',
    cover: 'covers/sheet/clank.png',
    hue: 'teal',
    aliasKey: 'games.alias.clank',
    resultMode: 'ranked',
  },
  {
    // 有专用工具、没有计分表：全员共胜共败，没有分数可排
    id: 'bomb-busters',
    nameKey: 'games.name.bombBusters',
    icon: '💣',
    cover: 'covers/bomb-busters.png',
    hue: 'red',
    aliasKey: 'games.alias.bombBusters',
    /*
     * 与 [bomb-busters/store](../../tools/bomb-busters/store.ts) 的 `MIN/MAX_PLAYERS` 同源于规则书，
     * 但**刻意各写一份**：shared 不许反向依赖工具目录，而那个 store 一 import 就会拉起 persist
     */
    players: { min: 2, max: 5 },
    resultMode: 'coop',
  },
  {
    id: 'werewolf',
    nameKey: 'games.name.werewolf',
    icon: '🐺',
    hue: 'violet',
    aliasKey: 'games.alias.werewolf',
    resultMode: 'team',
    /*
     * 文案真源在身份表（[roles](../../tools/werewolf/roles.ts) 的 `teamKey`），这里只引用不复制 ——
     * 同一个「好人阵营」在两处各写一遍，改译名时必漏一处。
     * 第三方身份（丘比特之类）目前没进身份表，等真的加了再补这一档
     */
    teams: [
      { id: 'village', nameKey: 'tools.werewolf.roles.team.village' },
      { id: 'wolf', nameKey: 'tools.werewolf.roles.team.wolf' },
    ],
  },
  {
    id: 'yahtzee',
    nameKey: 'games.name.yahtzee',
    icon: '🎲',
    hue: 'amber',
    aliasKey: 'games.alias.yahtzee',
    resultMode: 'ranked',
  },
]

/** 找不到就是 undefined：游戏 id 可能来自老存档，消费方自己决定退回什么 */
export function findGame(id: string | null | undefined): Game | undefined {
  return id ? GAMES.find((g) => g.id === id) : undefined
}
