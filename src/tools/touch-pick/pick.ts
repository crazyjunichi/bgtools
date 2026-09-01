import { rollDie, shuffle } from '../../shared/random'
import type { PickMode } from './store'

/**
 * 给每个触点算一个结果值。返回 Map 而不是数组：调用方是按 pointerId 找自己那一份。
 *
 * 值的语义随模式变 —— `one` 只有赢家一条（值恒为 1，落选的干脆不在表里）、
 * `order` 是 1..n 的名次、`group` 是 1..g 的组号。
 */
export function assign(
  mode: PickMode,
  ids: readonly number[],
  groups: number,
): Map<number, number> {
  if (mode === 'one') {
    return new Map([[ids[rollDie(ids.length) - 1], 1]])
  }

  const order = shuffle(ids)
  if (mode === 'order') {
    return new Map(order.map((id, i) => [id, i + 1]))
  }

  // 组数不能超过人数，否则会分出空组；洗牌后轮流发组，组大小天然相差 ≤1
  const g = Math.min(groups, order.length)
  return new Map(order.map((id, i) => [id, (i % g) + 1]))
}
