import type { ComponentType } from 'react'
import type { I18nKey } from '../shared/i18n/types'
import {
  IconCompass,
  IconDice,
  IconPick,
  IconPlayers,
  IconSettings,
  IconTimer,
  type LucideIcon,
} from '../shared/icons'
import { QuickDice } from './dice/QuickDice'
import { QuickPick } from './pick/QuickPick'
import { QuickPlayers } from './players/QuickPlayers'
import { QuickPointer } from './pointer/QuickPointer'
import { QuickSettings } from './settings/QuickSettings'
import { QuickTimer } from './timer/QuickTimer'

/**
 * tile 面板里的身份色。取值刻意等于该工具 dialog 内部已有的主色
 * （骰子 amber、计时器 sky、指针 violet、名单 teal）—— 点开前后色相不变，
 * 面板认色和界面认色是同一套记忆。`neutral` 留给设置：它不是"用一下"的工具。
 */
export type QuickAccent = 'amber' | 'sky' | 'violet' | 'teal' | 'fuchsia' | 'neutral'

/** 所有游戏都可能临时要用的小工具，入口常驻顶栏，点开是 dialog */
export type QuickTool = {
  id: string
  /** 存 key 而不存文案：本表在模块顶层求值，切语言时要跟着变 */
  nameKey: I18nKey
  /** 只有首页的快捷区用得到（顶栏与 tile 面板放不下一行描述） */
  descKey: I18nKey
  /**
   * 是否在首页的「快捷工具」区露出。**刻意必填**：新增小工具时要自己做这个判断。
   * 判据是「开局中会不会随手用一下」—— 名单与设置是开局前配一次的东西，
   * 首页给它们一张同等大小的卡会把真正常用的三个挤下去；顶栏入口照旧全量。
   */
  onHome: boolean
  /** 顶栏是功能入口而非内容，所以走 shared/icons 而不是 emoji */
  icon: LucideIcon
  accent: QuickAccent
  Component: ComponentType
  /** 横向双栏布局（左控制 + 右结果）的工具需要更宽的面板 */
  wide?: boolean
  /**
   * 只在「当前工具页正在打的一局里有席位」时才露出（见
   * [active](../shared/match/active.ts)）。给候选必须是**这局在打的人**的工具用：
   * 退回全局名单是错的 —— 桌上 6 人名单、这局只 4 人时会点到没在玩的人。
   * 首页两处入口因此都不显示它（首页没有当前局）。
   */
  needsMatch?: boolean
}

/**
 * 小工具注册表 —— 唯一真源，顶栏按钮遍历它生成。
 * 静态 import 不懒加载：组件都很小，懒加载只会让弹出瞬间闪一下 Suspense。
 */
export const quickTools: QuickTool[] = [
  {
    id: 'dice',
    nameKey: 'quick.dice.name',
    descKey: 'quick.dice.desc',
    onHome: true,
    icon: IconDice,
    accent: 'amber',
    Component: QuickDice,
    wide: true,
  },
  {
    id: 'timer',
    nameKey: 'quick.timer.name',
    descKey: 'quick.timer.desc',
    onHome: true,
    icon: IconTimer,
    accent: 'sky',
    Component: QuickTimer,
    wide: true,
  },
  {
    id: 'pointer',
    nameKey: 'quick.pointer.name',
    descKey: 'quick.pointer.desc',
    onHome: true,
    icon: IconCompass,
    accent: 'violet',
    Component: QuickPointer,
    wide: true,
  },
  // 候选来自当前这一局，所以只在工具页里有席位时才出现（onHome 因此也无从谈起）
  {
    id: 'pick',
    nameKey: 'quick.pick.name',
    descKey: 'quick.pick.desc',
    onHome: false,
    icon: IconPick,
    accent: 'fuchsia',
    Component: QuickPick,
    wide: true,
    needsMatch: true,
  },
  // 名单不是"临时用一下"，但入口性质相同：任何工具页里都要能随手改，且不占版面
  {
    id: 'players',
    nameKey: 'quick.players.name',
    descKey: 'quick.players.desc',
    onHome: false,
    icon: IconPlayers,
    accent: 'teal',
    Component: QuickPlayers,
    wide: true,
  },
  // 全局设置排最后：不是"用一下"的工具，而是改完就走的配置项
  {
    id: 'settings',
    nameKey: 'quick.settings.name',
    descKey: 'quick.settings.desc',
    onHome: false,
    icon: IconSettings,
    accent: 'neutral',
    Component: QuickSettings,
  },
]
