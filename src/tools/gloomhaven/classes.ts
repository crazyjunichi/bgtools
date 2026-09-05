import type { I18nKey } from '../../shared/i18n/types'

/**
 * 升级所需累计经验（规则书数值，下标 0 = 1 级）。
 * 等级永远从这里推导，角色纸只存总经验 —— 两处各记一份必然脱节
 */
export const LEVEL_XP = [0, 45, 95, 150, 210, 275, 345, 420, 500] as const

export const MAX_LEVEL = LEVEL_XP.length

export function levelOf(xp: number): number {
  let level = 1
  for (let i = 0; i < LEVEL_XP.length; i++) {
    if (xp >= LEVEL_XP[i]) level = i + 1
  }
  return level
}

/** 下一级还差多少；满级返回 null */
export function xpToNext(xp: number): number | null {
  const level = levelOf(xp)
  if (level >= MAX_LEVEL) return null
  return LEVEL_XP[level] - xp
}

export type PerkDef = {
  /** 这一行的勾选框数（1–3） */
  n: number
  textKey: I18nKey
}

export type GhClass = {
  id: string
  /** 职业图标是内容标识，用 emoji（同 meta.icon 的依据） */
  icon: string
  nameKey: I18nKey
  /** 1–9 级血量上限（角色卡数值） */
  hp: readonly number[]
  perks: readonly PerkDef[]
}

/**
 * 六个初始职业。**解锁职业不进这张表**（职业名本身就是剧透），
 * 其余一律走「自定义职业」手动血上限兜底。
 * 血量表与 perk 行对照规则书逐条核对，perk 行顺序与实体角色纸一致。
 */
export const CLASSES: readonly GhClass[] = [
  {
    id: 'brute',
    icon: '🪓',
    nameKey: 'tools.gloomhaven.classes.brute',
    hp: [10, 12, 14, 16, 18, 20, 22, 24, 26],
    perks: [
      { n: 1, textKey: 'tools.gloomhaven.perks.brute.p01' },
      { n: 1, textKey: 'tools.gloomhaven.perks.brute.p02' },
      { n: 2, textKey: 'tools.gloomhaven.perks.brute.p03' },
      { n: 1, textKey: 'tools.gloomhaven.perks.brute.p04' },
      { n: 2, textKey: 'tools.gloomhaven.perks.brute.p05' },
      { n: 1, textKey: 'tools.gloomhaven.perks.brute.p06' },
      { n: 2, textKey: 'tools.gloomhaven.perks.brute.p07' },
      { n: 1, textKey: 'tools.gloomhaven.perks.brute.p08' },
      { n: 2, textKey: 'tools.gloomhaven.perks.brute.p09' },
      { n: 1, textKey: 'tools.gloomhaven.perks.brute.p10' },
      { n: 1, textKey: 'tools.gloomhaven.perks.brute.p11' },
    ],
  },
  {
    id: 'tinkerer',
    icon: '🔧',
    nameKey: 'tools.gloomhaven.classes.tinkerer',
    hp: [8, 9, 11, 12, 14, 15, 17, 18, 20],
    perks: [
      { n: 2, textKey: 'tools.gloomhaven.perks.tinkerer.p01' },
      { n: 1, textKey: 'tools.gloomhaven.perks.tinkerer.p02' },
      { n: 1, textKey: 'tools.gloomhaven.perks.tinkerer.p03' },
      { n: 1, textKey: 'tools.gloomhaven.perks.tinkerer.p04' },
      { n: 1, textKey: 'tools.gloomhaven.perks.tinkerer.p05' },
      { n: 1, textKey: 'tools.gloomhaven.perks.tinkerer.p06' },
      { n: 2, textKey: 'tools.gloomhaven.perks.tinkerer.p07' },
      { n: 2, textKey: 'tools.gloomhaven.perks.tinkerer.p08' },
      { n: 2, textKey: 'tools.gloomhaven.perks.tinkerer.p09' },
      { n: 1, textKey: 'tools.gloomhaven.perks.tinkerer.p10' },
    ],
  },
  {
    id: 'spellweaver',
    icon: '🔮',
    nameKey: 'tools.gloomhaven.classes.spellweaver',
    hp: [6, 7, 8, 9, 10, 11, 12, 13, 14],
    perks: [
      { n: 1, textKey: 'tools.gloomhaven.perks.spellweaver.p01' },
      { n: 2, textKey: 'tools.gloomhaven.perks.spellweaver.p02' },
      { n: 2, textKey: 'tools.gloomhaven.perks.spellweaver.p03' },
      { n: 1, textKey: 'tools.gloomhaven.perks.spellweaver.p04' },
      { n: 1, textKey: 'tools.gloomhaven.perks.spellweaver.p05' },
      { n: 1, textKey: 'tools.gloomhaven.perks.spellweaver.p06' },
      { n: 1, textKey: 'tools.gloomhaven.perks.spellweaver.p07' },
      { n: 2, textKey: 'tools.gloomhaven.perks.spellweaver.p08' },
      { n: 2, textKey: 'tools.gloomhaven.perks.spellweaver.p09' },
      { n: 1, textKey: 'tools.gloomhaven.perks.spellweaver.p10' },
      { n: 1, textKey: 'tools.gloomhaven.perks.spellweaver.p11' },
    ],
  },
  {
    id: 'scoundrel',
    icon: '🗡️',
    nameKey: 'tools.gloomhaven.classes.scoundrel',
    hp: [8, 9, 11, 12, 14, 15, 17, 18, 20],
    perks: [
      { n: 2, textKey: 'tools.gloomhaven.perks.scoundrel.p01' },
      { n: 1, textKey: 'tools.gloomhaven.perks.scoundrel.p02' },
      { n: 1, textKey: 'tools.gloomhaven.perks.scoundrel.p03' },
      { n: 1, textKey: 'tools.gloomhaven.perks.scoundrel.p04' },
      { n: 2, textKey: 'tools.gloomhaven.perks.scoundrel.p05' },
      { n: 2, textKey: 'tools.gloomhaven.perks.scoundrel.p06' },
      { n: 1, textKey: 'tools.gloomhaven.perks.scoundrel.p07' },
      { n: 2, textKey: 'tools.gloomhaven.perks.scoundrel.p08' },
      { n: 1, textKey: 'tools.gloomhaven.perks.scoundrel.p09' },
      { n: 1, textKey: 'tools.gloomhaven.perks.scoundrel.p10' },
    ],
  },
  {
    id: 'cragheart',
    icon: '🪨',
    nameKey: 'tools.gloomhaven.classes.cragheart',
    hp: [10, 12, 14, 16, 18, 20, 22, 24, 26],
    perks: [
      { n: 1, textKey: 'tools.gloomhaven.perks.cragheart.p01' },
      { n: 3, textKey: 'tools.gloomhaven.perks.cragheart.p02' },
      { n: 1, textKey: 'tools.gloomhaven.perks.cragheart.p03' },
      { n: 2, textKey: 'tools.gloomhaven.perks.cragheart.p04' },
      { n: 2, textKey: 'tools.gloomhaven.perks.cragheart.p05' },
      { n: 1, textKey: 'tools.gloomhaven.perks.cragheart.p06' },
      { n: 2, textKey: 'tools.gloomhaven.perks.cragheart.p07' },
      { n: 1, textKey: 'tools.gloomhaven.perks.cragheart.p08' },
    ],
  },
  {
    id: 'mindthief',
    icon: '🐀',
    nameKey: 'tools.gloomhaven.classes.mindthief',
    hp: [6, 7, 8, 9, 10, 11, 12, 13, 14],
    perks: [
      { n: 2, textKey: 'tools.gloomhaven.perks.mindthief.p01' },
      { n: 1, textKey: 'tools.gloomhaven.perks.mindthief.p02' },
      { n: 1, textKey: 'tools.gloomhaven.perks.mindthief.p03' },
      { n: 1, textKey: 'tools.gloomhaven.perks.mindthief.p04' },
      { n: 2, textKey: 'tools.gloomhaven.perks.mindthief.p05' },
      { n: 2, textKey: 'tools.gloomhaven.perks.mindthief.p06' },
      { n: 1, textKey: 'tools.gloomhaven.perks.mindthief.p07' },
      { n: 1, textKey: 'tools.gloomhaven.perks.mindthief.p08' },
      { n: 1, textKey: 'tools.gloomhaven.perks.mindthief.p09' },
      { n: 1, textKey: 'tools.gloomhaven.perks.mindthief.p10' },
      { n: 1, textKey: 'tools.gloomhaven.perks.mindthief.p11' },
    ],
  },
]

/** 自定义职业 id：血量上限全程手动，perk 不进面板（对照实体角色纸勾） */
export const CUSTOM_CLASS = 'custom'

export function findClass(id: string): GhClass | undefined {
  return CLASSES.find((c) => c.id === id)
}
