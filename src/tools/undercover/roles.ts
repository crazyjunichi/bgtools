import type { RolePreset, RoleSet } from '../../shared/deal-roles/types'

// 3 人（2 民 1 卧）起能玩；人多后单卧底太容易暴露，8 人起加到两张
const PRESETS: readonly RolePreset[] = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({
  n,
  counts: n < 8 ? { civilian: n - 1, undercover: 1 } : { civilian: n - 2, undercover: 2 },
}))

export const UNDERCOVER_ROLES: RoleSet = {
  id: 'undercover',
  nameKey: 'tools.undercover.roles.set',
  roles: [
    {
      id: 'civilian',
      nameKey: 'tools.undercover.roles.role.civilian',
      icon: '👤',
      teamKey: 'tools.undercover.roles.team.civilians',
    },
    {
      id: 'undercover',
      nameKey: 'tools.undercover.roles.role.undercover',
      icon: '🥸',
      teamKey: 'tools.undercover.roles.team.undercover',
    },
    // 白板不进预设：它是可选变体，要玩的人在配比面板手动加
    { id: 'blank', nameKey: 'tools.undercover.roles.role.blank', icon: '⬜' },
  ],
  presets: PRESETS,
  defaultN: 6,
}
