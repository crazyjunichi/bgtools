import {
  DealFault,
  type DealBackend,
  type DealPool,
  type DealSnapshot,
  type DealTarget,
} from './backend'
import { newGameId, newRid } from './ids'
import { isInstance, isRegion } from './payload'

/**
 * Firebase Realtime Database 的 REST 实现 —— 只有 `PUT` 与 `GET` 两种请求，
 * 不引入 Firebase SDK（省掉几十 KB，也省掉 API Key：REST 只需要数据库地址）。
 *
 * 组织者要发布的规则见 [docs/DEAL-ONLINE.md](../../../../docs/DEAL-ONLINE.md)。要点：
 * 排队记录只能新建不能改、值只能是服务端时间、`pool` 写一次即锁死。
 * 因此**规则拒绝时返回的是 401，不是 403**，下面的映射依赖这一点。
 */
const ROOT = 'bgtools/deal'

/** 服务端时间哨兵。客户端写死数字/字符串一律被 `.validate` 拒掉 */
const SERVER_TIME = { '.sv': 'timestamp' }

export function createFirebaseBackend(target: DealTarget): DealBackend {
  const base = `${databaseUrlOf(target)}/${ROOT}`

  const read = async (gameId: string): Promise<DealSnapshot> => {
    const body = await request<{ claims?: Record<string, number>; pool?: DealPool } | null>(
      'GET',
      `${base}/${gameId}.json`,
      undefined,
      'config',
    )
    return { claims: body?.claims ?? {}, pool: body?.pool }
  }

  return {
    async createGame(gameId, pool) {
      /*
       * gameId 是否干净**只能靠读判**，不能靠写失败来发现：`pool` 的"不存在才能写"
       * 看的是 pool 节点自己，实测 claims 里已经有人写过时 pool 照样写得进去 ——
       * 那样组织者会举着一个前几张牌已被领掉的牌局。撞车概率极小，但代价是发错牌。
       * 这一步顺带也验证了地址与读规则可用。
       */
      const existing = await read(gameId)
      if (Object.keys(existing.claims).length > 0 || existing.pool) {
        throw new DealFault('taken')
      }
      // 没有内容池时组织者一个字都不用写：排队记录是玩家各自建的
      if (pool && Object.keys(pool).length > 0) {
        await request('PUT', `${base}/${gameId}/pool.json?print=silent`, pool, 'taken')
      }
    },

    async claim(gameId, rid) {
      // 401 在这里只可能是 rid 已存在或规则没发布，两者分不开 ——
      // 由 [claim.ts](claim.ts) 换个 rid 再试一次来区分
      await request(
        'PUT',
        `${base}/${gameId}/claims/${rid}.json?print=silent`,
        SERVER_TIME,
        'ridCollision',
      )
      return read(gameId)
    },

    read,

    async test() {
      const probe = newGameId()
      // 先读：地址通不通、读规则发布没有
      await read(probe)
      /*
       * 再写一条排队记录。**刻意留下这条垃圾数据**（几十字节，规则也不给删）——
       * 写规则没发布的话，第一个失败的会是现场某位玩家的手机，那时组织者已经
       * 把二维码举起来了。宁可在配置面板上就报出来。
       */
      await request(
        'PUT',
        `${base}/${probe}/claims/${newRid()}.json?print=silent`,
        SERVER_TIME,
        'config',
      )
    },
  }
}

/**
 * 组织者粘贴的数据库 URL → 地址三元组。**让他粘完整 URL 而不是从下拉里挑 region**：
 * region 在 Firebase 控制台是拼在域名里的，照抄一整条比让他辨认自己选了哪个可靠。
 */
export function parseDatabaseUrl(input: string): DealTarget {
  const raw = input.trim()
  let host: string
  try {
    host = new URL(raw.includes('://') ? raw : `https://${raw}`).hostname.toLowerCase()
  } catch {
    throw new DealFault('config')
  }
  const modern = /^([a-z0-9-]+)\.([a-z0-9-]+)\.firebasedatabase\.app$/.exec(host)
  if (modern) return { kind: 'firebase', instance: modern[1], region: modern[2] }
  // 老项目的默认库仍是这个域名，它没有 region 段
  const legacy = /^([a-z0-9-]+)\.firebaseio\.com$/.exec(host)
  if (legacy) return { kind: 'firebase', instance: legacy[1], region: '' }
  throw new DealFault('config')
}

export function databaseUrlOf(target: DealTarget): string {
  if (!isInstance(target.instance) || !isRegion(target.region)) throw new DealFault('config')
  return target.region
    ? `https://${target.instance}.${target.region}.firebasedatabase.app`
    : `https://${target.instance}.firebaseio.com`
}

/**
 * `rejectCode` 是这次请求被规则拒掉时该报的 code —— 同一个 401 在不同调用点
 * 含义不同（占用 / rid 撞了 / 规则没发布）。**原始异常一律不往上抛**。
 */
async function request<T>(
  method: 'GET' | 'PUT',
  url: string,
  body: unknown,
  rejectCode: 'config' | 'taken' | 'ridCollision',
): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
      // 不带 credentials：REST 端点靠规则放行，带上 cookie 只会多一轮 preflight
      cache: 'no-store',
    })
  } catch {
    throw new DealFault('offline')
  }
  if (res.status === 401) throw new DealFault(rejectCode)
  if (!res.ok) throw new DealFault('config')
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}
