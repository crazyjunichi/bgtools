import { DealFault, type DealBackend, type DealTarget } from './backend'

/**
 * 腾讯 CloudBase 后端 —— **本期只留桩**。上层遇到 `unsupported` 就提示"这个后端还没接"，
 * 其余流程一个字不用改。
 *
 * ## 为什么必须是云函数，而不是直连数据库
 *
 * 排队协议依赖两件 CloudBase Web SDK 给不了的东西：**服务端时间戳**（没有 `serverDate`）
 * 和**客户端指定主键 + 只能新建不能改**（`add()` 不接受自定义 `_id`）。所以这一端要靠
 * 一个云函数把这两件事关在服务端做，Web 侧只是一次 HTTP 调用。
 *
 * ## 函数契约（部署好函数后照此实现下面的三个方法即可）
 *
 * 入口：`POST https://{instance}.{region}/{FN_PATH}`，`instance` = 环境 id，
 * `region` = 服务域名段（形状同 Firebase 的 instance + region，见 `DealTarget`）。
 *
 * 请求体（三种操作共用一个函数，靠 `op` 分派）：
 *
 * ```
 * { op: 'create', gameId, pool? }   → { ok: true } | { ok: false, code: 'taken' }
 * { op: 'claim',  gameId, rid }     → { claims: { [rid]: number }, pool?: {...} }
 * { op: 'read',   gameId }          → { claims: { [rid]: number }, pool?: {...} }
 * ```
 *
 * 函数侧的硬要求：
 *
 * - **时间取函数内的 `Date.now()`，绝不接受入参里的时间** —— 时间戳就是排队序号，
 *   客户端能塞时间就能把自己排到第一位
 * - `claim` 对已存在的 `rid` **返回原值、不报错**（重扫要看到同一张牌）
 * - `create` 在 `gameId` 已有任何记录时返回 `taken`，不覆盖
 * - `gameId` / `rid` 只接受 12 字符 base36，`pool` 的 key 与值都要卡长度上限
 * - 不提供删除操作（免得有人删掉别人这一局的记录）
 *
 * 返回的 `claims` 排序由调用方做（按 `(时间戳, rid)` 双键），函数不必排。
 */
export function createCloudbaseBackend(_target: DealTarget): DealBackend {
  const stub = () => Promise.reject(new DealFault('unsupported'))
  return {
    createGame: stub,
    claim: stub,
    read: stub,
    test: stub,
  }
}
