/**
 * 画题词库:主题 + 该主题下具体可画的名词。数据本体是同目录的 words.json
 * ([{ category, words }] 紧凑 JSON)—— 词表的唯一真源,改词直接改那个文件。
 * 消费方(store 抽词)不认识具体主题。中文词表;英文界面暂回落中文(同 werewords 惯例)。
 *
 * 选词判据:能几笔画出特征的具体名词,避开抽象词与同主题内撞特征的近义词。
 */
import words from './words.json'

export type WordCategory = { category: string; words: readonly string[] }

export const WORDS: readonly WordCategory[] = words
