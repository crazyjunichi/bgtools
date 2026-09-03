import type { TFunction } from 'i18next'
import i18n from '../i18n'

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

/**
 * 一局的时刻，给导出图与历史列表用。**掐掉秒**：这两处都只需要「哪天几点」，
 * 完整的 `toLocaleString` 还会随语言忽长忽短。
 */
export function dateTimeText(at: number): string {
  return new Date(at).toLocaleString(i18n.language, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 分数的显示形式。负号用 U+2212 而非连字符：与 [Stepper](../components/Stepper.tsx) 一致，
 * 等宽字体下宽度也才对得上。**CSV 不能用它**（Excel 不认，整列会被当成文本）。
 */
export function fmtScore(v: number): string {
  return v < 0 ? `−${-v}` : String(v)
}
