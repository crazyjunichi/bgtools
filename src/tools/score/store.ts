import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { rankByScore, seatsToPlayers } from '../../shared/match/result'
import type { MatchDraft } from '../../shared/match/types'
import { bindSeat, makeSeat, type Seat } from '../../shared/players/seats'
import type { Player } from '../../shared/players/store'
import { scoreMeta } from './meta'

export type Round = {
  id: string
  /** seatId -> 本轮增减，缺键即 0 */
  delta: Record<string, number>
}

/** 撤销只兜"刚点错"，栈不必长 */
const UNDO_LIMIT = 30

const newId = () => crypto.randomUUID()

/** 一次加减。回退就是反向加一次，所以只存差量而非快照 */
type Op = { seatId: string; amount: number }

type ScoreState = {
  /** 数组顺序即表格列顺序 */
  seats: Seat[]
  /** 已封档的轮次，顺序即先后 */
  rounds: Round[]
  /** 当前轮（草稿）：实时累加，点「下一轮」才封档 —— 连点 +1 五次只落一格 +5，不需要防抖计时器 */
  draft: Record<string, number>
  /** 只在内存：跨会话还能回退一步反而危险，重开就该是干净的 */
  undoStack: Op[]
  /** 这一局的开局时刻，按「新一局」才重置 */
  startedAt: number
  /**
   * 最后一次**改动分数数据**的时刻，结算时的 `endAt` 取它。
   * 表摊在桌上切后台、隔天再回来按「新一局」是常态，那时的 `Date.now()`
   * 与这局真正结束差着十几个小时。加列删列不算改动
   */
  lastActiveAt: number

  /** 席位数不设上限：列多了表格转为横滚、颜色开始复用，但不拦着加 */
  addSeat: () => void
  /**
   * 一次落座：按名单顺序建席位并绑定玩家。**只给空桌开局用** ——
   * 一局重新添加玩家是常态，逐列点太慢
   */
  seatPlayers: (picked: Player[]) => void
  removeSeat: (seatId: string) => void
  bindPlayer: (seatId: string, player: Player | null) => void
  /** 只改临时席位的快照名。绑定了名单玩家的列由 [SeatPicker] 直接改名单，不到这里 */
  renameSeat: (seatId: string, name: string) => void
  bump: (seatId: string, amount: number) => void
  /**
   * 直接改写当前轮的得分（不是总分）—— 桌上报的永远是"这轮得几分"。
   * 内部仍折成一次 bump，撤销栈因此不必区分两种操作。
   */
  setDelta: (seatId: string, delta: number) => void
  nextRound: () => void
  undo: () => void
  /** 新一局：清分数与历史，席位留着（换个游戏通常还是这桌人） */
  newGame: () => void
  /** 换一桌人：席位也一起清，回到开局选人的空桌 */
  resetTable: () => void
}

function without(deltas: Record<string, number>, seatId: string): Record<string, number> {
  const next = { ...deltas }
  delete next[seatId]
  return next
}

export const useScoreStore = create<ScoreState>()(
  persist(
    (set, get) => ({
      seats: [],
      rounds: [],
      draft: {},
      undoStack: [],
      startedAt: Date.now(),
      lastActiveAt: Date.now(),

      addSeat: () => {
        const { seats } = get()
        set({ seats: [...seats, makeSeat(seats)] })
      },

      seatPlayers: (picked) =>
        set({
          seats: picked.reduce<Seat[]>((acc, p) => [...acc, bindSeat(makeSeat(acc), p)], []),
        }),

      removeSeat: (seatId) => {
        const { seats, rounds, draft, undoStack } = get()
        set({
          seats: seats.filter((s) => s.id !== seatId),
          // 历史里也要抹掉这一列，否则表格没了列、数据还在里面攒着
          rounds: rounds.map((r) => ({ ...r, delta: without(r.delta, seatId) })),
          draft: without(draft, seatId),
          undoStack: undoStack.filter((o) => o.seatId !== seatId),
        })
      },

      bindPlayer: (seatId, player) =>
        set({ seats: get().seats.map((s) => (s.id === seatId ? bindSeat(s, player) : s)) }),

      renameSeat: (seatId, name) =>
        set({ seats: get().seats.map((s) => (s.id === seatId ? { ...s, name } : s)) }),

      bump: (seatId, amount) => {
        if (!amount) return
        const { draft, undoStack } = get()
        set({
          draft: { ...draft, [seatId]: (draft[seatId] ?? 0) + amount },
          undoStack: [...undoStack, { seatId, amount }].slice(-UNDO_LIMIT),
          lastActiveAt: Date.now(),
        })
      },

      setDelta: (seatId, delta) => {
        get().bump(seatId, delta - (get().draft[seatId] ?? 0))
      },

      nextRound: () => {
        const { rounds, draft } = get()
        // 空轮不落行：桌上误点一下不该在表里留一条全 0 的记录
        if (!Object.values(draft).some((v) => v !== 0)) return
        // 封档后清撤销栈：撤销只在当前轮内有效，否则会把已成表的行改乱
        set({
          rounds: [...rounds, { id: newId(), delta: draft }],
          draft: {},
          undoStack: [],
          lastActiveAt: Date.now(),
        })
      },

      undo: () => {
        const { undoStack, draft } = get()
        const op = undoStack.at(-1)
        if (!op) return
        const next = { ...draft, [op.seatId]: (draft[op.seatId] ?? 0) - op.amount }
        if (next[op.seatId] === 0) delete next[op.seatId]
        set({ draft: next, undoStack: undoStack.slice(0, -1), lastActiveAt: Date.now() })
      },

      newGame: () => {
        const now = Date.now()
        set({ rounds: [], draft: {}, undoStack: [], startedAt: now, lastActiveAt: now })
      },

      resetTable: () => {
        get().newGame()
        set({ seats: [] })
      },
    }),
    {
      name: 'bgtools:score',
      partialize: ({ seats, rounds, draft, startedAt, lastActiveAt }) => ({
        seats,
        rounds,
        draft,
        startedAt,
        lastActiveAt,
      }),
    },
  ),
)

/**
 * 这一局的可归档形态。**在打开结算面板那一刻取一次**：`endAt` 是最后一次加分的时刻，
 * 不是按下结算的时刻。名次按总分自动算（并列同名次），谁算赢让用户在面板里改。
 */
export function scoreMatchDraft(): MatchDraft {
  const s = useScoreStore.getState()
  const scored = seatsToPlayers(s.seats).map((p, i) => ({
    ...p,
    score: totalOf(s.rounds, s.draft, s.seats[i].id),
  }))
  const payload: ScorePayload = {
    seats: s.seats,
    rounds: s.rounds,
    draft: s.draft,
    startedAt: s.startedAt,
  }
  return {
    startedAt: s.startedAt,
    endAt: s.lastActiveAt,
    // 通用计分不绑定某盒游戏，用户可以在结算面板里指定
    gameId: null,
    toolId: scoreMeta.id,
    mode: 'ranked',
    players: rankByScore(scored, (p) => p.score ?? 0),
    payload,
  }
}

/**
 * 存进 `Match.payload` 的局面。整份局面而不是算好的总分：回看要能看到逐轮明细，
 * 而分数细则（哪轮加了几分）只有这个工具知道怎么读（见 [match.ts](match.ts)）
 */
export type ScorePayload = {
  seats: Seat[]
  rounds: Round[]
  draft: Record<string, number>
  startedAt: number
}

/**
 * 从 `Match.payload` 反解。**这是个外部边界**（单表里躺着所有工具的 payload，
 * 也可能是别的版本写下的东西），所以形状要校验而不是硬转。
 */
export function readScorePayload(payload: unknown): ScorePayload | null {
  if (payload === null || typeof payload !== 'object') return null
  const p = payload as Partial<ScorePayload>
  if (!Array.isArray(p.seats) || !Array.isArray(p.rounds)) return null
  return {
    seats: p.seats,
    rounds: p.rounds,
    draft: p.draft ?? {},
    startedAt: p.startedAt ?? 0,
  }
}

export function totalOf(rounds: Round[], draft: Record<string, number>, seatId: string): number {
  return rounds.reduce((sum, r) => sum + (r.delta[seatId] ?? 0), 0) + (draft[seatId] ?? 0)
}

/**
 * 增减量一律带符号。表格里另有冷暖色辅助（见 [shared/tone.ts](../../shared/tone.ts)），
 * 但**符号始终是主编码** —— 色觉差异或强光下颜色可能完全失效。
 * 减号用 U+2212 而非连字符：与 [Stepper] 一致，等宽字体下宽度也才对得上。
 */
export function signed(v: number): string {
  if (v > 0) return `+${v}`
  if (v < 0) return `−${-v}`
  return '0'
}

/** 表格格子里 0 和缺键都显示 ·：满屏的 0 会糊成噪声，反而看不见真正动过的格子 */
export function fmtDelta(v: number | undefined): string {
  return v ? signed(v) : '·'
}
