import { shuffle } from '../random'
import { seededShuffle } from './online/seeded'
import type { RoleCounts, RolePreset, RoleSet } from './types'

/**
 * 生效的配比：存过的优先，**逐项**按 `set.roles` 取，没有的补 0。
 *
 * 逐项而不是「整份缺就整份用默认」有两个理由：给身份集加一个新身份时不会让
 * 已经配好的其余几项一起失效；存档里留下的已删身份 id 也会在这里被丢掉。
 */
export function countsOf(set: RoleSet, saved: RoleCounts | undefined): RoleCounts {
  const out: RoleCounts = {}
  const fallback = saved ? undefined : presetOf(set, set.defaultN)?.counts
  for (const r of set.roles) out[r.id] = saved?.[r.id] ?? fallback?.[r.id] ?? 0
  return out
}

export function presetOf(set: RoleSet, n: number) {
  return set.presets.find((p) => p.n === n)
}

export function totalOf(counts: RoleCounts): number {
  return Object.values(counts).reduce((a, b) => a + b, 0)
}

/** 当前配比是不是正好等于某一档预置（用来点亮那个按钮） */
export function matchesPreset(set: RoleSet, counts: RoleCounts, preset: RolePreset): boolean {
  return set.roles.every((r) => (counts[r.id] ?? 0) === (preset.counts[r.id] ?? 0))
}

/**
 * 洗好的一副牌：按张数展开成 roleId 序列再洗。
 * 走 [shuffle](../random.ts) 而非 Math.random —— 发身份的公平性是桌上会当场质疑的点。
 */
export function buildDeck(set: RoleSet, counts: RoleCounts): string[] {
  const deck: string[] = []
  for (const r of set.roles) {
    for (let i = 0; i < (counts[r.id] ?? 0); i++) deck.push(r.id)
  }
  return shuffle(deck)
}

/**
 * 扫码发牌用的可复现牌堆：各玩家的手机彼此不通信，只能各自算出同一副牌再按序号取。
 *
 * **展开顺序按 roleId 字典序，而不是 `set.roles` 的数组顺序**，也因此不收 `set` ——
 * 那个数组一改动（加一个身份、调一下顺序），版本不同的两台设备就会算出不同的牌堆，
 * 可能有两个人拿到同一张。字典序只依赖 id 本身，跨版本稳定。
 */
export function buildDeckSeeded(counts: RoleCounts, seed: string): string[] {
  const deck: string[] = []
  for (const id of Object.keys(counts).sort()) {
    for (let i = 0; i < (counts[id] ?? 0); i++) deck.push(id)
  }
  return seededShuffle(deck, seed)
}
