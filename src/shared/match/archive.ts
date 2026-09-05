import { create } from 'zustand'
import { findGame } from '../games/registry'
import { idbClear, idbDelete, idbGetAll, idbPut } from '../idb'
import type { Seat } from '../players/seats'
import { seatsToPlayers } from './result'
import type { Match, MatchDraft } from './types'

const STORE = 'matches'

/**
 * 计分纸 v1 存档表。**不迁移、只读时适配**（用户已定）：那份数据没有分数与胜负字段，
 * 硬算一遍等于替用户编造名次，所以它只进历史列表、不进统计。
 *
 * 这里只声明**适配用得到的那几个字段**，而不 import 计分纸自己的
 * [SheetPayload](../../tools/score-sheet/payload.ts)：shared 不许反向依赖工具目录，
 * 何况整条记录会原样进 `payload`，那边自己反解。
 */
const LEGACY_STORE = 'score-sheet-games'
type LegacyRow = {
  id: string
  at: number
  startedAt?: number
  templateId: string
  seats: Seat[]
}

type ArchiveState = {
  /** IDB 的内存镜像，**已按 endAt 倒序**。UI 只读这个，不直接碰 IDB */
  matches: Match[]
  /** unavailable = 这台设备禁了 IndexedDB（隐私模式等），存档功能整块关掉，其余照用 */
  status: 'idle' | 'loading' | 'ready' | 'unavailable'
  /** 幂等惰性加载：只在真要看历史/统计时调，工具页启动不读盘 */
  load: () => Promise<void>
  /** 落盘成功回记录 id（重复结算靠它覆盖同一条），IDB 写不进回 null */
  archive: (draft: MatchDraft) => Promise<string | null>
  /** 备注是唯一能事后改的字段，见 [Match.note](types.ts) */
  setNote: (id: string, note: string) => Promise<void>
  remove: (id: string) => Promise<void>
  /**
   * 清空。**给了 toolId 就只清那个工具的记录** —— 单表混着所有工具的局，
   * 计分纸历史里的「清空历史」不该顺手删掉多轮计分的
   */
  clear: (toolId?: string) => Promise<void>
}

/** 列表按「这局什么时候结束」排，而不是按写入时刻 —— 后者只是 IDB 索引 */
const byNewest = (a: Match, b: Match) => b.endAt - a.endAt

/**
 * 存档一律 fire-and-forget，失败只落 console：桌上按「新一局」不能因为写盘失败卡住，
 * 也不该弹一个玩家看不懂的错误框。
 */
function warn(e: unknown) {
  console.warn('[match] archive failed', e)
}

/** 旧局没有 endAt / startedAt，两个都回落到写入时刻（时长因此是 0，UI 里不显示） */
function fromLegacy(row: LegacyRow): Match {
  return {
    id: row.id,
    at: row.at,
    startedAt: row.startedAt ?? row.at,
    endAt: row.at,
    // 模板 id 与游戏 id 同名（通用空白除外，它不是一盒游戏）
    gameId: findGame(row.templateId) ? row.templateId : null,
    toolId: 'score-sheet',
    mode: 'ranked',
    // 只有身份快照：那时没记分数，补一个算出来的名次就是编造历史
    players: seatsToPlayers(row.seats ?? []),
    payload: row,
    legacy: true,
  }
}

export const useArchiveStore = create<ArchiveState>()((set, get) => ({
  matches: [],
  status: 'idle',

  load: async () => {
    // ready 之后不再读盘：写入都同步更新了内存镜像，两边不会脱节
    if (get().status !== 'idle') return
    set({ status: 'loading' })
    try {
      const rows = await idbGetAll<Match>(STORE)
      /*
       * 旧表读失败不算整体失败：它可能压根不存在（新用户），
       * 而新表已经读到了，历史照样能用
       */
      let legacy: Match[] = []
      try {
        legacy = (await idbGetAll<LegacyRow>(LEGACY_STORE)).map(fromLegacy)
      } catch (e) {
        warn(e)
      }
      set({ matches: [...rows, ...legacy].sort(byNewest), status: 'ready' })
    } catch (e) {
      warn(e)
      set({ status: 'unavailable' })
    }
  },

  archive: async (draft) => {
    const match: Match = { ...draft, id: draft.id ?? crypto.randomUUID(), at: Date.now() }
    try {
      await idbPut(STORE, match)
    } catch (e) {
      warn(e)
      set({ status: 'unavailable' })
      return null
    }
    /*
     * 只在已经读过盘的情况下并进镜像。status 还是 idle 时不动 matches ——
     * 否则镜像里只有这一条，之后 load 又会因为 status 变了而跳过读盘，历史就只剩最后一局。
     * 先按 id 滤掉旧条目再进列表：draft 带 id 是覆盖写，同一局不许出现两条
     */
    if (get().status === 'ready') {
      set({ matches: [match, ...get().matches.filter((m) => m.id !== match.id)].sort(byNewest) })
    }
    return match.id
  },

  setNote: async (id, note) => {
    const cur = get().matches.find((m) => m.id === id)
    // 旧局在旧表里，这里的 put 会把它写进新表变成两条 —— 所以 UI 层不给它备注入口
    if (!cur || cur.legacy) return
    const next: Match = { ...cur, note: note === '' ? undefined : note }
    try {
      await idbPut(STORE, next)
      set({ matches: get().matches.map((m) => (m.id === id ? next : m)) })
    } catch (e) {
      warn(e)
    }
  },

  remove: async (id) => {
    const cur = get().matches.find((m) => m.id === id)
    try {
      await idbDelete(cur?.legacy ? LEGACY_STORE : STORE, id)
      set({ matches: get().matches.filter((m) => m.id !== id) })
    } catch (e) {
      warn(e)
    }
  },

  clear: async (toolId) => {
    const all = get().matches
    try {
      if (toolId === undefined) {
        await idbClear(STORE)
        await idbClear(LEGACY_STORE)
        set({ matches: [] })
        return
      }
      const gone = all.filter((m) => m.toolId === toolId)
      await Promise.all(gone.map((m) => idbDelete(m.legacy ? LEGACY_STORE : STORE, m.id)))
      const ids = new Set(gone.map((m) => m.id))
      set({ matches: all.filter((m) => !ids.has(m.id)) })
    } catch (e) {
      warn(e)
    }
  },
}))
