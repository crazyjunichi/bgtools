import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { compile, valuesOf } from './compile'
import type { HostFlow, ParamValues, RunStep } from './types'

/** 倒计时的刷新与到时判定共用一档：到时误差上限就是这个值 */
export const TICK_MS = 250

/**
 * 语音主持人的状态。**参数值持久化，运行态不持久化** ——
 * 刷新后还接着播一半的流程只会让桌上莫名其妙。
 *
 * 这里只管状态，不碰副作用：念哪句、什么时候响提示音全在
 * [HostRunner](HostRunner.tsx) 的推进 effect 里。
 */
type VoiceHostState = {
  /**
   * flowId -> 用户调过的参数值。按 flowId 分组，新增一款游戏不会跟已有参数撞 id；
   * 只存用户动过的那几项，没动的在 [valuesOf](compile.ts) 里逐项回落到声明默认值
   */
  values: Record<string, ParamValues>

  /** 正在跑的流程 id。null = 没在跑，运行浮层不显示 */
  flowId: string | null
  steps: RunStep[]
  /** 当前步下标。`=== steps.length` 表示跑完了 */
  index: number
  /** `wait` 步的绝对结束时刻。存时刻而非累减剩余：后台节流会让累减漂移 */
  endAt: number | null
  /** 暂停时冻结的剩余毫秒（只有 `wait` 步有） */
  remainMs: number | null
  paused: boolean

  setParam: (flowId: string, paramId: string, value: number | boolean) => void
  start: (flow: HostFlow) => void
  /** 推进一步。自动推进（念完 / 到时）与手动「跳过」是同一个动作 */
  next: () => void
  restart: () => void
  pause: () => void
  resume: () => void
  stop: () => void
}

/**
 * 进入某一步时要落的状态。`wait` 步在这里就把结束时刻算好 ——
 * 等渲染完再算会把渲染耗时算进倒计时。
 */
function enterAt(steps: RunStep[], index: number) {
  const step = steps[index]
  return {
    index,
    endAt: step?.kind === 'wait' ? Date.now() + step.sec * 1000 : null,
    remainMs: null,
  }
}

export const useVoiceHostStore = create<VoiceHostState>()(
  persist(
    (set, get) => ({
      values: {},
      flowId: null,
      steps: [],
      index: 0,
      endAt: null,
      remainMs: null,
      paused: false,

      setParam: (flowId, paramId, value) => {
        const { values } = get()
        set({ values: { ...values, [flowId]: { ...values[flowId], [paramId]: value } } })
      },

      start: (flow) => {
        const steps = compile(flow, valuesOf(flow, get().values[flow.id]))
        set({ flowId: flow.id, steps, paused: false, ...enterAt(steps, 0) })
      },

      next: () => {
        const { steps, index } = get()
        set({ paused: false, ...enterAt(steps, Math.min(index + 1, steps.length)) })
      },

      restart: () => set({ paused: false, ...enterAt(get().steps, 0) }),

      /**
       * 暂停。`wait` 步冻结剩余毫秒；`say` 步靠推进 effect 的 cleanup 掐断当前语音，
       * 恢复时**整句重念** —— 比 `speechSynthesis.pause()` 可靠（iOS 上那个基本不生效），
       * 而且漏听了本来就该重听。
       */
      pause: () => {
        const { endAt, paused } = get()
        if (paused) return
        set({
          paused: true,
          endAt: null,
          remainMs: endAt === null ? null : Math.max(0, endAt - Date.now()),
        })
      },

      resume: () => {
        const { remainMs, paused } = get()
        if (!paused) return
        set({
          paused: false,
          endAt: remainMs === null ? null : Date.now() + remainMs,
          remainMs: null,
        })
      },

      stop: () => set({ flowId: null, steps: [], index: 0, endAt: null, remainMs: null, paused: false }),
    }),
    {
      name: 'bgtools:voice-host',
      partialize: ({ values }) => ({ values }),
    },
  ),
)
