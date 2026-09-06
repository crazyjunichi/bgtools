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

  /*
   * namesFromPool 的集（自定义发身份）身份名不在 roles 里：文本是组织者开局时写进
   * 内容池的，按 roleId 现场构造。池里也没有 = 数据对不上，同下方的版本不一致处理。
   */
  const role = set.roles.find((r) => r.id === roleId) ?? roleFromPool(set, roleId, pool)
  // 配比里有本机不认识的身份 —— 只可能是两边版本不一致，不能糊成"发完了"
  if (!role) throw new DealFault('version')

  // 内容池的 key 两种形态都支持：每身份一个内容（roleId）/ 每张牌一个内容（牌序）
  return { role, content: pool?.[roleId] ?? pool?.[String(rank - 1)] }
}

function roleFromPool(set: RoleSet, roleId: string, pool?: DealPool): Role | undefined {
  if (!set.namesFromPool) return undefined
  const name = pool?.[roleId]?.trim()
  return name ? { id: roleId, name } : undefined
}
