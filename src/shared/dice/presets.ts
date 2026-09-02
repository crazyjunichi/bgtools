import { numericDie, type DiceSet } from './types'

/** 快艇的 5 颗骰是同一款：同一个 DieSpec 摆五次，勾选靠下标区分 */
const YAHTZEE_DIE = numericDie(6, 'amber')

/**
 * 各游戏的骰组。骰组要跟**实物盒里的骰子**一一对应 ——
 * 玩家勾的是「桌上这颗要不要掷」，不是「我想要几颗」。
 */
export const DICE_SETS: readonly DiceSet[] = [
  {
    id: 'yahtzee',
    nameKey: 'dice.sets.yahtzee',
    dice: Array.from({ length: 5 }, () => YAHTZEE_DIE),
  },
]

export function findDiceSet(id: string): DiceSet | undefined {
  return DICE_SETS.find((set) => set.id === id)
}
