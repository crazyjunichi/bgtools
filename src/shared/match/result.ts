import type { Seat } from '../players/seats'
import type { MatchPlayer, Outcome } from './types'

/** 席位 → 参与者的快照部分（身份 + 名字色），结果字段由下面几个函数补 */
export function seatsToPlayers(seats: readonly Seat[]): MatchPlayer[] {
  return seats.map((s) => ({ playerId: s.playerId, name: s.name, color: s.color }))
}

/**
 * 按分排名。**并列同名次**（两个第一之后是第三），并列第一都算 win ——
 * 桌上真正的破并列规则每盒游戏都不一样，这里不猜，让用户在结算面板里改。
 *
 * `higherWins: false` 给「分越低越好」的游戏（目前没有，但计分纸允许负分细则，留着这个口）。
 */
export function rankByScore(
  players: readonly MatchPlayer[],
  scoreOf: (p: MatchPlayer) => number,
  higherWins = true,
): MatchPlayer[] {
  const scored = players.map((p) => ({ p, score: scoreOf(p) }))
  const sorted = [...scored].sort((a, b) => (higherWins ? b.score - a.score : a.score - b.score))

  const rankOf = new Map<number, number>()
  sorted.forEach((row, i) => {
    if (!rankOf.has(row.score)) rankOf.set(row.score, i + 1)
  })

  return scored.map(({ p, score }) => {
    const rank = rankOf.get(score) ?? 1
    return { ...p, score, rank, outcome: rank === 1 ? 'win' : 'loss' }
  })
}

/** 合作局：全员共胜共败 */
export function coopResult(players: readonly MatchPlayer[], win: boolean): MatchPlayer[] {
  const outcome: Outcome = win ? 'win' : 'loss'
  return players.map((p) => ({ ...p, outcome }))
}

/** 阵营局：胜方阵营的人 win，其余 loss。没分到阵营的人不给 outcome */
export function teamResult(
  players: readonly MatchPlayer[],
  winnerTeamId: string | null,
): MatchPlayer[] {
  return players.map((p) =>
    p.teamId === undefined
      ? p
      : { ...p, outcome: p.teamId === winnerTeamId ? ('win' as const) : ('loss' as const) },
  )
}
