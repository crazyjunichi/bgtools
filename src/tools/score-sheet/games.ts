import { create } from 'zustand'
import { idbClear, idbDelete, idbGetAll, idbPut } from '../../shared/idb'
import type { Seat } from '../../shared/players/seats'
import type { Scoring } from './templates'
// 只取类型：`import type` 会被 TS 完全擦除，所以 store.ts ↔ 这里的互相引用
// 不构成运行时循环（那边是值依赖 useGamesStore，这边只是类型）
import type { CustomEntry } from './store'

const STORE = 'score-sheet-games'

/**
 * 归档的一局。**存的就是 [store](store.ts) 里 `partialize` 那五个字段的整份副本**，
 * 而不是「算好的分数 + 条目名快照」：
 *
 * 回看时把这五个字段直接喂给现成的 `entriesOf` / `scoreOf` / `totalOf` 复算，
 * 显示逻辑与当前局**完全同一份**；「读取这一局」也就是原样 set 回去，不需要反解。
 * 代价是以后改模板常量会连带改变历史局的显示 —— 这与 `overrides` 只存差量是同一个取舍
 * （修模板要能对老数据生效）。真正属于「那一晚」的东西（谁、什么色、填了几个）都在 seats/cells 里，
 * 不会被后来的改动动到。
 */
export type SheetGame = {
  /** IDB 主键 */
  id: string
  /** 归档时刻。列表按它倒序 */
  at: number
  /** 开局时刻。本字段之前的存档没有它，消费方回落到 `at` */
  startedAt?: number
  templateId: string
  customEntries: CustomEntry[]
  overrides: Record<string, Scoring>
  seats: Seat[]
  cells: Record<string, number>
}

/** 一局的内容，不含身份与时间 —— `archive` 的入参 */
export type GameDraft = Omit<SheetGame, 'id' | 'at'>

type GamesState = {
  /** IDB 的内存镜像，**已按 at 倒序**。UI 只读这个，不直接碰 IDB */
  games: SheetGame[]
  /** unavailable = 这台设备禁了 IndexedDB（隐私模式等），历史功能整块关掉，其余照用 */
  status: 'idle' | 'loading' | 'ready' | 'unavailable'
  /** 幂等惰性加载：只在打开历史浮层时调，工具页启动不读盘 */
  load: () => Promise<void>
  archive: (draft: GameDraft) => Promise<void>
  remove: (id: string) => Promise<void>
  clear: () => Promise<void>
}

const byNewest = (a: SheetGame, b: SheetGame) => b.at - a.at

/**
 * 存档一律 fire-and-forget，失败只落 console：桌上按「新一局」不能因为写盘失败卡住，
 * 也不该弹一个玩家看不懂的错误框。
 */
function warn(e: unknown) {
  console.warn('[score-sheet] archive failed', e)
}

export const useGamesStore = create<GamesState>()((set, get) => ({
  games: [],
  status: 'idle',

  load: async () => {
    // ready 之后不再读盘：写入都同步更新了内存镜像，两边不会脱节
    if (get().status !== 'idle') return
    set({ status: 'loading' })
    try {
      const games = await idbGetAll<SheetGame>(STORE)
      set({ games: games.sort(byNewest), status: 'ready' })
    } catch (e) {
      warn(e)
      set({ status: 'unavailable' })
    }
  },

  archive: async (draft) => {
    const game: SheetGame = { ...draft, id: crypto.randomUUID(), at: Date.now() }
    try {
      await idbPut(STORE, game)
    } catch (e) {
      warn(e)
      set({ status: 'unavailable' })
      return
    }
    /*
     * 只在已经读过盘的情况下并进镜像。status 还是 idle 时不动 games ——
     * 否则镜像里只有这一条，之后 load 又会因为 status 变了而跳过读盘，历史就只剩最后一局。
     */
    if (get().status === 'ready') set({ games: [game, ...get().games] })
  },

  remove: async (id) => {
    try {
      await idbDelete(STORE, id)
      set({ games: get().games.filter((g) => g.id !== id) })
    } catch (e) {
      warn(e)
    }
  },

  clear: async () => {
    try {
      await idbClear(STORE)
      set({ games: [] })
    } catch (e) {
      warn(e)
    }
  },
}))
