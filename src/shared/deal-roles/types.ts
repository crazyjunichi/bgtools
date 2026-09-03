import type { I18nKey } from '../i18n/types'

/** 一个身份。张数不在这里 —— 同一个身份可以放好几张，那是配比的事 */
export type Role = {
  id: string
  nameKey: I18nKey
  /**
   * 内容标识，**刻意仍用 emoji**：判据同 `ToolMeta.icon` ——
   * 彩色轮廓在桌上斜视时比单色线条更好认，而这里认的正是"我是什么"。
   */
  icon: string
  /** 阵营。只用来在揭示页多一行文字，不做颜色编码（颜色不许是唯一识别编码） */
  teamKey: I18nKey
}

/** 常见板子：这个人数下各身份各几张 */
export type RolePreset = {
  n: number
  counts: Readonly<Record<string, number>>
}

/**
 * 一款游戏的一套身份。**纯数据常量，存 key 不存文案** ——
 * 它在模块顶层求值拿不到 hook，由消费方在渲染期 `t()`，切语言才会立刻跟着变。
 *
 * 引擎不认识任何一个具体身份：新增一款游戏只写一份这个常量，交互不必改。
 */
export type RoleSet = {
  id: string
  nameKey: I18nKey
  roles: readonly Role[]
  presets: readonly RolePreset[]
  /** 没配过时落哪一档。**必须命中某个 preset 的 `n`**，类型管不住，改数据时自己对一眼 */
  defaultN: number
}

/** roleId -> 张数 */
export type RoleCounts = Record<string, number>
