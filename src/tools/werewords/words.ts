/**
 * 魔法词词库,按难度分档。数据本体是 words/ 下每档一个 JSON(紧凑字符串数组)
 * —— 词表的唯一真源,改词直接改那些文件;加新档 = 丢一个 JSON 进来 +
 * DIFFICULTIES 加一项 + 两个 locale 补难度名。
 * 英文词库未编,英文界面回落中文(以后补英文在 WordPool 加 en 槽即可)。
 */
import easy from './words/easy.json'
import standard from './words/standard.json'
import hard from './words/hard.json'

export const DIFFICULTIES = ['easy', 'standard', 'hard'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

type WordPool = {
  zh: readonly string[]
  /** 英文词库留位:缺省时英文界面回落 zh */
  en?: readonly string[]
}

export const WORDS: Record<Difficulty, WordPool> = {
  easy: { zh: easy },
  standard: { zh: standard },
  hard: { zh: hard },
}

export function wordPool(difficulty: Difficulty, lang: string): readonly string[] {
  const pool = WORDS[difficulty]
  return lang.startsWith('en') ? (pool.en ?? pool.zh) : pool.zh
}
