import type { TFunction } from 'i18next'

/**
 * 一局打了多久。**分钟以下不给数字** —— 桌上没人关心 40 秒还是 55 秒，
 * 而摆好列就按新一局的空局会得到一个精确到秒的荒谬时长。
 */
export function durationText(t: TFunction, ms: number): string {
  const min = Math.floor(ms / 60000)
  if (min < 1) return t('match.durationShort')
  const h = Math.floor(min / 60)
  return h > 0 ? t('match.durationHm', { h, m: min % 60 }) : t('match.durationM', { m: min })
}
