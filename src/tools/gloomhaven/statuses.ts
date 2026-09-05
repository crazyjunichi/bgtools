import type { I18nKey } from '../../shared/i18n/types'

export type StatusDef = {
  /** 同时是图标文件名：public/gloomhaven/status/<id>.png */
  id: string
  nameKey: I18nKey
  /** 祝福/诅咒是攻击修正牌，会多张叠进牌堆，其余状态二元 */
  max: number
}

/**
 * 幽港状态标记。减益在前（敌人挂上来的、最常操作），增益在后。
 * 只收规则书通用状态；职业专属的召唤物/歌曲标记不进列表（那是卡牌的事）。
 *
 * 图标是官方 token 字形的 MIT 授权复刻（GloomhavenModifierDeck 项目），
 * 玩家按实体 token 认图，所以界面上只出图标，名字退到 aria-label
 */
export const STATUSES: readonly StatusDef[] = [
  { id: 'curse', nameKey: 'tools.gloomhaven.status.curse', max: 10 },
  { id: 'poison', nameKey: 'tools.gloomhaven.status.poison', max: 1 },
  { id: 'wound', nameKey: 'tools.gloomhaven.status.wound', max: 1 },
  { id: 'immobilize', nameKey: 'tools.gloomhaven.status.immobilize', max: 1 },
  { id: 'stun', nameKey: 'tools.gloomhaven.status.stun', max: 1 },
  { id: 'disarm', nameKey: 'tools.gloomhaven.status.disarm', max: 1 },
  { id: 'muddle', nameKey: 'tools.gloomhaven.status.muddle', max: 1 },
  { id: 'bless', nameKey: 'tools.gloomhaven.status.bless', max: 10 },
  { id: 'strengthen', nameKey: 'tools.gloomhaven.status.strengthen', max: 1 },
  { id: 'invisible', nameKey: 'tools.gloomhaven.status.invisible', max: 1 },
]

/** 状态图标 URL。base './' 下必须拼 BASE_URL，不写绝对路径 */
export function statusIcon(id: string): string {
  return `${import.meta.env.BASE_URL}gloomhaven/status/${id}.png`
}
