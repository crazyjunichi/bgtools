/**
 * 谁是卧底词库：一对近义词。数据本体是同目录的 pairs.json（[[a, b]] 紧凑 JSON，
 * 由 game-lexicon 导出）—— 词表的唯一真源，改词直接改那个文件。
 * 中文词表；英文界面暂回落中文（同 werewords 惯例）。
 */
import pairs from './pairs.json'

export type WordPair = readonly [string, string]

// JSON import 推不出定长元组，词库由导出方保证恒为二元对
export const PAIRS = pairs as unknown as readonly WordPair[]
