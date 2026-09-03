import { buildDeckSeeded } from '../deck'
import type { Role, RoleCounts, RoleSet } from '../types'
import { DealFault, type DealPool } from './backend'

export type PickedCard = {
  role: Role
  content?: string
}

/**
 * 排队序号 → 那张牌。各设备各自算，算出来必须一致 ——
 * 靠的是 [buildDeckSeeded](../deck.ts) 的字典序展开 + 同一个种子。
 *
 * 返回 `null` 表示牌已经发完了（领的人比牌多）。
 */
export function pickCard(
  set: RoleSet,
  counts: RoleCounts,
  seed: string,
  rank: number,
  pool?: DealPool,
): PickedCard | null {
  const roleId = buildDeckSeeded(counts, seed)[rank - 1]
  if (!roleId) return null

  const role = set.roles.find((r) => r.id === roleId)
  // 配比里有本机不认识的身份 —— 只可能是两边版本不一致，不能糊成"发完了"
  if (!role) throw new DealFault('version')

  // 内容池的 key 两种形态都支持：每身份一个内容（roleId）/ 每张牌一个内容（牌序）
  return { role, content: pool?.[roleId] ?? pool?.[String(rank - 1)] }
}
