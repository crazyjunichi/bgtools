import type { TFunction } from 'i18next'
import type { I18nKey } from '../i18n/types'
import type { DieRender } from './dice3d/Die3D'

/** 面数只有这六档：3D 骰身就只有这六种多面体几何（见 [faces.ts](dice3d/faces.ts)） */
export type DieSides = 4 | 6 | 8 | 10 | 12 | 20

export type DieFace = {
  /** 骰面上画的字形：数字、符号 emoji，或一两个字 */
  glyph: string
  /** 面名，读屏与统计行用。数字面不给 —— 字形本身就是文案 */
  labelKey?: I18nKey
  /** 有值才进总和。符号面不给值，只按面计数 */
  value?: number
}

/**
 * 骰身色档。**不含 emerald**（锁定轮廓占用）与 rose（规范留给破坏性操作），
 * 剩下的档位够让同一桌上的几种骰互相认得出。
 */
export type DieHue = 'amber' | 'sky' | 'violet' | 'red' | 'stone'

export type DieSpec = {
  /**
   * 稳定 id，同时是 3D 层的 kit 缓存键 —— **同 id 必须同外观**。
   * 面数相同但符号不同的两种骰给同一个 id 会互相串贴图
   */
  id: string
  /** 骰名。数字骰不给，消费方显示 `d6` 这类通行记号 */
  nameKey?: I18nKey
  sides: DieSides
  hue: DieHue
  /** 面号 1..N 对应的面，`faces[i]` 是面号 `i + 1`，长度必须等于 sides */
  faces: readonly DieFace[]
}

/**
 * 一盒游戏的骰子清单。**同一个 DieSpec 在 dice 里出现几次就是盒里有几颗** ——
 * 玩家从这份清单里勾选参与本次投掷的骰子，所以它要跟实物一一对应。
 * 存对象而不是 id：骰组是代码常量，不需要再多一层查表（持久化存的是下标）。
 */
export type DiceSet = {
  id: string
  nameKey: I18nKey
  dice: readonly DieSpec[]
}

/**
 * 骰身色档 → 3D 用的 hex。骰身取色板中间档（被灯打亮后会再亮一档），
 * 描边取同色深档 —— 小尺寸下轮廓靠明暗撑不住，得有一圈实线。
 */
const DIE_BODY: Record<DieHue, { body: number; edge: number }> = {
  amber: { body: 0xf59e0b, edge: 0x92400e },
  sky: { body: 0x0ea5e9, edge: 0x075985 },
  violet: { body: 0x8b5cf6, edge: 0x5b21b6 },
  red: { body: 0xef4444, edge: 0x991b1b },
  // 象牙白骰：骰身取更亮的一档，描边才压得住轮廓
  stone: { body: 0xe7e5e4, edge: 0x57534e },
}

/** `--color-ink`。实心骰身配深字（DESIGN.md §2），canvas 那张表要字面量 */
const GLYPH_INK = '#0a0a0a'

/**
 * 结果芯片的淡底档。**显式映射表**，不许拼类名。
 * 锁定态会整块换成 emerald —— 锁比「这是哪种骰」更需要一眼看见
 */
export const DIE_CHIP: Record<DieHue, string> = {
  amber: 'border-amber-500/60 bg-amber-500/15 text-amber-300',
  sky: 'border-sky-500/60 bg-sky-500/15 text-sky-300',
  violet: 'border-violet-500/60 bg-violet-500/15 text-violet-300',
  red: 'border-red-500/60 bg-red-500/15 text-red-300',
  stone: 'border-stone-400/60 bg-stone-400/15 text-stone-200',
}

/** 骰名。数字骰没有 nameKey，退回 `d6` 这类通行记号 —— 那不是界面中文，不入 i18n */
export function dieName(spec: DieSpec, t: TFunction) {
  return spec.nameKey ? t(spec.nameKey) : `d${spec.sides}`
}

/** 面名。数字面没有 labelKey，字形本身就是读法 */
export function faceLabel(face: DieFace, t: TFunction) {
  return face.labelKey ? t(face.labelKey) : face.glyph
}

export function dieRenderOf(spec: DieSpec): DieRender {
  const { body, edge } = DIE_BODY[spec.hue]
  return {
    kitKey: spec.id,
    sides: spec.sides,
    bodyColor: body,
    edgeColor: edge,
    glyphInk: GLYPH_INK,
    glyphs: spec.faces.map((face) => face.glyph),
  }
}

/**
 * 骰型的定义入口。面表长度与面数对不上在 3D 里是**静默错面**（少的那面画空白，
 * 多的那面根本画不出来），所以开发期直接炸出来。
 */
export function defineDie(spec: DieSpec): DieSpec {
  if (import.meta.env.DEV && spec.faces.length !== spec.sides) {
    throw new Error(`die "${spec.id}": ${spec.faces.length} faces given for d${spec.sides}`)
  }
  return spec
}

/** 普通数字骰：面号即点数，直接进总和 */
export function numericDie(sides: DieSides, hue: DieHue): DieSpec {
  return defineDie({
    // hue 进 id：kitKey 决定贴图与材质缓存，同面数不同色必须是两个 kit
    id: `num-${hue}-d${sides}`,
    sides,
    hue,
    faces: Array.from({ length: sides }, (_, i) => ({ glyph: String(i + 1), value: i + 1 })),
  })
}
