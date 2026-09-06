import type { RoleSet } from './types'

/**
 * 自定义发身份的身份集。**身份名不在这份常量里**（`roles` 恒为空）——
 * 文本是用户当场填的，组织者侧在发牌前拼一份运行时 RoleSet（roles 带字面量 name），
 * 玩家侧则靠 `namesFromPool` 按 roleId 从内容池取回文本（见 [pick.ts](online/pick.ts)）。
 *
 * `presets` / `defaultN` 的不变式只服务 [DealSetup](DealSetup.tsx) 的预设下拉，
 * 那个面板不用于这个集，这里填空集与 0 只是满足类型。
 */
export const CUSTOM_ROLES: RoleSet = {
  id: 'custom',
  nameKey: 'tools.dealCustom.name',
  roles: [],
  presets: [],
  defaultN: 0,
  namesFromPool: true,
}
