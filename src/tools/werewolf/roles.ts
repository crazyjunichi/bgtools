import type { RoleSet } from '../../shared/deal-roles/types'

/**
 * 狼人杀的身份与常见板子，发身份引擎的第一个使用者。
 *
 * 与 [flow.ts](flow.ts) 同一个分工：**引擎在 shared，这里只出数据**。
 * emoji 刻意挑轮廓差异大的 —— 揭示卡上它是主视觉，桌上斜视时先认出形状，
 * 再读下面那行名字。
 *
 * 预置只给 5–12 人的连续档（奇数不缺：桌上来几个人不由板子决定）。
 * 白痴不进任何一档 —— 它是加料板才上的，留给手动加一张。
 */
export const WEREWOLF_ROLES: RoleSet = {
  id: 'werewolf',
  nameKey: 'tools.werewolf.roles.set',
  roles: [
    {
      id: 'wolf',
      nameKey: 'tools.werewolf.roles.role.wolf',
      icon: '🐺',
      teamKey: 'tools.werewolf.roles.team.wolf',
    },
    {
      id: 'villager',
      nameKey: 'tools.werewolf.roles.role.villager',
      icon: '👤',
      teamKey: 'tools.werewolf.roles.team.village',
    },
    {
      id: 'seer',
      nameKey: 'tools.werewolf.roles.role.seer',
      icon: '🔮',
      teamKey: 'tools.werewolf.roles.team.village',
    },
    {
      id: 'witch',
      nameKey: 'tools.werewolf.roles.role.witch',
      icon: '🧪',
      teamKey: 'tools.werewolf.roles.team.village',
    },
    {
      id: 'hunter',
      nameKey: 'tools.werewolf.roles.role.hunter',
      icon: '🏹',
      teamKey: 'tools.werewolf.roles.team.village',
    },
    {
      id: 'guard',
      nameKey: 'tools.werewolf.roles.role.guard',
      icon: '🛡️',
      teamKey: 'tools.werewolf.roles.team.village',
    },
    {
      id: 'idiot',
      nameKey: 'tools.werewolf.roles.role.idiot',
      icon: '🃏',
      teamKey: 'tools.werewolf.roles.team.village',
    },
  ],
  presets: [
    { n: 5, counts: { wolf: 2, villager: 1, seer: 1, witch: 1 } },
    { n: 6, counts: { wolf: 2, villager: 2, seer: 1, witch: 1 } },
    { n: 7, counts: { wolf: 2, villager: 2, seer: 1, witch: 1, hunter: 1 } },
    { n: 8, counts: { wolf: 3, villager: 3, seer: 1, witch: 1 } },
    { n: 9, counts: { wolf: 3, villager: 3, seer: 1, witch: 1, hunter: 1 } },
    { n: 10, counts: { wolf: 3, villager: 4, seer: 1, witch: 1, hunter: 1 } },
    { n: 11, counts: { wolf: 3, villager: 4, seer: 1, witch: 1, hunter: 1, guard: 1 } },
    { n: 12, counts: { wolf: 4, villager: 4, seer: 1, witch: 1, hunter: 1, guard: 1 } },
  ],
  defaultN: 10,
}
