import { useTranslation } from 'react-i18next'
import { IconQuickMenu } from '../shared/icons'
import { quickTools } from './registry'
import { QUICK_MENU, useQuickUI } from './store'
import { TimerChip } from './timer/TimerChip'

/**
 * 首页顶栏直达的那几个。判据借 `onHome` 的**反面**：不进首页宫格的正是配置类工具，
 * 首页顶栏本来就该只放它们 —— 别在这里另写一份 id 名单，注册表才是真源。
 *
 * `needsMatch` 的再排除掉：首页不存在"当前这一局"，那些工具在这儿没有候选。
 * 可以在模块顶层算完，因为首页永远不会有席位。
 */
const DIRECT = quickTools.filter((tool) => !tool.onHome && !tool.needsMatch)

const BTN =
  'flex size-12 shrink-0 items-center justify-center rounded-xl text-text transition-transform duration-75 active:scale-95'

/**
 * 栏上的小工具入口，形态按所在页面分两种：
 *
 * - **工具页**：一个 tile 面板开关（[QuickMenu](QuickMenu.tsx)）收纳全部五个。
 *   工具页的横屏侧栏只有 64px，逐个平铺放不下，也会跟工具自己的控件抢注意力
 * - **首页**：不要抽屉，直接放配置类的那两个。骰子/计时器/指针在首页宫格里
 *   已有大卡，抽屉在这儿只是多一层点击
 *
 * 两种形态都只 dispatch，面板与浮层由 App 层的 [QuickLayer](QuickLayer.tsx) 渲染。
 */
export function QuickBar({ home = false }: { home?: boolean }) {
  const { t } = useTranslation()
  const open = useQuickUI((s) => s.open)
  const openTool = useQuickUI((s) => s.openTool)
  const toggleMenu = useQuickUI((s) => s.toggleMenu)
  const menuOpen = open === QUICK_MENU

  return (
    <>
      {/* 入口位置固定不动（肌肉记忆），芯片动态跟在后面 */}
      {home ? (
        DIRECT.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => openTool(tool.id)}
            aria-label={t(tool.nameKey)}
            className={BTN}
          >
            <tool.icon className="size-6" aria-hidden />
          </button>
        ))
      ) : (
        <button
          type="button"
          onClick={toggleMenu}
          aria-label={t('quick.menu.name')}
          aria-expanded={menuOpen}
          className={`${BTN} ${menuOpen ? 'bg-surface-2' : ''}`}
        >
          <IconQuickMenu className="size-6" aria-hidden />
        </button>
      )}
      <TimerChip />
    </>
  )
}
