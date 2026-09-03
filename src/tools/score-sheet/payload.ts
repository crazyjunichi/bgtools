import type { Seat } from '../../shared/players/seats'
import type { Scoring } from './templates'
// 只取类型：`import type` 会被 TS 完全擦除，所以 store.ts ↔ 这里的互相引用
// 不构成运行时循环（那边是值依赖，这边只是类型）
import type { CustomEntry } from './store'

/**
 * 一局计分纸的完整局面，也就是写进 [Match.payload](../../shared/match/types.ts) 的东西。
 *
 * **存的是 [store](store.ts) 里那几个局面字段的整份副本**（`partialize` 是它的超集 ——
 * 导出图的排版偏好也 persist，但那是设备偏好、不属于任何一局），
 * 而不是「算好的分数 + 条目名快照」：回看时把它直接喂给现成的
 * `entriesOf` / `scoreOf` / `totalOf` 复算，显示逻辑与当前局**完全同一份**；
 * 「读取这一局」也就是原样 set 回去，不需要反解。
 *
 * 代价是以后改模板常量会连带改变历史局的显示 —— 这与 `overrides` 只存差量是同一个取舍
 * （修模板要能对老数据生效）。真正属于「那一晚」的东西（谁、什么色、填了几个）都在
 * seats/cells 里，不会被后来的改动动到。
 *
 * 归档记录里另有一份算好的分数与名次（[MatchPlayer](../../shared/match/types.ts)），
 * 那份是给统计聚合用的，与这里的原始局面互不替代。
 */
export type SheetPayload = {
  templateId: string
  customEntries: CustomEntry[]
  overrides: Record<string, Scoring>
  seats: Seat[]
  cells: Record<string, number>
  /** 开局时刻。计分纸 v1 的旧存档没有它，消费方回落到那条记录的结束时刻 */
  startedAt?: number
}

/**
 * 从 `Match.payload` 反解。**这是个外部边界**（IDB 里可能躺着任意老版本写下的东西，
 * 也可能是别的工具的 payload），所以形状要校验而不是硬转。
 *
 * 计分纸 v1 的旧表记录整条进了 payload，多出来的 `id` / `at` 在这里被忽略掉。
 */
export function readSheetPayload(payload: unknown): SheetPayload | null {
  if (payload === null || typeof payload !== 'object') return null
  const p = payload as Partial<SheetPayload>
  if (typeof p.templateId !== 'string' || !Array.isArray(p.seats)) return null
  return {
    templateId: p.templateId,
    customEntries: p.customEntries ?? [],
    overrides: p.overrides ?? {},
    seats: p.seats,
    cells: p.cells ?? {},
    startedAt: p.startedAt,
  }
}
