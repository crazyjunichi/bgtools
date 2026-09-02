import { useTranslation } from 'react-i18next'
import { ToolLayout } from '../../shared/components/ToolLayout'
import { buzz } from '../../shared/haptics'
import { IconPlay } from '../../shared/icons'
import { compile, valuesOf } from '../../shared/voice-host/compile'
import { FlowPreview } from '../../shared/voice-host/FlowPreview'
import { HostParams } from '../../shared/voice-host/HostParams'
import { HostRunner } from '../../shared/voice-host/HostRunner'
import { useVoiceHostStore } from '../../shared/voice-host/store'
import { WEREWOLF_FLOW } from './flow'

/**
 * 狼人杀主持。页面本身只有「调参 + 看流程 + 开始」，真正的主持现场是
 * [HostRunner](../../shared/voice-host/HostRunner.tsx) 那个二级浮层。
 *
 * 「开始主持」这一下点击同时是**解锁音频输出的用户手势** —— 之后由定时器发起的
 * 播报才不会被 autoplay 策略拦掉，所以流程不能自动开始。
 */
export default function WerewolfPage() {
  const { t } = useTranslation()
  const saved = useVoiceHostStore((s) => s.values[WEREWOLF_FLOW.id])
  const running = useVoiceHostStore((s) => s.flowId) === WEREWOLF_FLOW.id
  const start = useVoiceHostStore((s) => s.start)

  // 不 memo：编译只是过一遍二十来步，而 valuesOf 每次都是新对象，memo 的 deps 反而稳不下来
  const steps = compile(WEREWOLF_FLOW, valuesOf(WEREWOLF_FLOW, saved))

  return (
    <>
      <ToolLayout panel={<HostParams flow={WEREWOLF_FLOW} />}>
        <div className="flex shrink-0 items-center justify-between gap-3">
          <span className="section-label">{t(WEREWOLF_FLOW.nameKey)}</span>
          <span className="text-sm text-text-dim">
            {t('voiceHost.stepsTotal', { n: steps.length })}
          </span>
        </div>

        <FlowPreview steps={steps} />

        <button
          type="button"
          onClick={() => {
            start(WEREWOLF_FLOW)
            buzz(20)
          }}
          className="btn-base min-h-16 shrink-0 gap-2 bg-violet-400 text-xl font-bold text-ink short:!min-h-12 short:text-base"
        >
          <IconPlay className="size-6 short:size-5" aria-hidden />
          {t('voiceHost.start')}
        </button>
      </ToolLayout>

      {running && <HostRunner flow={WEREWOLF_FLOW} />}
    </>
  )
}
