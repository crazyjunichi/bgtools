import type { TFunction } from 'i18next'
import { dateTimeText, durationText, fmtScore } from '../format'
import { gameLabel } from '../label'
import type { MatchDraft } from '../types'

/**
 * 一局的**纯文本**摘要，贴到群里用。
 *
 * 图片在聊天流里会被缩成读不出的缩略图，而且很多群只看得到文字预览；
 * 所以这是与出图并列的一条分享路径，不是它的降级。
 *
 * 排版靠换行与空格，**不画表格** —— 各家聊天软件的等宽处理都不一样，
 * 对齐的努力在对面看起来只会是散开的。
 */
export function matchSummary(m: MatchDraft, t: TFunction): string {
  const identity = gameLabel(t, m.gameId, m.gameName)
  const spent = m.endAt - m.startedAt

  const lines = [
    [identity.icon, identity.name].filter((x) => x !== null && x !== '').join(' '),
    [dateTimeText(m.endAt), spent > 0 ? durationText(t, spent) : null]
      .filter((x) => x !== null)
      .join(' · '),
    // 名次那一列在合作局里是空的，赢没赢得单独说一句
    m.mode === 'coop' ? t(m.players[0]?.outcome === 'win' ? 'match.coopWin' : 'match.coopLoss') : null,
    ...m.players.map((p) =>
      [
        p.rank === undefined ? null : t('match.rank', { n: p.rank }),
        p.name,
        p.score === undefined ? null : fmtScore(p.score),
      ]
        .filter((x) => x !== null)
        .join(' '),
    ),
    m.note === undefined || m.note === '' ? null : t('match.summary.note', { text: m.note }),
  ]

  return lines.filter((x) => x !== null && x !== '').join('\n')
}

/**
 * 剪贴板可不可用。**http 页面与老浏览器上没有 `navigator.clipboard`**，
 * 拿不到就别渲染那个按钮 —— 点了必然失败的按钮比没有更糟。
 */
export function canCopyText(): boolean {
  return typeof navigator.clipboard?.writeText === 'function'
}

/** 复制失败（权限被拒、不在用户手势里）不抛，让调用方只是不显示「已复制」 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (e) {
    console.warn('[share] copy failed', e)
    return false
  }
}
