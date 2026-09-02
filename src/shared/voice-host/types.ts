import type { I18nKey } from '../i18n/types'

/**
 * 一个数字参数的取值：写死的常量，或指向本流程 `params` 里某一项。
 * 有了这层间接，流程骨架能在代码里定死，而少数几个数值留给桌上现调。
 */
export type NumRef = number | { param: string }

/**
 * 流程里的一步。**只有这四种**，刻意不做嵌套分组、重复 N 次与并行倒计时 ——
 * 保持扁平数组，进度就是「第几步 / 共几步」，不必展开计算。
 */
export type HostStep =
  /** TTS 念出来。文案是要**念**的，不是屏幕标签，写口语 */
  | { kind: 'say'; textKey: I18nKey; vars?: Record<string, NumRef> }
  | { kind: 'wait'; sec: NumRef }
  /**
   * 停下来等主持人点按钮。`textKey` 是**给主持人看的指令**（此刻该说什么），
   * 不播报 —— 这一步存在的理由正是内容动态、TTS 说不出来（谁死了、投票结果）
   */
  | { kind: 'confirm'; textKey: I18nKey }
  | { kind: 'beep' }

/**
 * `when` 指向一个 toggle 参数：关掉就整步跳过。
 * 一个环节由多步组成时（睁眼 / 等待 / 闭眼）就给这几步挂同一个 `when`。
 */
export type FlowStep = HostStep & { when?: string }

/** 用户能在宿主页里调的参数。`def` 是声明的默认值，用户没动过就用它 */
export type HostParam =
  | {
      id: string
      kind: 'sec'
      labelKey: I18nKey
      def: number
      min: number
      max: number
      step: number
    }
  | { id: string; kind: 'toggle'; labelKey: I18nKey; def: boolean }

/**
 * 一款游戏的一套主持流程。**纯数据常量，存 key 不存文案** ——
 * 它在模块顶层求值拿不到 hook，由消费方在渲染期 `t()`，切语言才会立刻跟着变。
 */
export type HostFlow = {
  id: string
  nameKey: I18nKey
  params: readonly HostParam[]
  steps: readonly FlowStep[]
}

export type ParamValues = Record<string, number | boolean>

/**
 * 编译后的步骤：`when` 已过滤掉、`NumRef` 已解成具体数字。
 * 运行引擎只吃这个，因此它完全不知道参数系统的存在。
 */
export type RunStep =
  | { kind: 'say'; textKey: I18nKey; vars: Record<string, number> }
  | { kind: 'wait'; sec: number }
  | { kind: 'confirm'; textKey: I18nKey }
  | { kind: 'beep' }
