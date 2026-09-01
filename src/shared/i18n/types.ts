import type { ParseKeys } from 'i18next'
import type { zh } from './locales/zh'

/**
 * 全部合法 key 的联合类型。用在 meta / registry 这类**纯数据常量**上：
 * 它们在模块顶层求值、拿不到 hook，所以存 key 而不存文案，
 * 由消费方在渲染期 `t(x.nameKey)` —— 切语言才能立刻跟着变。
 *
 * 标了这个类型，key 写错就是编译错误，不必等到运行时看见 'tools.dice.nam'。
 */
export type I18nKey = ParseKeys

/**
 * 把 [zh](locales/zh.ts) 的字面量类型放宽成 `string`。
 * 不放宽的话（zh 是 `as const`）en 会被要求填一模一样的中文字面量。
 */
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> }

/** en 必须与 zh 同构：缺 key、多 key、层级写错都在 tsc 阶段拦住 */
export type Resources = Widen<typeof zh>
