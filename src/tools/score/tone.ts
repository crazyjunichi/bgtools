/**
 * 正负分的色相。**刻意不用 emerald / rose** —— 那两色在本项目里分别锁给"完成"与
 * "破坏性操作"，拿来标正负会让「危险」的红失去唯一性。teal 与 orange 一冷一暖，
 * 色相差在斜视 45° 下比绿/红更容易分，且都不在语义保留色里。
 *
 * 颜色只是辅助：符号（+ / −）由 [store](store.ts) 的 `signed` 始终带上，颜色不是唯一编码。
 */
const TONE = {
  pos: 'text-teal-300',
  neg: 'text-orange-300',
  zero: 'text-text-dim',
} as const

/** 卡片（[ScoreGrid]）与完整记录（[ScoreHistory]）共用，所以不留在任一组件里 */
export function tone(v: number | undefined): string {
  if (!v) return TONE.zero
  return v > 0 ? TONE.pos : TONE.neg
}
