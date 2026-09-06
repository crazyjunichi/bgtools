import type { RoleCounts } from '../types'
import { DealFault, type DealBackendKind, type DealTarget } from './backend'
import { isId } from './ids'

/**
 * 二维码里带的全部信息。**牌堆配方在这里，不在数据库里** ——
 * 配比 + 种子就能算出整副牌，所以扫到码等于在场，没扫到码的人拿到数据库地址也白看。
 *
 * 长度与游戏内容无关（全是短 ASCII 标识符与 base36），二维码密度不会随人数涨。
 */
export type DealPayload = {
  target: DealTarget
  gameId: string
  /** 身份集 id，玩家侧靠它在 [registry.ts](../registry.ts) 里找回身份的名字与图标 */
  setId: string
  counts: RoleCounts
  seed: string
  /** 盲发局（见 [RoleSet.blind](../types.ts)）。玩家的牌面渲染必须跟组织者一致，所以进码 */
  blind?: boolean
}

/**
 * 协议版本。**任何影响解码或牌堆推算的改动都要 +1** ——
 * 两台设备版本不一致会算出不同的牌堆（可能两人拿到同一张），宁可提示双方更新。
 * v2：加 `h`（盲发）。它不改牌堆，但旧端不认它会亮出身份、直接拆穿这个变体。
 */
export const PAYLOAD_VERSION = 2

const KIND_ABBR: Record<DealBackendKind, string> = {
  firebase: 'f',
  cloudbase: 'c',
}

/** 常见 region 走缩写省二维码密度，没收录的原样存全名 —— 新 region 上线也不会解码失败 */
const REGION_ABBR: Record<string, string> = {
  'us-central1': 'u1',
  'europe-west1': 'e1',
  'asia-southeast1': 'a1',
}

/**
 * 拼成玩家扫码后打开的完整 URL。
 *
 * **参数刻意不做 percent-encode**：`:` 与 `,` 在 query 里本就合法，转义一个字符变三个，
 * 二维码密度白涨一档。各字段的字符集是受控的（base36 id、kebab 标识符、
 * 解析时已校验过的实例名），不会出现需要转义的字符。
 */
export function encodePayload(base: string, p: DealPayload): string {
  const counts = countsToParam(p.counts)
  const q = [
    `v=${PAYLOAD_VERSION}`,
    `b=${KIND_ABBR[p.target.kind]}`,
    `i=${p.target.instance}`,
    `r=${REGION_ABBR[p.target.region] ?? p.target.region}`,
    `g=${p.gameId}`,
    `s=${p.setId}`,
    `c=${counts}`,
    `k=${p.seed}`,
  ]
  // 只在盲发局带上：常规局少一个参数，二维码密度能低一点是一点
  if (p.blind) q.push('h=1')
  return `${base}#/join?${q.join('&')}`
}

/** 解不出来一律抛 `DealFault`，界面上只出一句人话 */
export function decodePayload(query: string): DealPayload {
  const q = new URLSearchParams(query)
  const v = q.get('v')
  // 没有 v 说明根本不是这个协议的链接（截断、被聊天软件改写），有 v 但不对才是版本问题
  if (v === null) throw new DealFault('badLink')
  if (v !== String(PAYLOAD_VERSION)) throw new DealFault('version')

  const kind = kindOf(q.get('b'))
  const instance = q.get('i') ?? ''
  const gameId = q.get('g') ?? ''
  const setId = q.get('s') ?? ''
  const seed = q.get('k') ?? ''
  if (!isInstance(instance) || !isId(gameId) || !setId || !seed) throw new DealFault('badLink')

  const region = expandRegion(q.get('r') ?? '')
  if (!isRegion(region)) throw new DealFault('badLink')

  const counts = countsFromParam(q.get('c') ?? '')
  return { target: { kind, instance, region }, gameId, setId, counts, seed, blind: q.get('h') === '1' }
}

/** 跳过 0 张的身份，并按 roleId 字典序输出 —— 同一个配比每次都得到同一串，便于人工核对 */
function countsToParam(counts: RoleCounts): string {
  return Object.keys(counts)
    .sort()
    .filter((id) => (counts[id] ?? 0) > 0)
    .map((id) => `${id}:${counts[id]}`)
    .join(',')
}

function countsFromParam(param: string): RoleCounts {
  const counts: RoleCounts = {}
  for (const item of param.split(',')) {
    const [id, n] = item.split(':')
    const v = Number(n)
    if (!id || !Number.isInteger(v) || v <= 0) throw new DealFault('badLink')
    counts[id] = v
  }
  if (Object.keys(counts).length === 0) throw new DealFault('badLink')
  return counts
}

function kindOf(abbr: string | null): DealBackendKind {
  const hit = (Object.keys(KIND_ABBR) as DealBackendKind[]).find((k) => KIND_ABBR[k] === abbr)
  if (!hit) throw new DealFault('badLink')
  return hit
}

function expandRegion(abbr: string): string {
  const hit = Object.keys(REGION_ABBR).find((r) => REGION_ABBR[r] === abbr)
  return hit ?? abbr
}

/** 实例名会被直接拼进请求 URL 的 host，字符集必须卡死 */
export function isInstance(s: string): boolean {
  return /^[a-z0-9-]{1,64}$/.test(s)
}

/** region 同 instance：进 host 的部分一律先卡形态。空串是合法的（老式域名没有这一段） */
export function isRegion(s: string): boolean {
  return s === '' || /^[a-z0-9-]{1,32}$/.test(s)
}
