/**
 * 发牌后端的唯一契约。上层（二维码页、玩家落地页）只认这个接口，
 * 换后端不动任何 UI —— Firebase 与 CloudBase 的差异全被关在各自的实现文件里。
 *
 * 数据库里只有两样东西，都不含"谁是什么"：
 *
 * ```
 * bgtools/deal/{gameId}/
 *   claims/{rid} = <服务端毫秒>   ← 玩家各写一条，只用来排队
 *   pool/{key}   = <内容字符串>   ← 组织者开局前写一次，只有内容型游戏才有
 * ```
 *
 * 牌堆配方（配比 + 种子）走二维码，不进数据库：这样只拿到数据库地址的人
 * 看到的是一堆时间戳，要对上"谁是什么"必须有二维码，也就是必须在场。
 */
export type DealBackendKind = 'firebase' | 'cloudbase'

/**
 * 后端地址。**只有这三个字段进二维码**，所以任何后端都得把地址压进这个形状 ——
 * Firebase 是"实例名 + region"，CloudBase 是"环境 id + 服务域名段"。
 *
 * 它只存在组织者的浏览器本地（[store.ts](store.ts)）和二维码的 fragment 里，
 * 不进仓库、不进构建产物：这是"部署者自己准备后端"的前提。
 */
export type DealTarget = {
  kind: DealBackendKind
  instance: string
  /** Firebase 老式 `firebaseio.com` 域名没有这一段，此时为空串 */
  region: string
}

export type DealBackend = {
  /**
   * 开局。**必须在显示二维码之前调用并确认成功** —— `pool` 的写权限是
   * "不存在才能写"，谁抢先写入就锁死了。失败就换一个 gameId 重来
   * （这一步顺带覆盖了 gameId 碰撞）。
   */
  createGame(gameId: string, pool?: DealPool): Promise<void>
  /**
   * 领一条排队记录，返回这一局当前的全部记录。
   * 值只能是服务端时间：客户端写死数字/字符串一律被规则拒掉。
   */
  claim(gameId: string, rid: string): Promise<DealSnapshot>
  /** 只读快照，给二维码页轮询"已领 X 人"、给重扫的玩家复查自己的序号 */
  read(gameId: string): Promise<DealSnapshot>
  /** 连接测试。配置面板上那个按钮，只验证地址与规则是否可用，不留下数据 */
  test(): Promise<void>
}

/** key 的语义由 `setId` 决定（每身份一个内容 / 每张牌一个内容），后端只管长度 */
export type DealPool = Record<string, string>

export type DealSnapshot = {
  /** rid -> 服务端毫秒 */
  claims: Record<string, number>
  pool?: DealPool
}

export type DealErrorCode =
  /** 网络不通：断网、地址拼错到不存在的域名 */
  | 'offline'
  /** 地址能通但被拒：规则没发布、实例名或 region 填错 */
  | 'config'
  /** gameId 已被占用（或 pool 已被抢先写入），换一个重来 */
  | 'taken'
  /** rid 撞了别人已写过的（12 字符 base36 下不现实，但要有分支） */
  | 'ridCollision'
  /** 二维码链接残缺或参数不合法 */
  | 'badLink'
  /** 二维码的协议版本与本机不匹配，双方需要更新 */
  | 'version'
  /** 这个后端还没实现 */
  | 'unsupported'

/**
 * 发牌流程的唯一错误类型。**原始异常不往上抛** —— 界面上不该出现异常堆栈，
 * 每个 code 对应一句人话（`dealRoles.online.err.*`）。
 */
export class DealFault extends Error {
  readonly code: DealErrorCode

  constructor(code: DealErrorCode) {
    super(code)
    this.name = 'DealFault'
    this.code = code
  }
}

export function faultCodeOf(e: unknown): DealErrorCode {
  return e instanceof DealFault ? e.code : 'offline'
}
