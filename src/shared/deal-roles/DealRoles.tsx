import { useEffect, useState } from 'react'
import { useBackOverride } from '../backOverride'
import type { DealAccent } from './accent'
import { countsOf } from './deck'
import { DealRunner } from './DealRunner'
import { DealSetup } from './DealSetup'
import { DealOnline } from './online/DealOnline'
import type { DealPool } from './online/backend'
import { useDealRolesStore } from './store'
import type { RoleSet } from './types'

/** 配比面板 → 两种发牌方式之一。三者互斥 */
type Mode = 'setup' | 'pass' | 'online'

type Props = {
  set: RoleSet
  /** 宿主工具页的主色，通常直接传它 `meta.accent` 的值 */
  accent: DealAccent
  /**
   * 内容型游戏的每身份一句内容（如冒牌艺术家：艺术家 → 词，冒牌货 → 主题）。
   * 轮传在揭示卡上多一行，扫码进内容池随局写入；没有内容的身份不出这行。
   */
  pool?: DealPool
  onClose: () => void
}

/**
 * 发身份的唯一对外入口：宿主游戏页只写一行
 * `{dealing && <DealRoles set={XXX_ROLES} accent="violet" onClose={…} />}`。
 *
 * 配比面板铺满内容区、由顶栏返回退出；两种发牌现场仍是盖过顶栏的全屏层 ——
 * 它们的"关掉"等于中断整轮发牌，出口只能是各自角落的二次确认。
 * 接入一款新游戏只要一份 [RoleSet](types.ts) 数据，交互一个字都不用改。
 */
export function DealRoles({ set, accent, pool, onClose }: Props) {
  const saved = useDealRolesStore((s) => s.counts[set.id])
  const [mode, setMode] = useState<Mode>('setup')

  // 配比页期间接管顶栏返回（等价旧弹窗的 ✕）。进入现场后顶栏被现场层整个盖住，
  // 这枚回调够不着 —— 现场的中途退出仍只有角落那个二次确认
  useEffect(() => {
    const { set: setBack, clear } = useBackOverride.getState()
    setBack(onClose)
    return clear
  }, [onClose])

  // 不 memo：逐项过一遍七八个身份，而 saved 每次可能是新对象，memo 的 deps 稳不下来
  const counts = countsOf(set, saved)

  if (mode === 'pass') {
    return <DealRunner set={set} counts={counts} accent={accent} pool={pool} onClose={onClose} />
  }
  if (mode === 'online') {
    return <DealOnline set={set} counts={counts} accent={accent} pool={pool} onClose={onClose} />
  }
  return (
    <DealSetup
      set={set}
      counts={counts}
      accent={accent}
      onStart={() => setMode('pass')}
      onStartOnline={() => setMode('online')}
    />
  )
}
