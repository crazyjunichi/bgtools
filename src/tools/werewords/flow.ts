import type { HostFlow } from '../../shared/voice-host/types'

/**
 * 狼人真言的一局：夜里三次屏幕显词（村长 / 狼人 / 先知），白天限时向村长提问。
 *
 * 词**永远不进 say 步** —— TTS 一念全场都听见了，所以显词全是 reveal（屏显不播报）。
 * 结局判定（猜中与否、指认谁）内容动态，照例是 confirm 留给主持人口播。
 */
export const WEREWORDS_FLOW: HostFlow = {
  id: 'werewords',
  nameKey: 'tools.werewords.flow',
  params: [
    {
      id: 'daySec',
      kind: 'sec',
      labelKey: 'tools.werewords.param.daySec',
      def: 240,
      min: 60,
      max: 600,
      step: 30,
    },
  ],
  steps: [
    { kind: 'say', textKey: 'tools.werewords.say.nightFall' },
    { kind: 'reveal', textKey: 'tools.werewords.reveal.mayor' },
    { kind: 'say', textKey: 'tools.werewords.say.mayorClose' },
    { kind: 'reveal', textKey: 'tools.werewords.reveal.wolves' },
    { kind: 'say', textKey: 'tools.werewords.say.wolvesClose' },
    { kind: 'reveal', textKey: 'tools.werewords.reveal.seer' },
    { kind: 'say', textKey: 'tools.werewords.say.seerClose' },

    // 提示音先响：夜里大家闭着眼，一声提示比直接开口更能把人叫回来
    { kind: 'beep' },
    { kind: 'say', textKey: 'tools.werewords.say.dayBreak' },
    { kind: 'say', textKey: 'tools.werewords.say.discuss', vars: { n: { param: 'daySec' } } },
    { kind: 'wait', sec: { param: 'daySec' } },
    { kind: 'beep' },
    { kind: 'say', textKey: 'tools.werewords.say.timeUp' },
    { kind: 'confirm', textKey: 'tools.werewords.do.ending' },
  ],
}
