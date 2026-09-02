import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconAlarm, IconPause, IconTimer } from '../../shared/icons'
import { formatMS } from '../../shared/time'
import { useQuickUI } from '../store'
import { TICK_MS, useQuickTimerStore } from './store'

/**
 * 栏上的计时器芯片。小工具入口收进 tile 面板后，这是唯一还能常驻栏上的小工具 ——
 * 判据是"有没有持续状态"：计时器有（跑着/暂停/响铃），骰子和指针的结果都是一次性的，
 * 所以只有它需要不点开就能扫到还剩多少秒。
 *
 * 三态不只靠颜色区分，图标跟着换（桌上斜视时色相最先失真）。
 */
export function TimerChip() {
  const { t } = useTranslation()
  const openTool = useQuickUI((s) => s.openTool)
  const endAt = useQuickTimerStore((s) => s.endAt)
  const remainMs = useQuickTimerStore((s) => s.remainMs)
  const alarming = useQuickTimerStore((s) => s.alarming)
  const [now, setNow] = useState(() => Date.now())

  // 只在跑着时 tick：暂停态的 remainMs 是冻结值，刷新它没有意义
  useEffect(() => {
    if (endAt === null) return
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS)
    return () => window.clearInterval(id)
  }, [endAt])

  const running = endAt !== null
  const paused = remainMs !== null
  // 没有持续状态时整个芯片不存在，栏上不留空位
  if (!running && !paused && !alarming) return null

  const Icon = alarming ? IconAlarm : paused ? IconPause : IconTimer

  return (
    <button
      type="button"
      onClick={() => openTool('timer')}
      className={`flex size-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl transition-transform duration-75 active:scale-95 ${
        alarming
          ? 'bg-rose-600 font-bold text-white'
          : paused
            ? 'bg-amber-500/15 text-amber-300'
            : 'bg-sky-500/15 text-sky-300'
      }`}
    >
      {/* 数字本身是可见文本，读屏会连着念，所以这里只补工具名：「计时器 2:31」 */}
      <span className="sr-only">{t('quick.timer.name')}</span>
      <Icon className="size-5" aria-hidden />
      <span className="font-mono text-xs tabular-nums">
        {formatMS(running ? endAt - now : (remainMs ?? 0))}
      </span>
    </button>
  )
}
