import type { JsonValue } from '@trystero-p2p/mqtt'

/**
 * 联机会话的消息信封。会话层只搬运，不解释 `data` / `view` —— 那是各游戏的私有协议。
 * 约束到 JsonValue：传输层只保证 JSON 形状，游戏侧拿到的要当外部输入校验。
 */

/** 上行：玩家手机 → 主机 */
export type UpMsg = {
  /** 玩家 id：本机生成、按房间持久化，刷新/重连后凭它认回座位。peerId 每次连接都变，rid 不变 */
  rid: string
  /** 动作序号，主机按 rid 幂等去重（断线重发是常态） */
  seq: number
  /** true = 握手（主机据此重置该 rid 的 seq 水位并回推当前视图）；false = 游戏动作 */
  hello: boolean
  data: JsonValue
}

/** 下行：主机 → 玩家手机。view 已按「这台手机该看见什么」裁剪好 */
export type DownMsg =
  | { ok: true; view: JsonValue }
  /** 主机不接待（座位已满等），给一句人话收场 */
  | { ok: false }
