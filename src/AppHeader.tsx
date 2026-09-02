import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { QuickBar } from './quick/QuickBar'
import { useQuickUI } from './quick/store'
import { useFullscreen } from './shared/hooks/useFullscreen'
import { IconBack, IconExitFull, IconFullscreen, IconLogo } from './shared/icons'
import type { ToolEntry } from './tools/types'

const HIDE_DELAY = 3000
const HINT_KEY = 'bgtools:chrome-hint'

/** 存不进 localStorage（隐私模式）就当已看过，别每次进来都弹 */
function readSeenHint() {
  try {
    return !!localStorage.getItem(HINT_KEY)
  } catch {
    return true
  }
}

type Props = { tool?: ToolEntry }

/**
 * 全站顶栏。返回/全屏是通用能力，不下放给各工具自己实现。
 * 工具页里的形态按朝向分两种，因为横屏最贵的是高度、竖屏最贵的是宽度：
 *
 * - **横屏**：左侧常驻窄竖条，正常参与 flex 布局占位。顶部整条留给内容，
 *   不遮挡也不需要热区；标题放不下，`sr-only` 只留给读屏
 * - **竖屏**：通栏 absolute overlay，3 秒后收起，留一条顶部热区唤出
 *
 * 两个关键约束：
 * - 竖屏的顶栏必须是 absolute overlay，绝不参与 flex 布局 —— 参与了就会在收放时
 *   改变内容区高度，跟 vh / flex-1 走的骰子和大数字会跳一下。首页与横屏侧栏正常占位
 * - 朝向差异全部走 `wide:` 覆盖，不引入 JS 判朝向：自动收起的 state 和计时在横屏
 *   照旧跑，只是位移与 pointer-events 被 `wide:` 抵消（media variant 规则后置必然赢）
 * - 由 App 传 key={tool.id}：靠重挂载重置隐藏状态，省掉在 effect 里同步 setState。
 */
export function AppHeader({ tool }: Props) {
  const { t } = useTranslation()
  const { isFullscreen, toggle, supported } = useFullscreen()
  const quickOpen = useQuickUI((s) => s.open)
  const [visible, setVisible] = useState(true)
  const [seenHint, setSeenHint] = useState(readSeenHint)
  const timer = useRef<number>(0)

  const arm = useCallback(() => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setVisible(false)
      // 提示跟着顶栏一起收，露过一次就够了
      setSeenHint(true)
      try {
        localStorage.setItem(HINT_KEY, '1')
      } catch {
        // 存不了就下次再提示一遍，无所谓
      }
    }, HIDE_DELAY)
  }, [])

  useEffect(() => {
    if (!tool) return
    // 面板开着就别再倒计时。关掉后本 effect 重跑并自动重新计时，
    // 所以 QuickBar 不必再回调 arm
    if (quickOpen !== null) {
      window.clearTimeout(timer.current)
      return
    }
    arm()
    return () => window.clearTimeout(timer.current)
  }, [tool, arm, quickOpen])

  const show = () => {
    setVisible(true)
    arm()
  }

  /*
   * tile 面板非模态、且按顶栏尺寸定位，顶栏滑走它就悬空 —— 开着期间顶栏必须留在原地。
   * 这里在渲染期派生而不是在 effect 里 setVisible(true)：后者会触发级联渲染。
   */
  const shown = visible || quickOpen !== null

  return (
    <>
      <header
        // 顶栏收起时，键盘 Tab 到返回键也能把它唤出来
        onFocus={tool ? show : undefined}
        className={`safe-t safe-x border-b border-line ${
          tool
            ? `absolute inset-x-0 top-0 z-20 bg-ink/95 backdrop-blur transition-transform duration-200 wide:static wide:z-auto wide:h-full wide:shrink-0 wide:border-r wide:border-b-0 wide:bg-ink wide:backdrop-blur-none ${
                shown
                  ? 'translate-y-0'
                  : 'pointer-events-none -translate-y-full wide:pointer-events-auto wide:translate-y-0'
              }`
            : 'shrink-0 bg-ink'
        }`}
      >
        {/* 宽度给内层而不是 header：safe-x 的刘海 padding 才能加在 64px 之外，
            手机横屏 44px 的 inset-left 不会把按钮挤扁 */}
        <div
          className={`flex h-14 w-full items-center gap-2 px-3 ${
            tool
              ? 'wide:h-full wide:w-16 wide:flex-col wide:overflow-y-auto wide:px-1 wide:py-3 short:wide:gap-1'
              : ''
          }`}
        >
          {tool ? (
            <Link
              to="/"
              className="flex size-12 items-center justify-center rounded-xl text-text-muted active:scale-95"
              aria-label={t('header.back')}
            >
              <IconBack className="size-6" aria-hidden />
            </Link>
          ) : (
            <IconLogo className="ml-2 size-6 text-text" aria-hidden />
          )}
          {/* 横屏侧栏只有 64px，塞不下标题；用 sr-only 而非 hidden，读屏仍报得出当前工具 */}
          <h1 className={`flex-1 truncate text-lg font-semibold ${tool ? 'wide:sr-only' : ''}`}>
            {tool ? `${tool.icon} ${t(tool.nameKey)}` : t('app.title')}
          </h1>
          {/* 小工具的 tile 面板入口 + 正在跑的计时器芯片 */}
          <QuickBar />
          {supported && (
            <button
              type="button"
              onClick={() => {
                toggle()
                if (tool) arm()
              }}
              className="flex size-12 items-center justify-center rounded-xl text-text-muted active:scale-95"
              aria-label={t(isFullscreen ? 'header.exitFullscreen' : 'header.enterFullscreen')}
            >
              {isFullscreen ? (
                <IconExitFull className="size-5" aria-hidden />
              ) : (
                <IconFullscreen className="size-5" aria-hidden />
              )}
            </button>
          )}
        </div>
      </header>

      {/* 收起后留一条全宽 16px 热区 + 小把手：平板平放时顶边够不着精准目标，热区要好命中 */}
      {tool && !shown && (
        <button
          type="button"
          /*
           * 必须是 onClick，不许改回 onPointerDown 图那点响应速度。
           * pointerdown 里 setVisible 会当场卸载本热区、同时把顶栏滑到手指底下；
           * 触屏抬手后补发的兼容鼠标事件按**抬手坐标**重新 hit-test，click 就落到
           * 顶栏上了 —— 右侧误开 quick 浮层，左侧直接点掉返回键跳回首页。
           * click 在抬手后才触发，那时布局还没动过，不会有后续的幽灵点击。
           */
          onClick={show}
          aria-label={t('header.show')}
          className="safe-t absolute inset-x-0 top-0 z-20 flex h-4 justify-center wide:hidden"
        >
          <span className="mt-1 h-1 w-10 rounded-full bg-surface-3" aria-hidden />
        </button>
      )}

      {tool && shown && !seenHint && (
        <p className="pointer-events-none absolute inset-x-0 top-16 z-20 text-center text-sm text-text-dim wide:hidden">
          {t('header.hint')}
        </p>
      )}
    </>
  )
}
