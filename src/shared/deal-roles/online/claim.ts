import {
  DealFault,
  faultCodeOf,
  type DealBackend,
  type DealPool,
  type DealSnapshot,
} from './backend'
import { newRid } from './ids'
import { ridFor, useDealJoinStore } from './joinStore'

/**
 * rid 撞车才重试，且只重一次。12 字符 base36 撞一次已经不现实，
 * 连撞两次基本只能是规则没发布 —— 那时再重试也没用，直接报配置问题。
 */
const ATTEMPTS = 2

export type ClaimResult = {
  rid: string
  /** 1 起的排队序号，就是"这是第几张牌" */
  rank: number
  total: number
  pool?: DealPool
}

/**
 * 领一张牌。**没有任何点击**：落地页一进来就调这个。
 *
 * 序号一旦定下就不会再变（后来的人时间戳更大，只会排在后面），所以玩家不必等
 * 所有人到齐 —— 这是"扫完直接看到身份"能成立的原因。
 */
export function claimCard(backend: DealBackend, gameId: string): Promise<ClaimResult> {
  /*
   * 同一局同时只跑一个领取流程。少了这道闸，两次并发都会看到"本机还没有 rid"
   * 而各写一条，凭空占掉一个牌位 —— React 严格模式的 effect 双跑、
   * 以及"我也领一张"被连点两下都会撞上。
   */
  const hit = inflight.get(gameId)
  if (hit) return hit
  const task = run(backend, gameId).finally(() => inflight.delete(gameId))
  inflight.set(gameId, task)
  return task
}

const inflight = new Map<string, Promise<ClaimResult>>()

async function run(backend: DealBackend, gameId: string): Promise<ClaimResult> {
  const known = ridFor(gameId)
  if (known) {
    const snap = await backend.read(gameId)
    // 本机记着但服务端查不到：组织者换了数据库，或这局的记录被清掉了。当没领过处理
    if (snap.claims[known] !== undefined) return resultOf(known, snap)
  }

  for (let i = 0; i < ATTEMPTS; i++) {
    const rid = newRid()
    try {
      const snap = await backend.claim(gameId, rid)
      useDealJoinStore.getState().remember(gameId, rid)
      return resultOf(rid, snap)
    } catch (e) {
      if (faultCodeOf(e) !== 'ridCollision') throw e
    }
  }
  throw new DealFault('config')
}

function resultOf(rid: string, snap: DealSnapshot): ClaimResult {
  return { rid, rank: rankOf(snap.claims, rid), total: Object.keys(snap.claims).length, pool: snap.pool }
}

/**
 * 排队序号。**必须按 `(时间戳, rid)` 双键**：实测同一局里最小间隔只有几毫秒，
 * 同毫秒虽罕见，但一旦发生而各设备排序不一致，就会有两个人拿到同一张牌。
 */
export function rankOf(claims: Record<string, number>, rid: string): number {
  const sorted = Object.keys(claims).sort((a, b) => claims[a] - claims[b] || (a < b ? -1 : 1))
  return sorted.indexOf(rid) + 1
}
