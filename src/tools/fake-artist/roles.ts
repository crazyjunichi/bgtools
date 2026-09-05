import type { RolePreset, RoleSet } from '../../shared/deal-roles/types'

/**
 * 冒牌艺术家的身份与板子。App 出题所以没有出题人这张牌，全员都画。
 * 词不进身份表 —— 它是内容池的事（DealRoles 的 `pool` prop）：艺术家那句是词，冒牌货那句是主题。
 */

// 规则书 5–10 人含出题人；App 把出题人省了，3 人（2 画 1 冒）起能玩
const PRESETS: readonly RolePreset[] = [3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
  n,
  counts: { fake: 1, artist: n - 1 },
}))

export const FAKE_ARTIST_ROLES: RoleSet = {
  id: 'fake-artist',
  nameKey: 'tools.fakeArtist.roles.set',
  roles: [
    {
      id: 'artist',
      nameKey: 'tools.fakeArtist.roles.role.artist',
      icon: '🎨',
      teamKey: 'tools.fakeArtist.roles.team.artists',
    },
    {
      id: 'fake',
      nameKey: 'tools.fakeArtist.roles.role.fake',
      icon: '🕵️',
      teamKey: 'tools.fakeArtist.roles.team.fake',
    },
  ],
  presets: PRESETS,
  defaultN: 6,
}
