import { create } from 'zustand'
import { rollDie } from '../../shared/random'

/** 少于 3 圈看不出"转起来"；总时长固定，圈数再多就糊成一片看不出指针在哪 */
const MIN_TURNS = 3
const MAX_TURNS = 5
/**
 * 全程固定 800ms，不随圈数伸缩 —— 桌上要的是立刻出结果。
 * 代价是圈数多的那几次转速更快，反正每次都随机，看不出是"变速"。
 */
export const SPIN_MS = 800

type QuickPointerState = {
  /** 累计角度，只增不减 —— 既保证每次都是顺时针，也让 CSS transition 能连续插值 */
  angle: number
  spin: () => void
}

/**
 * 不加 persist：指针没有配置项，结果又是一次性的。模块级 state 已经够
 * "关掉 dialog 再打开还停在原方向"。
 */
export const useQuickPointerStore = create<QuickPointerState>()((set, get) => ({
  angle: 0,

  spin: () => {
    const turns = MIN_TURNS + rollDie(MAX_TURNS - MIN_TURNS + 1) - 1
    // rollDie 返回 1..360，减 1 得到 0..359 的均匀方向
    const delta = rollDie(360) - 1
    set({ angle: get().angle + turns * 360 + delta })
  },
}))
