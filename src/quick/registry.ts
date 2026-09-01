import type { ComponentType } from 'react'
import {
  IconCompass,
  IconDice,
  IconPlayers,
  IconTimer,
  type LucideIcon,
} from '../shared/icons'
import { QuickDice } from './dice/QuickDice'
import { QuickPlayers } from './players/QuickPlayers'
import { QuickPointer } from './pointer/QuickPointer'
import { QuickTimer } from './timer/QuickTimer'

/** 所有游戏都可能临时要用的小工具，入口常驻顶栏，点开是 dialog */
export type QuickTool = {
  id: string
  name: string
  /** 顶栏是功能入口而非内容，所以走 shared/icons 而不是 emoji */
  icon: LucideIcon
  Component: ComponentType
  /** 横向双栏布局（左控制 + 右结果）的工具需要更宽的面板 */
  wide?: boolean
}

/**
 * 小工具注册表 —— 唯一真源，顶栏按钮遍历它生成。
 * 静态 import 不懒加载：组件都很小，懒加载只会让弹出瞬间闪一下 Suspense。
 */
export const quickTools: QuickTool[] = [
  { id: 'dice', name: '快速骰子', icon: IconDice, Component: QuickDice, wide: true },
  { id: 'timer', name: '计时器', icon: IconTimer, Component: QuickTimer, wide: true },
  { id: 'pointer', name: '随机指针', icon: IconCompass, Component: QuickPointer, wide: true },
  // 名单不是"临时用一下"，但入口性质相同：任何工具页里都要能随手改，且不占版面
  { id: 'players', name: '玩家名单', icon: IconPlayers, Component: QuickPlayers, wide: true },
]
