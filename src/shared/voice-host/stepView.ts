import type { TFunction } from 'i18next'
import type { I18nKey } from '../i18n/types'
import { IconAlarm, IconCheck, IconEye, IconSpeak, IconTimer, type LucideIcon } from '../icons'
import { formatMS } from '../time'
import type { RunStep } from './types'

/**
 * 一步的图标与读屏文字。**刻意拆成两张表**：合成一张的话，
 * 要拼 `aria-label` 的地方就会把图标组件塞进读屏文本里。
 */
export const KIND_ICON: Record<RunStep['kind'], LucideIcon> = {
  say: IconSpeak,
  wait: IconTimer,
  confirm: IconCheck,
  reveal: IconEye,
  beep: IconAlarm,
}

export const KIND_LABEL: Record<RunStep['kind'], I18nKey> = {
  say: 'voiceHost.kind.say',
  wait: 'voiceHost.kind.wait',
  confirm: 'voiceHost.kind.confirm',
  reveal: 'voiceHost.kind.reveal',
  beep: 'voiceHost.kind.beep',
}

/**
 * 这一步显示成什么。`say` 返回的正是要念出去的那句话 ——
 * 预览、运行中的大字、TTS 的入参**必须同源**，否则屏上和耳朵里会对不上。
 */
export function stepText(step: RunStep, t: TFunction): string {
  if (step.kind === 'say') {
    // t() 是按字面 key 反推插值参数名的，key 和参数都来自流程数据时推不出来，
    // 只能就地收窄成最朴素的签名（参数名对不上只会原样留着 {{x}}，不会崩）
    const say = t as (key: I18nKey, vars: Record<string, number>) => string
    return say(step.textKey, step.vars)
  }
  if (step.kind === 'confirm' || step.kind === 'reveal') return t(step.textKey)
  if (step.kind === 'wait') return formatMS(step.sec * 1000)
  return t(KIND_LABEL.beep)
}
