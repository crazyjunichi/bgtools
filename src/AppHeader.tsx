import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { QuickBar } from './quick/QuickBar'
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
 * 全站顶栏。返回/全屏是通用能力，不下放给各工具自己实现；
 * 但横屏平板上 57px 的通栏是最贵的空间，所以在工具页里 3 秒后自动收起，
 * 留一条顶部热区唤出。
 *
 * 两个关键约束：
 * - 工具页的顶栏是 absolute overlay，绝不参与 flex 布局 —— 参与了就会在收放时
 *   改变内容区高度，跟 vh / flex-1 走的骰子和大数字会跳一下。首页正常占位。
 * - 由 App 传 key={tool.id}：靠重挂载重置隐藏状态，省掉在 effect 里同步 setState。
 */
export function AppHeader({ tool }: Props) {
  const { isFullscreen, toggle, supported } = useFullscreen()
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
    arm()
    return () => window.clearTimeout(timer.current)
  }, [tool, arm])

  const show = () => {
    setVisible(true)
    arm()
  }

  return (
    <>
      <header
        // 顶栏收起时，键盘 Tab 到返回键也能把它唤出来
        onFocus={tool ? show : undefined}
        className={`safe-t safe-x border-b border-line ${
          tool
            ? `absolute inset-x-0 top-0 z-20 bg-ink/95 backdrop-blur transition-transform duration-200 ${
                visible ? 'translate-y-0' : 'pointer-events-none -translate-y-full'
              }`
            : 'shrink-0 bg-ink'
        }`}
      >
        <div className="flex h-14 w-full items-center gap-2 px-3">
          {tool ? (
            <Link
              to="/"
              className="flex size-12 items-center justify-center rounded-xl text-text-muted active:scale-95"
              aria-label="返回首页"
            >
              <IconBack className="size-6" aria-hidden />
            </Link>
          ) : (
            <IconLogo className="ml-2 size-6 text-text" aria-hidden />
          )}
          <h1 className="flex-1 truncate text-lg font-semibold">
            {tool ? `${tool.icon} ${tool.name}` : '桌游工具箱'}
          </h1>
          {/* 骰子/计时器这类通用小工具的入口：任何工具页里都要能随手用一下 */}
          <QuickBar onOpen={tool ? arm : undefined} />
          {supported && (
            <button
              type="button"
              onClick={() => {
                toggle()
                if (tool) arm()
              }}
              className="flex size-12 items-center justify-center rounded-xl text-text-muted active:scale-95"
              aria-label={isFullscreen ? '退出全屏' : '进入全屏'}
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
      {tool && !visible && (
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
          aria-label="显示顶栏"
          className="safe-t absolute inset-x-0 top-0 z-20 flex h-4 justify-center"
        >
          <span className="mt-1 h-1 w-10 rounded-full bg-surface-3" aria-hidden />
        </button>
      )}

      {tool && visible && !seenHint && (
        <p className="pointer-events-none absolute inset-x-0 top-16 z-20 text-center text-sm text-text-dim">
          顶栏会自动隐藏 · 轻点屏幕顶部可唤出
        </p>
      )}
    </>
  )
}
