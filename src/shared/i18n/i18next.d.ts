import type { zh } from './locales/zh'

/**
 * 让 `t('a.b.c')` 有补全和校验、插值参数名也被检查。
 * 没有这段声明的话 i18next 的 key 类型是裸 `string`，写错只能在运行时看到原样输出的 key。
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof zh }
  }
}
