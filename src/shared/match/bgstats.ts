import { findGame } from '../games/registry'
import i18n from '../i18n'
import type { MatchDraft } from './types'

/**
 * 「推送到 BGStats」—— 官方给第三方应用的 URL 通道：
 *   https://app.bgstatsapp.com/createPlay.html?data=<urlencoded json>
 * 装了 BGStats 的设备会跳进它的导入对话框：游戏按 bggId、玩家按名字自动匹配，
 * 匹配结果由它记住，之后零操作；没装则只是打开一个网页，无副作用。
 * 这是跳转链接不是请求，与「纯本地无后端」不冲突。
 * 格式契约见 bgstatsapp.com/support/push-plays-to-bg-stats-from-other-apps-or-websites
 */

/** 游戏名与阵营名取英文快照：对方的游戏库与名字匹配是英文主导的 */
const en = () => i18n.getFixedT('en')

/** playDate 是 UTC 的结束时刻，格式 yyyy-MM-dd HH:mm:ss */
function utcText(ms: number): string {
  return new Date(ms).toISOString().slice(0, 19).replace('T', ' ')
}

/**
 * 拼推送 URL；**这局推不了时回 null**（调用方据此不渲染按钮）：
 * - 旧存档（legacy）没有分数与胜负，推过去只会污染对方的统计
 * - 没指定游戏的局拼不出必填的 game 块
 */
export function bgStatsUrl(match: MatchDraft & { legacy?: boolean }): string | null {
  if (match.legacy) return null
  const game = findGame(match.gameId)
  if (!game) return null
  const t = en()

  const spentMs = match.endAt - match.startedAt
  const data = {
    sourceName: 'BGTools',
    // 结算面板刚打开时可能还没拿到归档 id；那边靠用户确认匹配，重复推送不会静默记两条
    sourcePlayId: match.id ?? crypto.randomUUID(),
    playDate: utcText(match.endAt),
    durationMin: spentMs > 0 ? Math.round(spentMs / 60_000) : undefined,
    comments: match.note,
    game: {
      name: t(game.nameKey),
      sourceGameId: game.id,
      bggId: game.bggId,
      // 我们没有「低分获胜」的数据；对方有 rank/winner 可解读，这个字段影响有限
      highestWins: true,
      noPoints: match.mode !== 'ranked',
    },
    players: match.players.map((p) => {
      const teamKey = p.teamId
        ? game.teams?.find((x) => x.id === p.teamId)?.nameKey
        : undefined
      return {
        name: p.name,
        // 临时席位没有名单 id，名字就是它最稳定的标识
        sourcePlayerId: p.playerId ?? p.name,
        winner: p.outcome === 'win',
        score: p.score,
        rank: p.rank,
        // 身份表里查不到就照实给 id（不该发生，但比悄悄丢掉强）
        team: p.teamId ? (teamKey ? t(teamKey) : p.teamId) : undefined,
      }
    }),
  }
  // undefined 字段由 stringify 丢弃 —— 时长为 0、无备注、无 bggId 时键就不出现
  return `https://app.bgstatsapp.com/createPlay.html?data=${encodeURIComponent(JSON.stringify(data))}`
}
