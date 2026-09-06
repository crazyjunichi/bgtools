/**
 * 行动代号词库,3888 词。数据本体是同目录的 words.json —— 词表的唯一真源,
 * 改词直接改那个文件(紧凑 JSON 字符串数组),本文件只是带类型的入口。
 * 词是游戏内容而非界面文案,不受双 locale 约束。
 */
import words from './words.json'

export const WORDS: readonly string[] = words
