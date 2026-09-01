import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { zh } from './locales/zh'

/**
 * 支持的语言。`label` 是各语言的自称，**刻意不进字典** ——
 * 语言选择器里每个选项都该用自己的语言写，两份 locale 里会是同一个值。
 */
export const SUPPORTED = [
  { lng: 'zh', label: '简体中文', htmlLang: 'zh-CN' },
  { lng: 'en', label: 'English', htmlLang: 'en' },
] as const

export type Lang = (typeof SUPPORTED)[number]['lng']

/** 沿用项目的 localStorage 前缀 */
const STORAGE_KEY = 'bgtools:lang'

/**
 * **顶层同步 init**，resources 静态 import、无异步 backend。
 * 这条时序不能破：ESM 保证被 import 的模块先执行完，所以 store 层
 * （[players/store](../players/store.ts) 的 `defaultRoster()` 在模块加载期就求值）
 * 只要 import 本模块，就能在自己的模块顶层安全调 `i18n.t()`。
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { zh: { translation: zh }, en: { translation: en } },
    fallbackLng: 'zh',
    supportedLngs: SUPPORTED.map((s) => s.lng),
    // 浏览器给的 zh-CN / zh-Hans / zh-TW 一律落到 zh
    load: 'languageOnly',
    // React 自己就防 XSS；不关掉的话玩家名里的 & < 会显示成 &amp;
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
  })

/** `<html lang>` 要的是完整标签（zh → zh-CN），跟 i18next 内部的语言码不是一回事 */
export function htmlLangOf(lng: string): string {
  return SUPPORTED.find((s) => lng.startsWith(s.lng))?.htmlLang ?? 'zh-CN'
}

export default i18n
