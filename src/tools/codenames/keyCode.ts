import { BOARD_SIZE, type CellKind } from './game'
import { WORDS } from './words'

/**
 * 队长二维码的编解码。词不带全文、带它在固定词表里的索引 ——
 * 词表随代码同版本部署，扫码方加载的是同一份。布局：
 * 8bit 版本 + 每词 13bit 索引 + 每格 2bit 颜色，25 格共 48 字节，base64url 成 64 字符。
 *
 * 版本号规则同扫码发牌：任何影响位布局的改动都要 +1。
 */
const VERSION = 1

const KIND_BITS: Record<CellKind, number> = { red: 0, blue: 1, neutral: 2, assassin: 3 }
const KIND_AT: readonly CellKind[] = ['red', 'blue', 'neutral', 'assassin']

// 反查表懒建：8000 词的 Map 只在真的出码时建一次
let wordIndex: Map<string, number> | null = null
function indexOfWord(word: string): number {
  if (!wordIndex) {
    wordIndex = new Map()
    WORDS.forEach((w, i) => wordIndex!.set(w, i))
  }
  return wordIndex.get(word) ?? -1
}

export function encodeKeyUrl(words: string[], key: CellKind[]): string | null {
  if (words.length !== BOARD_SIZE || key.length !== BOARD_SIZE) return null
  const bits: number[] = []
  const push = (value: number, n: number) => {
    for (let b = n - 1; b >= 0; b--) bits.push((value >> b) & 1)
  }
  push(VERSION, 8)
  for (const word of words) {
    const idx = indexOfWord(word)
    if (idx < 0) return null
    push(idx, 13)
  }
  for (const k of key) push(KIND_BITS[k], 2)

  const bytes = new Uint8Array(Math.ceil(bits.length / 8))
  bits.forEach((b, i) => {
    if (b) bytes[i >> 3] |= 0x80 >> (i & 7)
  })
  let bin = ''
  for (const byte of bytes) bin += String.fromCharCode(byte)
  return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

/** 解不出来一律返回 null，界面上只出一句人话 */
export function decodeKeyUrl(d: string): { words: string[]; key: CellKind[] } | null {
  try {
    const bin = atob(d.replaceAll('-', '+').replaceAll('_', '/'))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    let pos = 0
    const read = (n: number): number | null => {
      if (pos + n > bytes.length * 8) return null
      let v = 0
      for (let i = 0; i < n; i++) {
        v = (v << 1) | ((bytes[pos >> 3] >> (7 - (pos & 7))) & 1)
        pos++
      }
      return v
    }
    if (read(8) !== VERSION) return null
    const words: string[] = []
    for (let i = 0; i < BOARD_SIZE; i++) {
      const idx = read(13)
      const word = idx === null ? undefined : WORDS[idx]
      if (word === undefined) return null
      words.push(word)
    }
    const key: CellKind[] = []
    for (let i = 0; i < BOARD_SIZE; i++) {
      const k = read(2)
      if (k === null) return null
      key.push(KIND_AT[k])
    }
    return { words, key }
  } catch {
    return null
  }
}
