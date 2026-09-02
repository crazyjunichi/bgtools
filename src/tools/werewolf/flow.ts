import type { HostFlow } from '../../shared/voice-host/types'

/**
 * 标准夜晚 + 白天一轮的主持流程，语音主持人的第一个使用者。
 *
 * 两条判据决定了每个环节用哪种步骤：
 * - 角色环节用 `wait`（法官不在场，桌上靠固定时长推进；睁眼/闭眼之间要留够动作时间）
 * - **内容动态的一律用 `confirm`** —— 昨晚谁死了、投票放逐谁，TTS 说不出来，
 *   只能停下来等主持人自己说完再点继续
 *
 * 狼人环节没有 `when`：没有狼就不是这个游戏了。
 */
export const WEREWOLF_FLOW: HostFlow = {
  id: 'werewolf',
  nameKey: 'tools.werewolf.flow',
  params: [
    { id: 'guard', kind: 'toggle', labelKey: 'tools.werewolf.param.guard', def: true },
    { id: 'witch', kind: 'toggle', labelKey: 'tools.werewolf.param.witch', def: true },
    { id: 'seer', kind: 'toggle', labelKey: 'tools.werewolf.param.seer', def: true },
    { id: 'hunter', kind: 'toggle', labelKey: 'tools.werewolf.param.hunter', def: false },
    {
      id: 'roleSec',
      kind: 'sec',
      labelKey: 'tools.werewolf.param.roleSec',
      def: 15,
      min: 5,
      max: 60,
      step: 5,
    },
    {
      id: 'daySec',
      kind: 'sec',
      labelKey: 'tools.werewolf.param.daySec',
      def: 180,
      min: 30,
      max: 600,
      step: 30,
    },
  ],
  steps: [
    { kind: 'say', textKey: 'tools.werewolf.say.nightFall' },

    { kind: 'say', textKey: 'tools.werewolf.say.guardOpen', when: 'guard' },
    { kind: 'wait', sec: { param: 'roleSec' }, when: 'guard' },
    { kind: 'say', textKey: 'tools.werewolf.say.guardClose', when: 'guard' },

    { kind: 'say', textKey: 'tools.werewolf.say.wolvesOpen' },
    { kind: 'wait', sec: { param: 'roleSec' } },
    { kind: 'say', textKey: 'tools.werewolf.say.wolvesClose' },

    { kind: 'say', textKey: 'tools.werewolf.say.witchOpen', when: 'witch' },
    { kind: 'wait', sec: { param: 'roleSec' }, when: 'witch' },
    { kind: 'say', textKey: 'tools.werewolf.say.witchClose', when: 'witch' },

    { kind: 'say', textKey: 'tools.werewolf.say.seerOpen', when: 'seer' },
    { kind: 'wait', sec: { param: 'roleSec' }, when: 'seer' },
    { kind: 'say', textKey: 'tools.werewolf.say.seerClose', when: 'seer' },

    { kind: 'say', textKey: 'tools.werewolf.say.hunterOpen', when: 'hunter' },
    { kind: 'wait', sec: { param: 'roleSec' }, when: 'hunter' },
    { kind: 'say', textKey: 'tools.werewolf.say.hunterClose', when: 'hunter' },

    // 提示音先响：夜里大家闭着眼，一声提示比直接开口更能把人叫回来
    { kind: 'beep' },
    { kind: 'say', textKey: 'tools.werewolf.say.dayBreak' },
    { kind: 'confirm', textKey: 'tools.werewolf.do.announceDeaths' },

    { kind: 'say', textKey: 'tools.werewolf.say.discuss', vars: { n: { param: 'daySec' } } },
    { kind: 'wait', sec: { param: 'daySec' } },
    { kind: 'beep' },
    { kind: 'say', textKey: 'tools.werewolf.say.vote' },
    { kind: 'confirm', textKey: 'tools.werewolf.do.announceVote' },

    { kind: 'say', textKey: 'tools.werewolf.say.roundEnd' },
  ],
}
