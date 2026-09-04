import type { MatchTool } from '../../shared/match/detail'
import { ThroneDetail } from './ThroneDetail'

/**
 * 回看形态只有细则视图：终局血线/状态本身就是最完整的明细。
 * 不另做导出形态 —— 分享面板自带的战绩榜与文本摘要已够（战绩就是一胜一负）
 */
export const matchTool: MatchTool = { Detail: ThroneDetail, exports: [] }
