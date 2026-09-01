import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PLAYER_COLORS, type PlayerColor } from './colors'

export type Player = {
  id: string
  /** 不变式：非空。rename 会把空名回填成「玩家N」，消费方不必处理空字符串 */
  name: string
  color: PlayerColor
}

/** = 调色板长度。再多的人桌上靠颜色也认不出谁是谁 */
export const MAX_PLAYERS = 8
/** 桌上胶囊放得下的上限，输入框也按这个截断 */
export const MAX_NAME_LEN = 10

const DEFAULT_COUNT = 4

/** 安全上下文才有 randomUUID：线上是 https、本地是 localhost，都满足 */
const newId = () => crypto.randomUUID()

const defaultName = (seat: number) => `玩家${seat}`

function makePlayer(seat: number, color: PlayerColor): Player {
  return { id: newId(), name: defaultName(seat), color }
}

function defaultRoster(): Player[] {
  return Array.from({ length: DEFAULT_COUNT }, (_, i) => makePlayer(i + 1, PLAYER_COLORS[i].id))
}

/** 同色允许重复，这里只是新增时的默认值：优先挑还没人用的色 */
function firstFreeColor(players: Player[]): PlayerColor {
  const used = new Set(players.map((p) => p.color))
  return PLAYER_COLORS.find((c) => !used.has(c.id))?.id ?? PLAYER_COLORS[0].id
}

type PlayersState = {
  /** 数组顺序即座位顺序 */
  players: Player[]
  /** 返回新玩家 id，方便调用方立刻聚焦到它改名 */
  add: () => string | null
  remove: (id: string) => void
  rename: (id: string, name: string) => void
  setColor: (id: string, color: PlayerColor) => void
  /** 换座位：dir = -1 上移 / 1 下移，越界时不动 */
  move: (id: string, dir: -1 | 1) => void
  reset: () => void
}

/**
 * 全局玩家名单 —— 跨工具共享的唯一真源。
 * 刻意不放在 quick/players/ 下：quick 工具的惯例是"与工具页状态完全独立"，
 * 而名单的全部价值就在被各个工具读到。quick 目录里只留编辑 UI。
 */
export const usePlayersStore = create<PlayersState>()(
  persist(
    (set, get) => ({
      players: defaultRoster(),

      add: () => {
        const { players } = get()
        if (players.length >= MAX_PLAYERS) return null
        const p = makePlayer(players.length + 1, firstFreeColor(players))
        set({ players: [...players, p] })
        return p.id
      },

      remove: (id) => set({ players: get().players.filter((p) => p.id !== id) }),

      rename: (id, name) =>
        set({
          players: get().players.map((p, i) =>
            // 空名不落库：桌上一个没名字的胶囊等于没有这个玩家
            p.id === id
              ? { ...p, name: name.trim().slice(0, MAX_NAME_LEN) || defaultName(i + 1) }
              : p,
          ),
        }),

      setColor: (id, color) =>
        set({ players: get().players.map((p) => (p.id === id ? { ...p, color } : p)) }),

      move: (id, dir) => {
        const players = [...get().players]
        const i = players.findIndex((p) => p.id === id)
        const j = i + dir
        if (i < 0 || j < 0 || j >= players.length) return
        ;[players[i], players[j]] = [players[j], players[i]]
        set({ players })
      },

      reset: () => set({ players: defaultRoster() }),
    }),
    {
      name: 'bgtools:players',
      partialize: ({ players }) => ({ players }),
    },
  ),
)

export function findPlayer(players: Player[], id: string): Player | undefined {
  return players.find((p) => p.id === id)
}
