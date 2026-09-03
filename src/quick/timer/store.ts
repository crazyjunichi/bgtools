import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const PRESETS = [30, 60, 120, 300] as const
/** 显示刷新与到时判定共用一档：到时误差上限就是这个值，250ms 肉眼看不出 */
export const TICK_MS = 250
// 下限跟 STEP_SEC 对齐，否则步进出来的值全是 35 / 65 这种零头
export const MIN_SEC = 30
export const MAX_SEC = 3600
export const STEP_SEC = 10

type QuickTimerState = {
  durationSec: number
  /** 运行中的绝对结束时刻。存时刻而非累减剩余秒：后台节流会让累减漂移 */
  endAt: number | null
  /** 暂停时冻结的剩余毫秒 */
  remainMs: number | null
  alarming: boolean
  setDuration: (sec: number) => void
  start: (sec?: number) => void
  pause: () => void
  resume: () => void
  cancel: () => void
  /** 到时：由常驻的 QuickLayer 判定后调用，副作用（震动/提示音）留在调用方 */
  fire: () => void
  dismiss: () => void
}

export const useQuickTimerStore = create<QuickTimerState>()(
  persist(
    (set, get) => ({
      durationSec: 60,
      endAt: null,
      remainMs: null,
      alarming: false,

      setDuration: (sec) => set({ durationSec: sec }),

      start: (sec) => {
        const durationSec = sec ?? get().durationSec
        set({
          durationSec,
          endAt: Date.now() + durationSec * 1000,
          remainMs: null,
          alarming: false,
        })
      },

      pause: () => {
        const { endAt } = get()
        if (endAt === null) return
        set({ endAt: null, remainMs: Math.max(0, endAt - Date.now()) })
      },

      resume: () => {
        const { remainMs } = get()
        if (remainMs === null) return
        set({ endAt: Date.now() + remainMs, remainMs: null })
      },

      cancel: () => set({ endAt: null, remainMs: null, alarming: false }),

      fire: () => set({ endAt: null, remainMs: null, alarming: true }),

      dismiss: () => set({ alarming: false }),
    }),
    {
      name: 'bgtools:quick-timer',
      // 只存时长偏好：刷新后还在跑的计时恢复出来只会误导人
      partialize: ({ durationSec }) => ({ durationSec }),
    },
  ),
)
