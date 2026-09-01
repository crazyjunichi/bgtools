import type { TFunction } from 'i18next'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '../../shared/i18n'
import type { I18nKey } from '../../shared/i18n/types'
import { bindSeat, makeSeat, type Seat } from '../../shared/players/seats'
import type { Player } from '../../shared/players/store'
import { useGamesStore, type GameDraft, type SheetGame } from './games'
import { BLANK_ID, DIRECT, findTemplate, type Scoring, type SheetEntry, type Step } from './templates'

/**
 * 通用空白模板里用户自己加的条目。与 [SheetEntry](templates.ts) 的区别只在名字是字面量而非 key ——
 * 输入方式不存在这里，它和模板条目共用一张 `overrides`（同一个浮层改的东西，没理由分两处存）。
 */
export type CustomEntry = { id: string; label: string }

/** 两种来源归一后的条目：模板给 nameKey，自定义给 label */
export type Entry = {
  id: string
  nameKey?: I18nKey
  label?: string
  /** 生效的算分方式（override 优先） */
  scoring: Scoring
  /**
   * 模板自带的那份。**决定这一条的数量模式是什么** —— perUnit 与 table 互斥，
   * 一条细则在规则书里只有一种算法，用户能切的只是「按不按数量算」
   */
  base: Scoring
}

/** 选中的格子 */
export type Pick = { seatId: string; entryId: string }

const newId = () => crypto.randomUUID()

/** 通用模板的初始条目数：够看出「这是一张可以自己填的纸」，又不至于一屏全是待办 */
const CUSTOM_SEED = 5

/**
 * 默认条目名是**存进 localStorage 的快照**，所以在这里用 `i18n.t` 取当下语言的字面量，
 * 之后切语言不跟着变 —— 和 [players/store](../../shared/players/store.ts) 的 defaultName 同一套理由。
 */
function seedCustomEntries(): CustomEntry[] {
  return Array.from({ length: CUSTOM_SEED }, (_, i) => ({
    id: newId(),
    label: i18n.t('tools.scoreSheet.defaultEntry', { n: i + 1 }),
  }))
}

type SheetState = {
  templateId: string
  customEntries: CustomEntry[]
  /**
   * 条目 id -> 用户改过的算分方式。**只存被改过的那几条**，没改的读模板常量 ——
   * 这样以后修模板（补一档、改分值）能直接生效，而不是被存档里的旧副本盖住。
   */
  overrides: Record<string, Scoring>
  /** 数组顺序即矩阵列顺序 */
  seats: Seat[]
  /** [cellKey](#cellKey) -> 原始输入值（数量模式的条目里是**数量**，否则就是得分） */
  cells: Record<string, number>
  /**
   * 本局开始时刻，表头副标题就是它。**按「新一局」才重置** ——
   * 桌上问的是「这局打了多久」，所以锚点得是开局那一刻，不是最后一次填分
   */
  startedAt: number
  /** 选中的格子。不 persist —— 重开该是干净的，同 score 的 undoStack */
  pick: Pick | null

  setTemplate: (templateId: string) => void
  /** 列数不设上限：列多了矩阵转横滚、颜色开始复用，但不拦着加 */
  addSeat: () => void
  removeSeat: (seatId: string) => void
  bindPlayer: (seatId: string, player: Player | null) => void
  /** 只改临时席位的快照名。绑定了名单玩家的列由 [SeatPicker] 直接改名单，不到这里 */
  renameSeat: (seatId: string, name: string) => void
  setPick: (pick: Pick | null) => void
  /** raw 为 null = 清空这一格（显示 `·`）；0 是合法输入值，会照存 */
  setCell: (seatId: string, entryId: string, raw: number | null) => void
  /**
   * 改这一条的算分方式。null = 恢复模板默认。
   * **连带清空这一行所有格子**：同一个 3 在「填数量」下是 3 个、在「填得分」下是 3 分，
   * 留着它必然有一半的列被读错。清掉比留着更简单，也比替用户折算更诚实。
   */
  setScoring: (entryId: string, scoring: Scoring | null) => void
  /**
   * 只改「每个 N 分」的那个 N（自定义条目专属，模板条目的 N 就是档位、只读）。
   * **不清行**：填的还是数量，只是折算系数变了 —— 走 setScoring 会让长按连增一路清光已填的数
   */
  setPer: (entryId: string, per: number) => void
  addEntry: () => void
  renameEntry: (entryId: string, label: string) => void
  removeEntry: (entryId: string) => void
  /**
   * 新一局：只清分数，留席位 / 模板 / 自定义条目（换局通常还是这桌人这个游戏）。
   * 清之前先按 [isComplete](#isComplete) 归档 —— 这是历史记录唯一的入口
   */
  newGame: () => void
  /**
   * 把一局历史读回当前局。**先归档当前局**（手滑点到不该丢掉正在打的那局），
   * 再整份覆盖那五个字段。历史里被读的那条**不删** —— 这是「读取」不是「取出」
   */
  loadGame: (game: SheetGame) => void
}

export function cellKey(seatId: string, entryId: string): string {
  return `${seatId}|${entryId}`
}

/** 删列 / 删条目时连带清掉那些格子，否则表里没了行列、数据还在存档里攒着 */
function dropCells(cells: Record<string, number>, match: (key: string) => boolean) {
  return Object.fromEntries(Object.entries(cells).filter(([k]) => !match(k)))
}

/**
 * 值不值得进历史：**每个席位都至少填过一格**。
 *
 * 摆开了列还没开始填、或漏了一个人没填完就按了新一局，存进去只会是一条读不出胜负的废记录。
 * 判据故意宽松到「一格」而非「填满」—— 很多模板大半行是 0 分不填（卡坦的最长道路没人拿就空着）。
 */
export function isComplete(seats: Seat[], cells: Record<string, number>): boolean {
  const keys = Object.keys(cells)
  return seats.length > 0 && seats.every((s) => keys.some((k) => k.startsWith(`${s.id}|`)))
}

/**
 * 归档当前局。**fire-and-forget**：写盘失败只落 console（见 [games](games.ts) 的 warn），
 * 桌上按「新一局」不能因为 IDB 不可用就卡住不清分。
 */
function archiveCurrent(s: SheetState) {
  if (!isComplete(s.seats, s.cells)) return
  const draft: GameDraft = {
    templateId: s.templateId,
    customEntries: s.customEntries,
    overrides: s.overrides,
    seats: s.seats,
    cells: s.cells,
    startedAt: s.startedAt,
  }
  void useGamesStore.getState().archive(draft)
}

export const useSheetStore = create<SheetState>()(
  persist(
    (set, get) => ({
      templateId: BLANK_ID,
      customEntries: seedCustomEntries(),
      overrides: {},
      seats: [],
      cells: {},
      startedAt: Date.now(),
      pick: null,

      // 切模板**不清分数**：entryId 是稳定字面量，换走的条目只是暂时不显示，切回来还在
      setTemplate: (templateId) => set({ templateId, pick: null }),

      addSeat: () => {
        const { seats } = get()
        set({ seats: [...seats, makeSeat(seats)] })
      },

      removeSeat: (seatId) => {
        const { seats, cells, pick } = get()
        set({
          seats: seats.filter((s) => s.id !== seatId),
          cells: dropCells(cells, (k) => k.startsWith(`${seatId}|`)),
          pick: pick?.seatId === seatId ? null : pick,
        })
      },

      bindPlayer: (seatId, player) =>
        set({ seats: get().seats.map((s) => (s.id === seatId ? bindSeat(s, player) : s)) }),

      renameSeat: (seatId, name) =>
        set({ seats: get().seats.map((s) => (s.id === seatId ? { ...s, name } : s)) }),

      setPick: (pick) => set({ pick }),

      setCell: (seatId, entryId, raw) => {
        const key = cellKey(seatId, entryId)
        const cells = { ...get().cells }
        if (raw === null) delete cells[key]
        else cells[key] = raw
        set({ cells })
      },

      setScoring: (entryId, scoring) => {
        const { cells, pick } = get()
        const overrides = { ...get().overrides }
        if (scoring === null) delete overrides[entryId]
        else overrides[entryId] = scoring
        set({
          overrides,
          cells: dropCells(cells, (k) => k.endsWith(`|${entryId}`)),
          // 这一行的数刚被清掉，键盘不该还停在它上面（缓冲也跟着 pickKey 重置）
          pick: pick?.entryId === entryId ? null : pick,
        })
      },

      setPer: (entryId, per) =>
        set({ overrides: { ...get().overrides, [entryId]: { kind: 'perUnit', per } } }),

      addEntry: () => {
        const { customEntries } = get()
        set({
          customEntries: [
            ...customEntries,
            {
              id: newId(),
              label: i18n.t('tools.scoreSheet.defaultEntry', { n: customEntries.length + 1 }),
            },
          ],
        })
      },

      renameEntry: (entryId, label) =>
        set({
          customEntries: get().customEntries.map((e) => (e.id === entryId ? { ...e, label } : e)),
        }),

      removeEntry: (entryId) => {
        const { customEntries, overrides, cells, pick } = get()
        const rest = { ...overrides }
        delete rest[entryId]
        set({
          customEntries: customEntries.filter((e) => e.id !== entryId),
          overrides: rest,
          cells: dropCells(cells, (k) => k.endsWith(`|${entryId}`)),
          pick: pick?.entryId === entryId ? null : pick,
        })
      },

      newGame: () => {
        archiveCurrent(get())
        set({ cells: {}, pick: null, startedAt: Date.now() })
      },

      loadGame: ({ templateId, customEntries, overrides, seats, cells, startedAt, at }) => {
        archiveCurrent(get())
        set({
          templateId,
          customEntries,
          overrides,
          seats,
          cells,
          // 读回来的是那一晚，表头得跟着走。存档早于本字段的只有归档时刻可用
          startedAt: startedAt ?? at,
          pick: null,
        })
      },
    }),
    {
      name: 'bgtools:score-sheet',
      partialize: ({ templateId, customEntries, overrides, seats, cells, startedAt }) => ({
        templateId,
        customEntries,
        overrides,
        seats,
        cells,
        startedAt,
      }),
    },
  ),
)

/** 当前模板的条目清单。通用模板走用户自己那份，其余走模板常量；两者都套一层 overrides */
export function entriesOf(
  templateId: string,
  customEntries: CustomEntry[],
  overrides: Record<string, Scoring>,
): Entry[] {
  const tpl = findTemplate(templateId)
  const raw: { id: string; nameKey?: I18nKey; label?: string; base: Scoring }[] = tpl.editable
    ? // 自定义条目没有模板默认值，base 恒为「直接填分」
      customEntries.map((e) => ({ id: e.id, label: e.label, base: DIRECT }))
    : tpl.entries.map((e: SheetEntry) => ({ id: e.id, nameKey: e.nameKey, base: e.scoring ?? DIRECT }))
  return raw.map((e) => {
    /*
     * base 是 direct 的**模板**条目不许改填法（见 [isAdjustable](#isAdjustable)）。
     * 早先版本给过这个开关，所以老存档里可能留着一条 perUnit override ——
     * 这里直接忽略掉，否则那一行会卡在改不回来的状态（行首已经不给入口了）
     */
    const fixed = e.nameKey !== undefined && e.base.kind === 'direct'
    return { ...e, scoring: fixed ? e.base : (overrides[e.id] ?? e.base) }
  })
}

/**
 * 行首那个浮层对这一条有没有东西可调。
 *
 * 自定义条目恒可调（改名 / 删除 / 切填法）；模板条目只有**带数量算法**的可调 ——
 * 剩下的（鸟类分、计分轨、最长道路）在规则书里就没有可数的个数，
 * 填的必然是一个自己加出来的总分，「改成每个 N 分」等于改游戏。
 * 这类行首不做成按钮，点开只会是一个空面板，见 [SheetGrid](SheetGrid.tsx)。
 */
export function isAdjustable(entry: Entry): boolean {
  return entry.nameKey === undefined || entry.base.kind !== 'direct'
}

/** 模板条目在渲染期才取文案（切语言要立刻跟着变），自定义条目本身就是字面量 */
export function entryLabel(entry: Entry, t: TFunction): string {
  return entry.nameKey ? t(entry.nameKey) : (entry.label ?? '')
}

/** 得分。数量模式的条目里存的是数量，折算过才是分 */
export function scoreOf(entry: Entry, raw: number | undefined): number {
  if (raw === undefined) return 0
  const s = entry.scoring
  if (s.kind === 'perUnit') return raw * s.per
  // 零头不算：11 枚金币仍是 3 分。负数交给 Math.floor 的向下取整（误按 ± 时不会凭空冒出正分）
  if (s.kind === 'perGroup') return Math.floor(raw / s.every) * s.score
  if (s.kind === 'table') return fromTable(s.steps, raw)
  return raw
}

/**
 * 查分段表：取最后一个 `from ≤ n` 的档。
 * 比首档下界还小（换算表都从 0 起，只可能是误按了 ±）也按首档算 —— 落到 0 分更让人以为算对了。
 */
function fromTable(steps: readonly Step[], n: number): number {
  let hit = steps[0]
  for (const s of steps) {
    if (n < s.from) break
    hit = s
  }
  return hit?.score ?? 0
}

export function rawOf(cells: Record<string, number>, seatId: string, entryId: string) {
  return cells[cellKey(seatId, entryId)]
}

/** 这一行填过东西没有 —— 切算分方式会清掉整行，填过了才值得拦一次二次确认 */
export function hasRow(cells: Record<string, number>, entryId: string): boolean {
  return Object.keys(cells).some((k) => k.endsWith(`|${entryId}`))
}

export function totalOf(entries: Entry[], cells: Record<string, number>, seatId: string): number {
  return entries.reduce((sum, e) => sum + scoreOf(e, rawOf(cells, seatId, e.id)), 0)
}

/**
 * 负号用 U+2212 而非连字符：与 [Stepper](../../shared/components/Stepper.tsx) 一致，
 * 等宽字体下宽度也才对得上。
 */
export function fmtScore(v: number): string {
  return v < 0 ? `−${-v}` : String(v)
}

/** 没填过的格子显示 `·`：满屏 0 会糊成噪声，反而看不见真正填过的格子（显式填的 0 照显示） */
export function fmtCell(v: number | undefined): string {
  return v === undefined ? '·' : fmtScore(v)
}
