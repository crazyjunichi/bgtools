import type { CellKind, Team } from './game'

/**
 * 主机 ↔ 玩家手机的私有协议。view 的形状两边都要用（主机裁剪、手机渲染），
 * 放这里而不是 session 层 —— 会话层不解释游戏内容。
 */

/** 手机上行的动作 */
export type ClientAction =
  | { k: 'claim'; team: Team }
  | { k: 'clue'; word: string; n: number }

/** 两张桌子都看得见的公共状态（与平板大屏一致） */
export type PublicView = {
  phase: 'setup' | 'playing' | 'over'
  words: string[]
  revealed: boolean[]
  turn: Team
  clue: { word: string; n: number } | null
  guessesLeft: number
  winner: Team | null
  byAssassin: boolean
  remaining: Record<Team, number>
}

export type SpymasterView =
  /** 还没入座：公共状态 + 哪队队长位空着 */
  | ({ kind: 'claim'; seatsFree: Record<Team, boolean> } & PublicView)
  /** 已入座：多一张完整键卡 —— 私有信息只有它，也只发给这台手机 */
  | ({ kind: 'spy'; team: Team; key: CellKind[] } & PublicView)
