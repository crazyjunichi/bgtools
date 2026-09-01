import { useTranslation } from 'react-i18next'
import { IconQuickMenu } from '../shared/icons'
import { QUICK_MENU, useQuickUI } from './store'
import { TimerChip } from './timer/TimerChip'

/**
 * 栏上的小工具入口。五个工具收进 tile 面板（[QuickMenu](QuickMenu.tsx)）后这里只剩两样：
 * 一个固定位置的面板开关 + 有持续状态的小工具芯片。
 *
 * 只 dispatch，面板与浮层都由 App 层的 [QuickLayer](QuickLayer.tsx) 渲染。
 */
export function QuickBar() {
  const { t } = useTranslation()
  const open = useQuickUI((s) => s.open)
  const toggleMenu = useQuickUI((s) => s.toggleMenu)
  const menuOpen = open === QUICK_MENU

  return (
    <>
      {/* 入口位置固定不动（肌肉记忆），芯片动态跟在后面 */}
      <button
        type="button"
        onClick={toggleMenu}
        aria-label={t('quick.menu.name')}
        aria-expanded={menuOpen}
        className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-text transition-transform duration-75 active:scale-95 ${
          menuOpen ? 'bg-surface-2' : ''
        }`}
      >
        <IconQuickMenu className="size-6" aria-hidden />
      </button>
      <TimerChip />
    </>
  )
}
