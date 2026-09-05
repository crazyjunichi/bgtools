import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { rankByScore, seatsToPlayers } from '../../shared/match/result'
import type { MatchDraft } from '../../shared/match/types'
import { bindSeat, finalizeSeats, makeSeat, SAME_TABLE_WINDOW_MS, type Seat } from '../../shared/players/seats'
import type { Player } from '../../shared/players/store'
import { diceThroneMeta } from './meta'

/** 规则书数值：CP 上限 15；治疗可以回复到初始生命 +10 */
export const CP_MAX = 15
export const OVERHEAL = 10
/** 英雄初始生命各不相同，给一个覆盖主流英雄的档位范围 */
export const START_HP_DEFAULT = 50
export const START_HP_MIN = 20
export const START_HP_MAX = 70
export const START_HP_STEP = 5

export type ThroneSeat = Seat & {
  hp: number
  /** 初始生命。回复上限 = startHp + OVERHEAL，用 [maxHp] 取，别自己加 */
  startHp: number
  cp: number
  /** statusId → 层数；0 层不存键 */
  statuses: Record<string, number>
}

/** 面板用的席位：resolveSeat 的名字/色（名单实时优先、快照兜底）+ 本工具的三条数值轨 */
export type ThroneSeatView = ThroneSeat & { linked: boolean }

export const maxHp = (s: Pick<ThroneSeat, 'startHp'>) => s.startHp + OVERHEAL

const makeThroneSeat = (seats: Seat[]): ThroneSeat => ({
  ...makeSeat(seats),
  hp: START_HP_DEFAULT,
  startHp: START_HP_DEFAULT,
  cp: 0,
  statuses: {},
})

type ThroneState = {
  seats: ThroneSeat[]
  /** 这一局的开局时刻，按「新一局」才重置 */
  startedAt: number
  /** 最后一次改动数值的时刻（结算 endAt 取它）。换人、改名不算 */
  lastActiveAt: number
  /**
   * 本局已归档记录的 id。结算面板打开即归档，之后重复结算 / 补备注都拿它**覆盖同一条**，
   * 而不是再记一条。开新局时清掉
   */
  matchId: string | null

  /** 结算面板归档成功后回写记录 id */
  setMatchId: (id: string) => void

  seatPlayers: (picked: Player[], temps?: number) => void
  /** 席位数不设上限，与计分工具一致 */
  addSeat: () => void
  removeSeat: (seatId: string) => void
  bindPlayer: (seatId: string, player: Player | null) => void
  /** 只改临时席位的快照名 */
  renameSeat: (seatId: string, name: string) => void
  /** 增减生命，clamp 到 [0, startHp + OVERHEAL] */
  bumpHp: (seatId: string, delta: number) => void
  setCp: (seatId: string, cp: number) => void
  /** 定档即重置满血：这是开局调档的入口，局中调它等于手动改当前血 */
  setStartHp: (seatId: string, startHp: number) => void
  /** 0 即移除该状态 */
  setStatus: (seatId: string, statusId: string, count: number) => void
  /**
   * 新一局：清数值。席位看时间窗 —— 同一桌（[SAME_TABLE_WINDOW_MS]）留着直接开，
   * 隔得太久多半换了一桌人，连席位一起清回选人
   */
  newGame: () => void
  /** 换一桌人：连席位一起清 */
  resetTable: () => void
}

export const useThroneStore = create<ThroneState>()(
  persist(
    (set, get) => {
      const patchSeat = (seatId: string, patch: (s: ThroneSeat) => ThroneSeat, touch = true) =>
        set({
          seats: get().seats.map((s) => (s.id === seatId ? patch(s) : s)),
          ...(touch ? { lastActiveAt: Date.now() } : {}),
        })

      return {
        seats: [],
        startedAt: Date.now(),
        lastActiveAt: Date.now(),
        matchId: null,

        setMatchId: (id) => set({ matchId: id }),

        seatPlayers: (picked, temps = 0) => {
          const seated = picked.reduce<ThroneSeat[]>(
            (acc, p) => [...acc, bindSeat(makeThroneSeat(acc), p) as ThroneSeat],
            [],
          )
          for (let i = 0; i < temps; i++) seated.push(makeThroneSeat(seated))
          set({ seats: seated })
        },

        addSeat: () => set({ seats: [...get().seats, makeThroneSeat(get().seats)] }),

        removeSeat: (seatId) => set({ seats: get().seats.filter((s) => s.id !== seatId) }),

        bindPlayer: (seatId, player) =>
          patchSeat(seatId, (s) => bindSeat(s, player) as ThroneSeat, false),

        renameSeat: (seatId, name) => patchSeat(seatId, (s) => ({ ...s, name }), false),

        bumpHp: (seatId, delta) =>
          patchSeat(seatId, (s) => {
            if (!delta) return s
            const hp = Math.min(Math.max(s.hp + delta, 0), maxHp(s))
            return hp === s.hp ? s : { ...s, hp }
          }),

        setCp: (seatId, cp) =>
          patchSeat(seatId, (s) => ({ ...s, cp: Math.min(Math.max(cp, 0), CP_MAX) })),

        setStartHp: (seatId, startHp) =>
          patchSeat(seatId, (s) => ({ ...s, startHp, hp: startHp })),

        setStatus: (seatId, statusId, count) =>
          patchSeat(seatId, (s) => {
            const statuses = { ...s.statuses }
            if (count > 0) statuses[statusId] = count
            else delete statuses[statusId]
            return { ...s, statuses }
          }),

        newGame: () => {
          // 隔太久的「新一局」多半已经换了一桌人：连席位一起清，回到选人开局
          const sameTable = Date.now() - get().startedAt < SAME_TABLE_WINDOW_MS
          set({
            seats: sameTable
              ? get().seats.map((s) => ({ ...s, hp: s.startHp, cp: 0, statuses: {} }))
              : [],
            startedAt: Date.now(),
            lastActiveAt: Date.now(),
            matchId: null,
          })
        },

        resetTable: () => {
          get().newGame()
          set({ seats: [] })
        },
      }
    },
    {
      name: 'bgtools:dice-throne',
      partialize: ({ seats, startedAt, lastActiveAt, matchId }) => ({
        seats,
        startedAt,
        lastActiveAt,
        matchId,
      }),
    },
  ),
)

/** 存进 `Match.payload` 的终局快照：回看要能看到散场那一刻每个人的血线与挂着的状态 */
export type ThronePayload = {
  seats: ThroneSeat[]
  startedAt: number
}

/**
 * 从 `Match.payload` 反解。**这是个外部边界**（单表里躺着所有工具的 payload，
 * 也可能是别的版本写下的东西），形状要校验而不是硬转
 */
export function readThronePayload(payload: unknown): ThronePayload | null {
  if (payload === null || typeof payload !== 'object') return null
  const p = payload as Partial<ThronePayload>
  if (!Array.isArray(p.seats)) return null
  return { seats: p.seats, startedAt: p.startedAt ?? 0 }
}

/**
 * 这一局的可归档形态。**在打开结算面板那一刻取一次**（`endAt` 是最后一次改数值的时刻）。
 * 名次按剩余生命排：活着的人血必然比淘汰的多；2v2 的第二名队友由用户在结算面板补标
 */
export function throneMatchDraft(): MatchDraft {
  const s = useThroneStore.getState()
  // 定稿时刻以名单为准刷新席位名/色（finalizeSeats），让导出与屏幕上的表头是同一份
  const seats = finalizeSeats(s.seats)
  const payload: ThronePayload = { seats, startedAt: s.startedAt }
  return {
    // 带上已归档记录的 id：重复结算覆盖同一条，不在历史里攒出一串分身
    id: s.matchId ?? undefined,
    startedAt: s.startedAt,
    endAt: s.lastActiveAt,
    gameId: diceThroneMeta.id,
    toolId: diceThroneMeta.id,
    mode: 'ranked',
    players: rankByScore(
      seatsToPlayers(seats).map((p, i) => ({ ...p, score: seats[i].hp })),
      (p) => p.score ?? 0,
    ),
    payload,
  }
}
