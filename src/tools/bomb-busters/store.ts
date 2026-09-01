import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 5
export const MAX_LIVES = 6
/** 线缆编号 1–12，每个编号的三态与人数无关 */
export const WIRE_COUNT = 12

/** 拆弹与道具都是点击循环的三态，共用底层类型 */
type TriState = 0 | 1 | 2
/** 0 未拆过 / 1 拆了一半 / 2 全部拆完 */
export type DefuseState = TriState
/** 0 未激活（使用条件未满足）/ 1 可用 / 2 已用 */
export type EquipState = TriState

export type Equipment = {
  id: string
  /** 实物卡上的编号，卡面右侧大字显示，方便和桌上的牌对上 */
  no: number
  name: string
  desc: string
  icon: string
}

/**
 * 装备卡 1–12。desc 只写核心动作 —— 道具栏窄且 line-clamp-2，
 * 中文超过约 28 字就会被截断，完整措辞看桌上实物卡。
 * icon 刻意避开同类形状（三个探测类分别用 🔍/🔬/📡），斜视下靠轮廓就能认。
 */
export const EQUIPMENT_POOL: Equipment[] = [
  { id: 'e1', no: 1, name: '标签 ≠', desc: '在两根号码不同的相邻导线间放 ≠ 指示物', icon: '🏷️' },
  { id: 'e2', no: 2, name: '对讲机', desc: '与一名玩家各交换一根未剪断的导线', icon: '📻' },
  { id: 'e3', no: 3, name: '三重探测器', desc: '探测队友底座上指定的 3 根导线', icon: '🔍' },
  { id: 'e4', no: 4, name: '便利贴', desc: '在自己一根蓝线前放「危险」指示物', icon: '📝' },
  { id: 'e5', no: 5, name: '超级探测器', desc: '探测队友整个底座上的所有导线', icon: '🔬' },
  { id: 'e6', no: 6, name: '抑制器', desc: '起爆器指针倒退一格', icon: '⏪' },
  { id: 'e7', no: 7, name: '备用电池', desc: '翻回 1–2 张已用的角色能力牌', icon: '🔋' },
  { id: 'e8', no: 8, name: '通用雷达', desc: '报一个号码，有该号蓝线的人须应「有」', icon: '📡' },
  { id: 'e9', no: 9, name: '稳定器', desc: '本回合指针不动、红线不炸', icon: '🛡️' },
  { id: 'e10', no: 10, name: 'X/Y 射线', desc: '指定 1 根导线时可同时报两个号码', icon: '☢️' },
  { id: 'e11', no: 11, name: '咖啡瓶', desc: '跳过本回合，并指定下一位行动的玩家', icon: '☕' },
  { id: 'e12', no: 12, name: '标签 =', desc: '在自己两根号码相同的相邻导线前放 = 指示物', icon: '🟰' },
]

export function findEquipment(id: string): Equipment | undefined {
  return EQUIPMENT_POOL.find((e) => e.id === id)
}

export type HandCard = { equipId: string; state: EquipState }

/**
 * 用 crypto 而非 Math.random：道具发放的公平性玩家会当场质疑。
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

/** 道具牌数量 = 人数，发放后一律回到「未激活」 */
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
  /** 切换人数即开新一局：重置生命、重发道具、清空拆弹进度 */
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
        set({ wires: get().wires.map((s, i) => (i === index ? nextState(s) : s)) }),

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
