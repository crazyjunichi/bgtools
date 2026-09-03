import type { Match, MatchPlayer } from '../../shared/match/types'
import type { PlayerColor } from '../../shared/players/colors'
import type { Player } from '../../shared/players/store'

/** 累加中间态。UI 拿到的是下面几个函数算完的行，不碰这个 */
type Tally = { games: number; decided: number; wins: number; scoreSum: number; scored: number }

/** 一个人在某一盒游戏里的战绩 */
export type GameSplit = {
  gameId: string | null
  games: number
  decided: number
  wins: number
  /**
   * 平均分。**只在同一盒游戏内平均** —— 各盒游戏的分数不是一个量纲，
   * 混着平均出来的数没有含义，所以 `PlayerRow` 那一层刻意没有这个字段
   */
  avgScore: number | null
}

export type PlayerRow = {
  playerId: string
  name: string
  color: PlayerColor
  games: number
  /** 胜率的分母：有胜负结论的局数。`none` 模式的局只算参与过 */
  decided: number
  wins: number
  /** 局数多的在前 */
  byGame: GameSplit[]
}

export type GameRow = {
  gameId: string | null
  games: number
  /** 平均时长。只把真记到了时长的局算进分母（摆完就结算的空局是 0） */
  avgMs: number | null
  lastAt: number
  /** 赢得最多的那个人；一个胜场都没有（或全是临时席位）时为 null */
  topWinner: { name: string; color: PlayerColor; wins: number } | null
}

export type Overview = {
  games: number
  totalMs: number
  /** 玩过几盒不同的游戏。未指定游戏的局不算一盒 */
  gameKinds: number
  /** 被排除在统计外的旧存档条数，> 0 时得在界面上说明，否则总数与历史列表对不上 */
  legacy: number
}

const emptyTally = (): Tally => ({ games: 0, decided: 0, wins: 0, scoreSum: 0, scored: 0 })

function add(t: Tally, p: MatchPlayer) {
  t.games += 1
  if (p.outcome !== undefined) {
    t.decided += 1
    if (p.outcome === 'win') t.wins += 1
  }
  if (p.score !== undefined) {
    t.scoreSum += p.score
    t.scored += 1
  }
}

function pick<T>(map: Map<T, Tally>, key: T): Tally {
  const cur = map.get(key)
  if (cur !== undefined) return cur
  const next = emptyTally()
  map.set(key, next)
  return next
}

/**
 * 名单里还在的人用当前的名字与色（改了名统计页也该跟着改），
 * 已经删掉的人留最近一次的快照 —— 打过的局不该因为人被删而消失。
 */
function identity(playerId: string, snap: MatchPlayer, roster: readonly Player[]) {
  const live = roster.find((p) => p.id === playerId)
  return { name: live?.name ?? snap.name, color: live?.color ?? snap.color }
}

/**
 * 统计的输入 —— **只认新表的记录**。legacy 旧局没有分数与胜负
 * （见 [archive](../../shared/match/archive.ts)），算进来等于替用户编造名次，
 * 所以它们只留在计分纸的历史列表里。
 */
export function statsSource(matches: readonly Match[]): Match[] {
  return matches.filter((m) => !m.legacy)
}

export function overview(all: readonly Match[]): Overview {
  const rows = statsSource(all)
  return {
    games: rows.length,
    totalMs: rows.reduce((sum, m) => sum + Math.max(0, m.endAt - m.startedAt), 0),
    gameKinds: new Set(rows.flatMap((m) => (m.gameId === null ? [] : [m.gameId]))).size,
    legacy: all.length - rows.length,
  }
}

/**
 * 按人聚合。`matches` 必须是**按 endAt 倒序**的（archive 的镜像本来就是），
 * 第一次遇到某人时拿到的才是他最近一次的快照。
 */
export function playerRows(matches: readonly Match[], roster: readonly Player[]): PlayerRow[] {
  type Acc = { snap: MatchPlayer; total: Tally; byGame: Map<string | null, Tally> }
  const acc = new Map<string, Acc>()

  for (const m of matches) {
    for (const p of m.players) {
      // 临时席位不代表一个稳定的人，进个人战绩只会攒出一堆同名陌生人
      if (p.playerId === null) continue
      let row = acc.get(p.playerId)
      if (row === undefined) {
        row = { snap: p, total: emptyTally(), byGame: new Map() }
        acc.set(p.playerId, row)
      }
      add(row.total, p)
      add(pick(row.byGame, m.gameId), p)
    }
  }

  return [...acc]
    .map(([playerId, row]) => ({
      playerId,
      ...identity(playerId, row.snap, roster),
      games: row.total.games,
      decided: row.total.decided,
      wins: row.total.wins,
      byGame: [...row.byGame]
        .map(([gameId, t]) => ({
          gameId,
          games: t.games,
          decided: t.decided,
          wins: t.wins,
          avgScore: t.scored === 0 ? null : t.scoreSum / t.scored,
        }))
        .sort((a, b) => b.games - a.games),
    }))
    // 并列时保持插入序，也就是「最近打过的在前」
    .sort((a, b) => b.games - a.games || b.wins - a.wins)
}

/** 按盒聚合。同一盒被不同工具记的局算在一起 —— 统计关心的是游戏，不是工具 */
export function gameRows(matches: readonly Match[], roster: readonly Player[]): GameRow[] {
  type Acc = {
    games: number
    msSum: number
    timed: number
    lastAt: number
    winners: Map<string, { snap: MatchPlayer; wins: number }>
  }
  const acc = new Map<string | null, Acc>()

  for (const m of matches) {
    let row = acc.get(m.gameId)
    if (row === undefined) {
      row = { games: 0, msSum: 0, timed: 0, lastAt: m.endAt, winners: new Map() }
      acc.set(m.gameId, row)
    }
    row.games += 1
    const span = m.endAt - m.startedAt
    if (span > 0) {
      row.msSum += span
      row.timed += 1
    }
    row.lastAt = Math.max(row.lastAt, m.endAt)
    for (const p of m.players) {
      if (p.playerId === null || p.outcome !== 'win') continue
      const w = row.winners.get(p.playerId)
      if (w === undefined) row.winners.set(p.playerId, { snap: p, wins: 1 })
      else w.wins += 1
    }
  }

  return [...acc]
    .map(([gameId, row]) => ({
      gameId,
      games: row.games,
      avgMs: row.timed === 0 ? null : row.msSum / row.timed,
      lastAt: row.lastAt,
      // 并列时取最近赢过的那个：倒序遍历，Map 的插入序就是「最近」
      topWinner: [...row.winners].reduce<GameRow['topWinner']>(
        (best, [playerId, w]) =>
          best !== null && best.wins >= w.wins
            ? best
            : { ...identity(playerId, w.snap, roster), wins: w.wins },
        null,
      ),
    }))
    .sort((a, b) => b.games - a.games || b.lastAt - a.lastAt)
}

/** 胜率的百分数。没有一局有胜负结论时是 null，界面上出破折号而不是 0% */
export function winRate(row: { decided: number; wins: number }): number | null {
  return row.decided === 0 ? null : Math.round((row.wins / row.decided) * 100)
}
