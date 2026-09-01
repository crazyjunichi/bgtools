import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '../i18n'
import { PLAYER_COLORS, type PlayerColor } from './colors'

export type Player = {
  id: string
  /** 不变式：非空。rename 会把空名回填成默认名，消费方不必处理空字符串 */
  name: string
  color: PlayerColor
}

/** 桌上胶囊放得下的上限，输入框也按这个截断 */
export const MAX_NAME_LEN = 10

const DEFAULT_COUNT = 4

/** 安全上下文才有 randomUUID：线上是 https、本地是 localhost，都满足 */
const newId = () => crypto.randomUUID()

/**
 * 走 `i18n.t()` 而非 hook：本函数在模块加载期（`defaultRoster()`）就被调用。
 * 已经存进 localStorage 的名字不会跟着语言变 —— 那是用户数据，只有改名才更新。
 */
const defaultName = (seat: number) => i18n.t('players.defaultName', { n: seat })

function makePlayer(seat: number, color: PlayerColor): Player {
  return { id: newId(), name: defaultName(seat), color }
}

function defaultRoster(): Player[] {
  return Array.from({ length: DEFAULT_COUNT }, (_, i) => makePlayer(i + 1, PLAYER_COLORS[i].id))
}

/**
 * 同色允许重复，这里只是新增时的默认值：优先挑还没人用的色。
 * 人数不设上限而色板只有 16 个，满了之后按人数取模轮着发 ——
 * 一律回落到第一个色会让第 17 人起全是红的。
 */
function nextColor(players: Player[]): PlayerColor {
  const used = new Set(players.map((p) => p.color))
  return (
    PLAYER_COLORS.find((c) => !used.has(c.id))?.id ??
    PLAYER_COLORS[players.length % PLAYER_COLORS.length].id
  )
}

type PlayersState = {
  /** 数组顺序即座位顺序 */
  players: Player[]
  /** 返回新玩家 id，方便调用方立刻聚焦到它改名。人数无上限，所以不会失败 */
  add: () => string
  remove: (id: string) => void
  rename: (id: string, name: string) => void
  setColor: (id: string, color: PlayerColor) => void
  /** 换座位：dir = -1 上移 / 1 下移，越界时不动 */
  move: (id: string, dir: -1 | 1) => void
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
        const p = makePlayer(players.length + 1, nextColor(players))
        set({ players: [...players, p] })
        return p.id
      },

      remove: (id) => set({ players: get().players.filter((p) => p.id !== id) }),

      rename: (id, name) =>
        set({
          players: get().players.map((p, i) =>
            // 空名不落库：桌上一个没名字的胶囊等于没有这个玩家（回填用当前语言的默认名）
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
