import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STATUSES } from './statuses'

const LOOT_MAX = 99
export const TEMP_HP_MIN = 1
export const TEMP_HP_MAX = 30

/**
 * 局内面板状态 —— 只活一场的东西：当前血、**本场**经验/金币、挂着的状态。
 * 跨局的角色数据（总经验/金币/perk/物品）在 [sheets.ts](sheets.ts) 的 IDB 库里，
 * 两边唯一的桥是「结算」按钮把本场经验与金币加进角色纸。
 */
type PanelState = {
  /** 绑定的角色纸 id；null + temp=false = 还在选人界面 */
  sheetId: string | null
  /** 不用角色纸的临时模式：血量上限手动调 */
  temp: boolean
  tempMaxHp: number
  hp: number
  /** 本场经验（规则：场景结束才加进总经验） */
  xp: number
  /** 本场金币（loot token 边摸边记，结算时入角色纸） */
  gold: number
  /** statusId → 层数；0 层不存键 */
  statuses: Record<string, number>

  /** 选用一张角色纸开局：满血、清场 */
  bindSheet: (sheetId: string, maxHp: number) => void
  startTemp: () => void
  /** 回选人界面（换角色/管理角色纸） */
  quitToPicker: () => void
  setTempMaxHp: (n: number) => void
  bumpHp: (delta: number, max: number) => void
  bumpXp: (delta: number) => void
  bumpGold: (delta: number) => void
  /** 0 即移除；上限按 statuses.ts 每种的 max */
  setStatus: (statusId: string, count: number) => void
  /** 结算回写后清掉本场经验/金币转盘（不清会二次结算重复加） */
  clearLoot: () => void
  /** 新一场：满血、清本场收获与状态，保留角色纸绑定 */
  newScenario: (maxHp: number) => void
}

const statusMax = (id: string) => STATUSES.find((s) => s.id === id)?.max ?? 1

export const useGhStore = create<PanelState>()(
  persist(
    (set, get) => ({
      sheetId: null,
      temp: false,
      tempMaxHp: 10,
      hp: 10,
      xp: 0,
      gold: 0,
      statuses: {},

      bindSheet: (sheetId, maxHp) =>
        set({ sheetId, temp: false, hp: maxHp, xp: 0, gold: 0, statuses: {} }),

      startTemp: () =>
        set({ sheetId: null, temp: true, hp: get().tempMaxHp, xp: 0, gold: 0, statuses: {} }),

      quitToPicker: () => set({ sheetId: null, temp: false }),

      setTempMaxHp: (n) => {
        const tempMaxHp = Math.min(Math.max(n, TEMP_HP_MIN), TEMP_HP_MAX)
        // 定档即回满：这是开局调档的入口，局中调它等于手动改当前血
        set({ tempMaxHp, hp: tempMaxHp })
      },

      bumpHp: (delta, max) => {
        if (!delta) return
        const hp = Math.min(Math.max(get().hp + delta, 0), max)
        if (hp !== get().hp) set({ hp })
      },

      bumpXp: (delta) => {
        const xp = Math.min(Math.max(get().xp + delta, 0), LOOT_MAX)
        if (xp !== get().xp) set({ xp })
      },

      bumpGold: (delta) => {
        const gold = Math.min(Math.max(get().gold + delta, 0), LOOT_MAX)
        if (gold !== get().gold) set({ gold })
      },

      setStatus: (statusId, count) => {
        const statuses = { ...get().statuses }
        const n = Math.min(Math.max(count, 0), statusMax(statusId))
        if (n > 0) statuses[statusId] = n
        else delete statuses[statusId]
        set({ statuses })
      },

      newScenario: (maxHp) => set({ hp: maxHp, xp: 0, gold: 0, statuses: {} }),

      clearLoot: () => set({ xp: 0, gold: 0 }),
    }),
    { name: 'bgtools:gloomhaven' },
  ),
)
