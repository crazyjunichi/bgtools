import type { HostFlow } from '../../shared/voice-host/types'

/**
 * 阿瓦隆的开局认身份夜。一局只主持这一段 —— 之后的组队、投票、任务
 * 内容动态且桌上自己推得动，恰恰是这段口诀每局必念、人人会忘。
 *
 * `when` 只能正向门控一个 toggle，所以差异文案全部拆成独立的插入句：
 * 莫德雷德在场就多一句「请放下大拇指」，奥伯伦在场就多一句「请保持闭眼」，
 * 主句保持无条件。派西维尔环节整段挂 `percival`（与莫甘娜绑定，见 roles.ts）。
 */
export const AVALON_FLOW: HostFlow = {
  id: 'avalon',
  nameKey: 'tools.avalon.flow',
  params: [
    { id: 'percival', kind: 'toggle', labelKey: 'tools.avalon.param.percival', def: true },
    { id: 'mordred', kind: 'toggle', labelKey: 'tools.avalon.param.mordred', def: false },
    { id: 'oberon', kind: 'toggle', labelKey: 'tools.avalon.param.oberon', def: false },
    {
      id: 'roleSec',
      kind: 'sec',
      labelKey: 'tools.avalon.param.roleSec',
      def: 15,
      min: 5,
      max: 60,
      step: 5,
    },
  ],
  steps: [
    { kind: 'say', textKey: 'tools.avalon.say.nightFall' },

    { kind: 'say', textKey: 'tools.avalon.say.oberonStay', when: 'oberon' },
    { kind: 'say', textKey: 'tools.avalon.say.minionsOpen' },
    { kind: 'wait', sec: { param: 'roleSec' } },
    { kind: 'say', textKey: 'tools.avalon.say.minionsClose' },

    { kind: 'say', textKey: 'tools.avalon.say.thumbsUp' },
    { kind: 'say', textKey: 'tools.avalon.say.mordredDown', when: 'mordred' },
    { kind: 'say', textKey: 'tools.avalon.say.merlinOpen' },
    { kind: 'wait', sec: { param: 'roleSec' } },
    { kind: 'say', textKey: 'tools.avalon.say.merlinClose' },

    { kind: 'say', textKey: 'tools.avalon.say.percivalOpen', when: 'percival' },
    { kind: 'wait', sec: { param: 'roleSec' }, when: 'percival' },
    { kind: 'say', textKey: 'tools.avalon.say.percivalClose', when: 'percival' },

    // 提示音先响：夜里大家闭着眼，一声提示比直接开口更能把人叫回来
    { kind: 'beep' },
    { kind: 'say', textKey: 'tools.avalon.say.dayBreak' },
  ],
}
