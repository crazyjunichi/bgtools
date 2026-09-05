import type { ResultMode } from '../games/types'
import type { PlayerColor } from '../players/colors'

export type Outcome = 'win' | 'loss' | 'draw'

/**
 * 一局里的一个参与者。**扁平结构、不按 mode 分叉**：
 * 统计全是 `players` 上的 groupBy，做成判别联合会让每一项聚合都得先按 kind 拆。
 * 合作局就是所有人 `outcome` 相同，阵营局就是同 `teamId` 的人 outcome 相同。
 */
export type MatchPlayer = {
  /** 名单里的那个人；`null` = 临时席位。**临时席位不进个人统计**（它不代表一个稳定的人） */
  playerId: string | null
  /**
   * 名字与颜色的快照。名单是真源，但历史局必须能在那个人被删掉之后照旧显示 ——
   * 同 [Seat](../players/seats.ts) 的取舍
   */
  name: string
  color: PlayerColor
  score?: number
  /** 1 起，并列同名次 */
  rank?: number
  outcome?: Outcome
  teamId?: string
}

/**
 * 归档的一局 —— **跨工具唯一的对局契约**。统计、玩家战绩、分享都只读它，
 * 不许去反解某个工具的私有存档。
 *
 * 谁参与了这一局**只属于这一局**：每个工具页开的是它自己的局，与别的工具、
 * 别的实例无关。所以这里没有「当前局」的位置，进行中的状态在各工具自己的 store 里。
 */
export type Match = {
  /** IDB 主键 */
  id: string
  /** 记录写入时刻。只作 IDB 索引与写入序，**不参与时长计算** */
  at: number
  startedAt: number
  /**
   * 这一局最后一次实质操作的时刻（最后一次填分/加分），**不是按下结算的时刻**。
   * 页面开着切后台、隔一天再回来开新局是常态，那时 `Date.now()` 与真正结束差着十几小时。
   * 由各工具 store 里的 `lastActiveAt` 提供
   */
  endAt: number
  /** `null` = 未指定（通用计分随手开的一局，用户也没在结算面板里选） */
  gameId: string | null
  /** 哪个工具记的。同一盒游戏可能被不同工具记（计分纸 vs 专用工具） */
  toolId: string
  mode: ResultMode
  players: MatchPlayer[]
  /**
   * 用户自己填的一句话。**`Match` 上唯一允许事后修改的字段** ——
   * 结算那一刻常顾不上填，回看时才想补一句。其余字段一律只增删不改
   */
  note?: string
  /**
   * 工具私有详情，由那个工具自己反解（计分纸存的是它 persist 的那几个字段）。
   * **统计层不许读它** —— 一读就等于把工具内部形状变成了统计的输入
   */
  payload?: unknown
  /**
   * 旧存档读时适配出来的记录（计分纸 v1 的 `score-sheet-games`）。
   * 只进历史列表：它没有分数与胜负，进统计只会污染胜率。**不写盘**
   */
  legacy?: boolean
}

/**
 * 一局的内容，不含写入时刻 —— `archive` 的入参。
 * 带上 `id` 就是**覆盖那条已有记录**（同一局重复结算、结算面板里补备注），
 * 不带就是新记一条。工具 store 持久化本局的记录 id 来串起这条线
 */
export type MatchDraft = Omit<Match, 'id' | 'at' | 'legacy'> & { id?: string }
