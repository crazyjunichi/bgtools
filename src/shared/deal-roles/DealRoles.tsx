import { useState } from 'react'
import type { DealAccent } from './accent'
import { countsOf } from './deck'
import { DealRunner } from './DealRunner'
import { DealSetup } from './DealSetup'
import { useDealRolesStore } from './store'
import type { RoleSet } from './types'

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
 * 配比面板与轮传现场在这里互斥切换（两个浮层不叠）—— 接入一款新游戏
 * 只要一份 [RoleSet](types.ts) 数据，交互一个字都不用改。
 */
export function DealRoles({ set, accent, onClose }: Props) {
  const saved = useDealRolesStore((s) => s.counts[set.id])
  const [running, setRunning] = useState(false)

  // 不 memo：逐项过一遍七八个身份，而 saved 每次可能是新对象，memo 的 deps 稳不下来
  const counts = countsOf(set, saved)

  return running ? (
    <DealRunner set={set} counts={counts} accent={accent} onClose={onClose} />
  ) : (
    <DealSetup
      set={set}
      counts={counts}
      accent={accent}
      onStart={() => setRunning(true)}
      onClose={onClose}
    />
  )
}
