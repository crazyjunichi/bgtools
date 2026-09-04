import { rollDie, shuffle } from '../../shared/random'
import { WORDS } from './words'

/** 队伍色就是实物游戏的红蓝，是内容不是语义色 */
export type Team = 'red' | 'blue'
export type CellKind = Team | 'neutral' | 'assassin'

/**
 * 一格的翻出标记：桌面端 by 是翻出方（谁点的），手机端没有同步通道、
 * by 退化为这张牌自己的归属色；turn 桌面端是该队回合号，手机端是点牌顺序。
 */
export type Mark = { by: CellKind; turn: number }

export const BOARD_SIZE = 25

export type Board = {
  words: string[]
  key: CellKind[]
  starting: Team
}

export function otherTeam(t: Team): Team {
  return t === 'red' ? 'blue' : 'red'
}

/**
 * 新牌面：25 词 + 键卡。先手队 9 词、后手 8、中立 7、刺客 1 —— 这是领域事实。
 * 洗牌走 crypto（shared/random），桌上对「为什么他先」的公平性质疑是真实存在的。
 */
export function newBoard(): Board {
  const starting: Team = rollDie(2) === 1 ? 'red' : 'blue'
  return {
    words: shuffle(WORDS).slice(0, BOARD_SIZE),
    key: shuffle<CellKind>([
      ...Array<CellKind>(9).fill(starting),
      ...Array<CellKind>(8).fill(otherTeam(starting)),
      ...Array<CellKind>(7).fill('neutral'),
      'assassin',
    ]),
    starting,
  }
}

export function remaining(key: CellKind[], revealed: boolean[], team: Team): number {
  let n = 0
  for (let i = 0; i < key.length; i++) {
    if (key[i] === team && !revealed[i]) n++
  }
  return n
}

export function total(key: CellKind[], team: Team): number {
  let n = 0
  for (const k of key) if (k === team) n++
  return n
}
