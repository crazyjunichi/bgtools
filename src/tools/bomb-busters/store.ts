import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { I18nKey } from '../../shared/i18n/types'

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 5
export const MAX_LIVES = 6
/** 线缆编号 1–12，每个编号的三态与人数无关 */
export const WIRE_COUNT = 12

/** 拆弹与装备都是点击循环的三态，共用底层类型 */
type TriState = 0 | 1 | 2
/** 0 未拆过 / 1 拆了一半 / 2 全部拆完 */
export type DefuseState = TriState
/** 0 未激活（使用条件未满足）/ 1 可用 / 2 已用 */
export type EquipState = TriState

export type Equipment = {
  id: string
  /** 实物卡上的编号，卡面右侧大字显示，方便和桌上的牌对上 */
  no: number
  /** 存 key 而不存文案：本表在模块顶层求值，文案由 EquipmentList 在渲染期 t() */
  nameKey: I18nKey
  descKey: I18nKey
  icon: string
  /** 激活所需拆弹进度：1 拆过一次即激活；2 须全拆完（高级装备），缺省 1 */
  activateAt?: 1 | 2
}

/**
 * 装备卡 1–12。卡名与描述见 [locales/zh](../../shared/i18n/locales/zh.ts) 的
 * `tools.bombBusters.equip.*`。
 * icon 刻意避开同类形状（三个探测类分别用 🔍/🔬/📡），斜视下靠轮廓就能认。
 */
export const EQUIPMENT_POOL: Equipment[] = [
  { id: 'e1', no: 1, nameKey: 'tools.bombBusters.equip.e1.name', descKey: 'tools.bombBusters.equip.e1.desc', icon: '🏷️' },
  { id: 'e2', no: 2, nameKey: 'tools.bombBusters.equip.e2.name', descKey: 'tools.bombBusters.equip.e2.desc', icon: '📻' },
  { id: 'e3', no: 3, nameKey: 'tools.bombBusters.equip.e3.name', descKey: 'tools.bombBusters.equip.e3.desc', icon: '🔍' },
  { id: 'e4', no: 4, nameKey: 'tools.bombBusters.equip.e4.name', descKey: 'tools.bombBusters.equip.e4.desc', icon: '📝' },
  { id: 'e5', no: 5, nameKey: 'tools.bombBusters.equip.e5.name', descKey: 'tools.bombBusters.equip.e5.desc', icon: '🔬' },
  { id: 'e6', no: 6, nameKey: 'tools.bombBusters.equip.e6.name', descKey: 'tools.bombBusters.equip.e6.desc', icon: '⏪' },
  { id: 'e7', no: 7, nameKey: 'tools.bombBusters.equip.e7.name', descKey: 'tools.bombBusters.equip.e7.desc', icon: '🔋' },
  { id: 'e8', no: 8, nameKey: 'tools.bombBusters.equip.e8.name', descKey: 'tools.bombBusters.equip.e8.desc', icon: '📡' },
  { id: 'e9', no: 9, nameKey: 'tools.bombBusters.equip.e9.name', descKey: 'tools.bombBusters.equip.e9.desc', icon: '🛡️' },
  { id: 'e10', no: 10, nameKey: 'tools.bombBusters.equip.e10.name', descKey: 'tools.bombBusters.equip.e10.desc', icon: '☢️' },
  { id: 'e11', no: 11, nameKey: 'tools.bombBusters.equip.e11.name', descKey: 'tools.bombBusters.equip.e11.desc', icon: '☕' },
  { id: 'e12', no: 12, nameKey: 'tools.bombBusters.equip.e12.name', descKey: 'tools.bombBusters.equip.e12.desc', icon: '🟰' },
]

export function findEquipment(id: string): Equipment | undefined {
  return EQUIPMENT_POOL.find((e) => e.id === id)
}

export type HandCard = { equipId: string; state: EquipState }

/**
 * 用 crypto 而非 Math.random：装备发放的公平性玩家会当场质疑。
 * 拒绝采样丢弃尾部不完整区间，避免取模引入分布偏差。
 */
function randomIndex(max: number): number {
  const buf = new Uint32Array(1)
  const limit = Math.floor(0x1_0000_0000 / max) * max
  let x: number
  do {
    crypto.getRandomValues(buf)
    x = buf[0]
  } while (x >= limit)
  return x % max
}

/** 部分 Fisher–Yates：只洗出前 n 张，保证不重复 */
function pickDistinct<T>(pool: readonly T[], n: number): T[] {
  const rest = [...pool]
  const picked: T[] = []
  const take = Math.min(n, rest.length)
  for (let i = 0; i < take; i++) {
    const j = i + randomIndex(rest.length - i)
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
    picked.push(rest[i])
  }
  return picked
}

/** 装备牌数量 = 人数，发放后一律回到「未激活」 */
function deal(players: number): HandCard[] {
  return pickDistinct(EQUIPMENT_POOL, players).map((e) => ({ equipId: e.id, state: 0 as const }))
}

const emptyWires = (): DefuseState[] => Array.from({ length: WIRE_COUNT }, () => 0 as const)

const nextState = (s: TriState): TriState => ((s + 1) % 3) as TriState

type BombBustersState = {
  players: number
  /** 初始 = 人数，可增减，上限 MAX_LIVES */
  lives: number
  /** 下标 i 对应线缆编号 i+1 */
  wires: DefuseState[]
  hand: HandCard[]
  /** 切换人数即开新一局：重置生命、重发装备、清空拆弹进度 */
  setPlayers: (players: number) => void
  setLives: (lives: number) => void
  cycleWire: (index: number) => void
  cycleEquip: (index: number) => void
  dealEquipment: () => void
  resetGame: () => void
}

const DEFAULT_PLAYERS = 3

export const useBombBustersStore = create<BombBustersState>()(
  persist(
    (set, get) => ({
      players: DEFAULT_PLAYERS,
      lives: DEFAULT_PLAYERS,
      wires: emptyWires(),
      hand: deal(DEFAULT_PLAYERS),

      setPlayers: (players) =>
        set({ players, lives: players, wires: emptyWires(), hand: deal(players) }),

      setLives: (lives) => set({ lives }),

      cycleWire: (index) =>
        set((state) => {
          const wires = state.wires.map((s, i) => (i === index ? nextState(s) : s))
          const reached = wires[index]
          // 线缆编号与装备卡 no 对应：拆到门槛且手牌中该卡未激活则自动激活。
          // 只单向联动：线缆循环回未拆不回退（分不清撤销误点与继续循环）
          const hand = state.hand.map((c) => {
            const equip = findEquipment(c.equipId)
            return c.state === 0 && equip?.no === index + 1 && reached >= (equip.activateAt ?? 1)
              ? { ...c, state: 1 as const }
              : c
          })
          return { wires, hand }
        }),

      cycleEquip: (index) =>
        set({
          hand: get().hand.map((c, i) => (i === index ? { ...c, state: nextState(c.state) } : c)),
        }),

      dealEquipment: () => set({ hand: deal(get().players) }),

      resetGame: () => {
        const { players } = get()
        set({ lives: players, wires: emptyWires(), hand: deal(players) })
      },
    }),
    {
      name: 'bgtools:bomb-busters',
      partialize: ({ players, lives, wires, hand }) => ({ players, lives, wires, hand }),
    },
  ),
)
