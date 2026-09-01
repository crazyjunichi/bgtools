import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '../../shared/i18n'
import { PLAYER_COLORS, type PlayerColor } from '../../shared/players/colors'
import { findPlayer, type Player } from '../../shared/players/store'

export type Seat = {
  id: string
  /** 关联的全局名单玩家；null = 临时席位 */
  playerId: string | null
  /**
   * 名字/颜色快照。名单是真源，但那个人被删掉后席位靠快照继续显示 ——
   * 桌上正在计分时，删个名单条目不该让一整列分数跟着蒸发。
   */
  name: string
  color: PlayerColor
}

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

  /** 席位数不设上限：列多了表格转为横滚、颜色开始复用，但不拦着加 */
  addSeat: () => void
  removeSeat: (seatId: string) => void
  bindPlayer: (seatId: string, player: Player | null) => void
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
}

/**
 * 同色允许重复，这里只是新增时的默认值：优先挑本桌还没用的色。
 * 调色板用尽后按席位序轮转 —— 全都回落到第一色会让后来的人彼此分不开，
 * 而表头本来就同时出名字，同色不是唯一编码。
 */
function firstFreeColor(seats: Seat[]): PlayerColor {
  const used = new Set(seats.map((s) => s.color))
  return (
    PLAYER_COLORS.find((c) => !used.has(c.id))?.id ??
    PLAYER_COLORS[seats.length % PLAYER_COLORS.length].id
  )
}

function makeSeat(seats: Seat[]): Seat {
  return {
    id: newId(),
    playerId: null,
    // 临时席位的名字是快照数据，存的是当下语言的字面量，与全局名单同一套默认名
    name: i18n.t('players.defaultName', { n: seats.length + 1 }),
    color: firstFreeColor(seats),
  }
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

      addSeat: () => {
        const { seats } = get()
        set({ seats: [...seats, makeSeat(seats)] })
      },

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
        set({
          seats: get().seats.map((s) =>
            s.id !== seatId
              ? s
              : player
                ? { ...s, playerId: player.id, name: player.name, color: player.color }
                : // 解除关联：名字颜色留着当快照，就地变回临时席位
                  { ...s, playerId: null },
          ),
        }),

      bump: (seatId, amount) => {
        if (!amount) return
        const { draft, undoStack } = get()
        set({
          draft: { ...draft, [seatId]: (draft[seatId] ?? 0) + amount },
          undoStack: [...undoStack, { seatId, amount }].slice(-UNDO_LIMIT),
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
        set({ rounds: [...rounds, { id: newId(), delta: draft }], draft: {}, undoStack: [] })
      },

      undo: () => {
        const { undoStack, draft } = get()
        const op = undoStack.at(-1)
        if (!op) return
        const next = { ...draft, [op.seatId]: (draft[op.seatId] ?? 0) - op.amount }
        if (next[op.seatId] === 0) delete next[op.seatId]
        set({ draft: next, undoStack: undoStack.slice(0, -1) })
      },

      newGame: () => set({ rounds: [], draft: {}, undoStack: [] }),
    }),
    {
      name: 'bgtools:score',
      partialize: ({ seats, rounds, draft }) => ({ seats, rounds, draft }),
    },
  ),
)

export function totalOf(rounds: Round[], draft: Record<string, number>, seatId: string): number {
  return rounds.reduce((sum, r) => sum + (r.delta[seatId] ?? 0), 0) + (draft[seatId] ?? 0)
}

/**
 * 增减量一律带符号。表格里另有冷暖色辅助（见 [ScoreTable] 的 `TONE`），
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

export type SeatView = Seat & { linked: boolean }

/**
 * 名单是真源：人还在就以名单为准（在顶栏 👥 改名/换色立刻反映到表头），
 * 被删了就退回快照并按临时席位对待 —— 不写回 store，避免渲染期产生副作用。
 */
export function resolveSeat(seat: Seat, players: Player[]): SeatView {
  const p = seat.playerId ? findPlayer(players, seat.playerId) : undefined
  return p ? { ...seat, name: p.name, color: p.color, linked: true } : { ...seat, linked: false }
}
