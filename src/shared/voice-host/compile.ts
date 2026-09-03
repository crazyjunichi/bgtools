import type { HostFlow, NumRef, ParamValues, RunStep } from './types'

/**
 * 生效的参数值：用户调过的优先，**逐项**回落到声明的默认值。
 *
 * 逐项而不是「整份缺就整份用默认」：后者在给流程补一个新参数时会让存档里
 * 已经调好的其余几项一起失效。
 */
export function valuesOf(flow: HostFlow, saved: ParamValues | undefined): ParamValues {
  const out: ParamValues = {}
  for (const p of flow.params) out[p.id] = saved?.[p.id] ?? p.def
  return out
}

function num(ref: NumRef, values: ParamValues): number {
  if (typeof ref === 'number') return ref
  const v = values[ref.param]
  return typeof v === 'number' ? v : 0
}

/**
 * 把流程骨架 + 参数值编译成可跑的扁平步骤。
 *
 * 宿主页的流程预览与实跑**共用这一个函数**，所以预览里看到的步数和顺序
 * 就是真会跑的那份，不会对不上。
 */
export function compile(flow: HostFlow, values: ParamValues): RunStep[] {
  const out: RunStep[] = []
  for (const step of flow.steps) {
    if (step.when !== undefined && values[step.when] !== true) continue
    if (step.kind === 'say') {
      const vars: Record<string, number> = {}
      for (const [k, ref] of Object.entries(step.vars ?? {})) vars[k] = num(ref, values)
      out.push({ kind: 'say', textKey: step.textKey, vars })
    } else if (step.kind === 'wait') {
      out.push({ kind: 'wait', sec: num(step.sec, values) })
    } else if (step.kind === 'confirm') {
      out.push({ kind: 'confirm', textKey: step.textKey })
    } else if (step.kind === 'reveal') {
      out.push({ kind: 'reveal', textKey: step.textKey })
    } else {
      out.push({ kind: 'beep' })
    }
  }
  return out
}
