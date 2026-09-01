import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useWakeLock } from '../shared/hooks/useWakeLock'
import { buzz } from '../shared/haptics'
import { QuickDialog } from './QuickDialog'
import { QuickMenu } from './QuickMenu'
import { quickTools } from './registry'
import { QUICK_MENU, useQuickUI } from './store'
import { beep } from './timer/beep'
import { TimerAlarm } from './timer/TimerAlarm'
import { TICK_MS, useQuickTimerStore } from './timer/store'

type Props = {
  /** 传给 QuickMenu 定位用：工具页横屏的顶栏是左侧竖条 */
  sidebar?: boolean
}

/**
 * 小工具的浮层宿主，挂在 App 最外层且**不带 key** —— 必须跨页面常驻：
 * - 顶栏是 absolute + translate + backdrop-blur，会成为 fixed 的包含块，浮层不能挂在里面
 * - 计时器到时判定要在 dialog 关掉、甚至换了工具页之后依然生效
 */
export function QuickLayer({ sidebar }: Props) {
  const { t } = useTranslation()
  const { open, close } = useQuickUI()
  const endAt = useQuickTimerStore((s) => s.endAt)
  const alarming = useQuickTimerStore((s) => s.alarming)
  const tool = quickTools.find((t) => t.id === open)

  // 计时中不许息屏
  useWakeLock(endAt !== null)

  // 到时判定。刻意不 setState：这里只管触发，剩余时间的显示由 dialog 自己 tick
  useEffect(() => {
    if (endAt === null) return
    const id = window.setInterval(() => {
      const s = useQuickTimerStore.getState()
      if (s.endAt === null || Date.now() < s.endAt) return
      window.clearInterval(id)
      s.fire()
      buzz([80, 60, 80, 60, 200])
      beep()
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [endAt])

  return (
    <>
      {open === QUICK_MENU && <QuickMenu sidebar={sidebar} />}
      {tool && (
        <QuickDialog title={t(tool.nameKey)} icon={tool.icon} wide={tool.wide} onClose={close}>
          <tool.Component />
        </QuickDialog>
      )}
      {alarming && <TimerAlarm />}
    </>
  )
}
