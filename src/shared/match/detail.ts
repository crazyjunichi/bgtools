import type { TFunction } from 'i18next'
import type { I18nKey } from '../i18n/types'
import type { LucideIcon } from '../icons'
import type { SharePalette } from './share/paint'
import type { MatchDraft } from './types'

/**
 * 「回看一局 / 把一局导出去」的跨层契约。
 *
 * 分享面板在 shared，而**怎么把一条 `payload` 画成明细**只有拥有它的工具知道 ——
 * 所以形状定在这里，实现由各工具注册（映射表在 [tools/registry](../../tools/registry.ts)，
 * shared 不许反向依赖 tools）。通用战绩榜与文本摘要不在这里，分享面板自带。
 */

/**
 * 一条 Match 的一种导出形态。`id` 也进文件名，用来区分同一局的多种导出。
 *
 * 入参是 `MatchDraft` 而不是 `Match`：**归档前的当前局也要能导**，
 * 而真正的 `Match` 结构上满足它，两条路径共用一份代码。
 *
 * `build` 里反解不出 `payload`（别的版本写下的东西）就抛 —— 面板会显示一句「这局出不了」，
 * 通用战绩榜仍然出得来。
 */
export type MatchExport = {
  id: string
  nameKey: I18nKey
  icon: LucideIcon
  /** 落盘时的扩展名。只有 `png` 会在面板里预览，其余形态给一块占位 */
  ext: string
  build: (m: MatchDraft, p: SharePalette, t: TFunction) => Promise<Blob>
}
