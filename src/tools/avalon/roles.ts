import type { RoleSet } from '../../shared/deal-roles/types'

/**
 * 阿瓦隆的身份与标准板子。
 *
 * emoji 刻意挑轮廓差异大的 —— 揭示卡上它是主视觉，桌上斜视时先认出形状，
 * 再读下面那行名字。
 *
 * 预置只给 5–10 人的规则书板子（好/坏 = 3/2、4/2、4/3、5/3、6/3、6/4）。
 * 派西维尔与莫甘娜始终成对出现：派西维尔要看的是「梅林与莫甘娜两个大拇指」，
 * 单上有派西维尔没有莫甘娜的板子等于直接告诉派西维尔谁是梅林。
 */
export const AVALON_ROLES: RoleSet = {
  id: 'avalon',
  nameKey: 'tools.avalon.roles.set',
  roles: [
    {
      id: 'merlin',
      nameKey: 'tools.avalon.roles.role.merlin',
      icon: '🧙',
      teamKey: 'tools.avalon.roles.team.good',
    },
    {
      id: 'percival',
      nameKey: 'tools.avalon.roles.role.percival',
      icon: '🛡️',
      teamKey: 'tools.avalon.roles.team.good',
    },
    {
      id: 'servant',
      nameKey: 'tools.avalon.roles.role.servant',
      icon: '⚔️',
      teamKey: 'tools.avalon.roles.team.good',
    },
    {
      id: 'assassin',
      nameKey: 'tools.avalon.roles.role.assassin',
      icon: '🗡️',
      teamKey: 'tools.avalon.roles.team.evil',
    },
    {
      id: 'morgana',
      nameKey: 'tools.avalon.roles.role.morgana',
      icon: '🎭',
      teamKey: 'tools.avalon.roles.team.evil',
    },
    {
      id: 'mordred',
      nameKey: 'tools.avalon.roles.role.mordred',
      icon: '👑',
      teamKey: 'tools.avalon.roles.team.evil',
    },
    {
      id: 'oberon',
      nameKey: 'tools.avalon.roles.role.oberon',
      icon: '👻',
      teamKey: 'tools.avalon.roles.team.evil',
    },
    {
      id: 'minion',
      nameKey: 'tools.avalon.roles.role.minion',
      icon: '😈',
      teamKey: 'tools.avalon.roles.team.evil',
    },
  ],
  presets: [
    { n: 5, counts: { merlin: 1, percival: 1, servant: 1, assassin: 1, morgana: 1 } },
    { n: 6, counts: { merlin: 1, percival: 1, servant: 2, assassin: 1, morgana: 1 } },
    { n: 7, counts: { merlin: 1, percival: 1, servant: 2, assassin: 1, morgana: 1, oberon: 1 } },
    { n: 8, counts: { merlin: 1, percival: 1, servant: 3, assassin: 1, morgana: 1, mordred: 1 } },
    { n: 9, counts: { merlin: 1, percival: 1, servant: 4, assassin: 1, morgana: 1, mordred: 1 } },
    {
      n: 10,
      counts: { merlin: 1, percival: 1, servant: 4, assassin: 1, morgana: 1, mordred: 1, oberon: 1 },
    },
  ],
  defaultN: 8,
}
