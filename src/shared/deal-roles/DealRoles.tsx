import { useState } from 'react'
import type { DealAccent } from './accent'
import { countsOf } from './deck'
import { DealRunner } from './DealRunner'
import { DealSetup } from './DealSetup'
import { DealOnline } from './online/DealOnline'
import { useDealRolesStore } from './store'
import type { RoleSet } from './types'

/** 配比面板 → 两种发牌方式之一。三者互斥，浮层不叠 */
type Mode = 'setup' | 'pass' | 'online'

type Props = {
  set: RoleSet
  /** 宿主工具页的主色，通常直接传它 `meta.accent` 的值 */
  accent: DealAccent
  onClose: () => void
}

/**
 * 发身份的唯一对外入口：宿主游戏页只写一行
 * `{dealing && <DealRoles set={XXX_ROLES} accent="violet" onClose={…} />}`。
 *
 * 配比面板与两种发牌现场在这里互斥切换 —— 接入一款新游戏
 * 只要一份 [RoleSet](types.ts) 数据，交互一个字都不用改。
 */
export function DealRoles({ set, accent, onClose }: Props) {
  const saved = useDealRolesStore((s) => s.counts[set.id])
  const [mode, setMode] = useState<Mode>('setup')

  // 不 memo：逐项过一遍七八个身份，而 saved 每次可能是新对象，memo 的 deps 稳不下来
  const counts = countsOf(set, saved)

  if (mode === 'pass') {
    return <DealRunner set={set} counts={counts} accent={accent} onClose={onClose} />
  }
  if (mode === 'online') {
    return <DealOnline set={set} counts={counts} accent={accent} onClose={onClose} />
  }
  return (
    <DealSetup
      set={set}
      counts={counts}
      accent={accent}
      onStart={() => setMode('pass')}
      onStartOnline={() => setMode('online')}
      onClose={onClose}
    />
  )
}
