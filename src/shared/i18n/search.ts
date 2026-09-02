import type { i18n as I18n } from 'i18next'
import { SUPPORTED } from '.'
import type { I18nKey } from './types'

/**
 * 把几条 key 在**所有支持语言**下的文案拼成一个小写比对串，喂给筛选框。
 * 中文界面下打 `catan` / `azul` 也要命中，反过来也一样；
 * 桌上的口头叫法（农家乐、翼展、车票之旅）靠额外传一条别名 key 补。
 */
export function searchText(i18n: I18n, keys: readonly (I18nKey | undefined)[]): string {
  return SUPPORTED.map((s) => {
    const fixed = i18n.getFixedT(s.lng)
    return keys.map((k) => (k ? fixed(k) : '')).join(' ')
  })
    .join(' ')
    .toLowerCase()
}

/**
 * 查询串切成词，**要求全部命中**（「七大 奇迹」「ticket ride」都算一次筛选）。
 * 空数组 = 没在筛选，调用方据此走「全都显示」而不是「一条都不显示」。
 */
export function tokenize(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean)
}
