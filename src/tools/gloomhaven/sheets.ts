import { create } from 'zustand'
import { idbDelete, idbGetAll, idbPut } from '../../shared/idb'
import { findClass, levelOf } from './classes'

const STORE = 'gloomhaven-sheets'

export type GhItem = {
  id: string
  /** 物品编号或名称，自由文本（物品牌内容太多，不进工具数据） */
  text: string
  equipped: boolean
}

/**
 * 一张角色纸。**跨局持久**的战役数据全在这里；局内的血/本场经验/状态
 * 在 [store.ts](store.ts) 的 persist 里，两边不混。
 */
export type GhSheet = {
  id: string
  /** 写入时刻，IDB 的 at 索引要求每条都有 */
  at: number
  name: string
  /** 六初始职业 id，或 'custom'（解锁职业/房规，血上限手动） */
  classId: string
  /** 总经验，等级由 [levelOf] 推导，不另存 */
  xp: number
  gold: number
  /** 每行 perk 已勾选的框数，下标对齐 [classes.ts] 的 perks 数组 */
  perks: number[]
  items: GhItem[]
  /** 仅 custom：手动血上限（升级时自己调，职业表里没有它的血线） */
  customMaxHp?: number
  notes?: string
}

/** 当前等级的血量上限；custom 没填过就退回 1 级最常见的下限 */
export function maxHpOf(sheet: Pick<GhSheet, 'classId' | 'xp' | 'customMaxHp'>): number {
  const cls = findClass(sheet.classId)
  if (cls) return cls.hp[levelOf(sheet.xp) - 1]
  return sheet.customMaxHp ?? 6
}

export function makeSheet(classId: string, name: string): GhSheet {
  return {
    id: crypto.randomUUID(),
    at: Date.now(),
    name,
    classId,
    xp: 0,
    gold: 0,
    perks: findClass(classId)?.perks.map(() => 0) ?? [],
    items: [],
    ...(classId === 'custom' ? { customMaxHp: 6 } : {}),
  }
}

/** 导出文件的信封格式。version 留给将来字段演进 */
export const EXPORT_KIND = 'bgtools-gloomhaven-sheets'

export function exportSheets(sheets: GhSheet[]): string {
  return JSON.stringify({ kind: EXPORT_KIND, version: 1, sheets }, null, 2)
}

/**
 * 解析导入的备份。**这是外部边界**（用户喂进来的任意文件），
 * 形状逐字段校验，坏记录整条丢弃而不是硬转
 */
export function parseSheets(text: string): GhSheet[] | null {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (data === null || typeof data !== 'object') return null
  const sheets = (data as { sheets?: unknown }).sheets
  if (!Array.isArray(sheets)) return null
  const out: GhSheet[] = []
  for (const raw of sheets) {
    if (raw === null || typeof raw !== 'object') continue
    const s = raw as Partial<GhSheet>
    if (typeof s.id !== 'string' || typeof s.name !== 'string' || typeof s.classId !== 'string')
      continue
    if (typeof s.xp !== 'number' || typeof s.gold !== 'number') continue
    out.push({
      id: s.id,
      at: typeof s.at === 'number' ? s.at : Date.now(),
      name: s.name,
      classId: s.classId,
      xp: s.xp,
      gold: s.gold,
      perks: Array.isArray(s.perks) ? s.perks.filter((n): n is number => typeof n === 'number') : [],
      items: Array.isArray(s.items)
        ? s.items.filter(
            (it): it is GhItem =>
              it !== null &&
              typeof it === 'object' &&
              typeof (it as GhItem).id === 'string' &&
              typeof (it as GhItem).text === 'string',
          )
        : [],
      ...(typeof s.customMaxHp === 'number' ? { customMaxHp: s.customMaxHp } : {}),
      ...(typeof s.notes === 'string' && s.notes !== '' ? { notes: s.notes } : {}),
    })
  }
  return out
}

type SheetsState = {
  /** IDB 的内存镜像，UI 只读这个，不直接碰 IDB */
  sheets: GhSheet[]
  /** unavailable = 这台设备禁了 IndexedDB，角色纸整块关掉，临时模式照用 */
  status: 'idle' | 'loading' | 'ready' | 'unavailable'
  /** 幂等惰性加载：只在打开选人界面时读盘 */
  load: () => Promise<void>
  /** 新建并返回 id。写不进 IDB 时回 null（调用方留在临时模式） */
  create: (classId: string, name: string) => Promise<string | null>
  /** 里程碑时刻回写：结算加经验、购物改金币、勾 perk、整物品栏 */
  update: (id: string, patch: Partial<Omit<GhSheet, 'id'>>) => Promise<void>
  remove: (id: string) => Promise<void>
  /** 导入：逐条 put（同 id 覆盖），回成功条数 */
  importAll: (sheets: GhSheet[]) => Promise<number>
}

/** 与 archive.ts 同理：写盘失败只落 console，不弹玩家看不懂的框 */
function warn(e: unknown) {
  console.warn('[gloomhaven] sheets failed', e)
}

const byName = (a: GhSheet, b: GhSheet) => a.name.localeCompare(b.name)

export const useSheetsStore = create<SheetsState>()((set, get) => ({
  sheets: [],
  status: 'idle',

  load: async () => {
    if (get().status !== 'idle') return
    set({ status: 'loading' })
    try {
      const sheets = await idbGetAll<GhSheet>(STORE)
      set({ sheets: sheets.sort(byName), status: 'ready' })
    } catch (e) {
      warn(e)
      set({ status: 'unavailable' })
    }
  },

  create: async (classId, name) => {
    const sheet = makeSheet(classId, name)
    try {
      await idbPut(STORE, sheet)
    } catch (e) {
      warn(e)
      set({ status: 'unavailable' })
      return null
    }
    if (get().status === 'ready') set({ sheets: [...get().sheets, sheet].sort(byName) })
    return sheet.id
  },

  update: async (id, patch) => {
    const cur = get().sheets.find((s) => s.id === id)
    if (!cur) return
    const next: GhSheet = { ...cur, ...patch, id, at: Date.now() }
    try {
      await idbPut(STORE, next)
      set({ sheets: get().sheets.map((s) => (s.id === id ? next : s)).sort(byName) })
    } catch (e) {
      warn(e)
    }
  },

  remove: async (id) => {
    try {
      await idbDelete(STORE, id)
      set({ sheets: get().sheets.filter((s) => s.id !== id) })
    } catch (e) {
      warn(e)
    }
  },

  importAll: async (sheets) => {
    let ok = 0
    for (const sheet of sheets) {
      try {
        await idbPut(STORE, sheet)
        ok++
      } catch (e) {
        warn(e)
        break
      }
    }
    if (ok > 0) {
      const imported = new Map(sheets.slice(0, ok).map((s) => [s.id, s]))
      const kept = get().sheets.filter((s) => !imported.has(s.id))
      set({ sheets: [...kept, ...imported.values()].sort(byName) })
    }
    return ok
  },
}))
