import type { ComponentType } from 'react'
import type { I18nKey } from '../shared/i18n/types'
import {
  IconCompass,
  IconDice,
  IconPlayers,
  IconSettings,
  IconTimer,
  type LucideIcon,
} from '../shared/icons'
import { QuickDice } from './dice/QuickDice'
import { QuickPlayers } from './players/QuickPlayers'
import { QuickPointer } from './pointer/QuickPointer'
import { QuickSettings } from './settings/QuickSettings'
import { QuickTimer } from './timer/QuickTimer'

/**
 * tile 面板里的身份色。取值刻意等于该工具 dialog 内部已有的主色
 * （骰子 amber、计时器 sky、指针 violet、名单 teal）—— 点开前后色相不变，
 * 面板认色和界面认色是同一套记忆。`neutral` 留给设置：它不是"用一下"的工具。
 */
export type QuickAccent = 'amber' | 'sky' | 'violet' | 'teal' | 'neutral'

/** 所有游戏都可能临时要用的小工具，入口常驻顶栏，点开是 dialog */
export type QuickTool = {
  id: string
  /** 存 key 而不存文案：本表在模块顶层求值，切语言时要跟着变 */
  nameKey: I18nKey
  /** 顶栏是功能入口而非内容，所以走 shared/icons 而不是 emoji */
  icon: LucideIcon
  accent: QuickAccent
  Component: ComponentType
  /** 横向双栏布局（左控制 + 右结果）的工具需要更宽的面板 */
  wide?: boolean
}

/**
 * 小工具注册表 —— 唯一真源，顶栏按钮遍历它生成。
 * 静态 import 不懒加载：组件都很小，懒加载只会让弹出瞬间闪一下 Suspense。
 */
export const quickTools: QuickTool[] = [
  {
    id: 'dice',
    nameKey: 'quick.dice.name',
    icon: IconDice,
    accent: 'amber',
    Component: QuickDice,
    wide: true,
  },
  {
    id: 'timer',
    nameKey: 'quick.timer.name',
    icon: IconTimer,
    accent: 'sky',
    Component: QuickTimer,
    wide: true,
  },
  {
    id: 'pointer',
    nameKey: 'quick.pointer.name',
    icon: IconCompass,
    accent: 'violet',
    Component: QuickPointer,
    wide: true,
  },
  // 名单不是"临时用一下"，但入口性质相同：任何工具页里都要能随手改，且不占版面
  {
    id: 'players',
    nameKey: 'quick.players.name',
    icon: IconPlayers,
    accent: 'teal',
    Component: QuickPlayers,
    wide: true,
  },
  // 全局设置排最后：不是"用一下"的工具，而是改完就走的配置项
  {
    id: 'settings',
    nameKey: 'quick.settings.name',
    icon: IconSettings,
    accent: 'neutral',
    Component: QuickSettings,
  },
]
