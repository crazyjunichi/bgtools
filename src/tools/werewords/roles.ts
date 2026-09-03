import type { RoleSet } from '../../shared/deal-roles/types'

/**
 * 狼人真言的身份与板子。
 *
 * **没有「村长」这张牌**：村长是职责不是身份，由桌上自己定 ——
 * 村长本人也从这堆牌里拿一张（他可能是狼人，那就有意思了）。
 *
 * 预置只给 4–10 人（规则书的人数区间），7 人起加第二只狼。
 */
export const WEREWORDS_ROLES: RoleSet = {
  id: 'werewords',
  nameKey: 'tools.werewords.roles.set',
  roles: [
    {
      id: 'wolf',
      nameKey: 'tools.werewords.roles.role.wolf',
      icon: '🐺',
      teamKey: 'tools.werewords.roles.team.wolf',
    },
    {
      id: 'seer',
      nameKey: 'tools.werewords.roles.role.seer',
      icon: '🔮',
      teamKey: 'tools.werewords.roles.team.village',
    },
    {
      id: 'villager',
      nameKey: 'tools.werewords.roles.role.villager',
      icon: '👤',
      teamKey: 'tools.werewords.roles.team.village',
    },
  ],
  presets: [
    { n: 4, counts: { wolf: 1, seer: 1, villager: 2 } },
    { n: 5, counts: { wolf: 1, seer: 1, villager: 3 } },
    { n: 6, counts: { wolf: 1, seer: 1, villager: 4 } },
    { n: 7, counts: { wolf: 2, seer: 1, villager: 4 } },
    { n: 8, counts: { wolf: 2, seer: 1, villager: 5 } },
    { n: 9, counts: { wolf: 2, seer: 1, villager: 6 } },
    { n: 10, counts: { wolf: 2, seer: 1, villager: 7 } },
  ],
  defaultN: 6,
}
