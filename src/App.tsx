import { Link, Outlet, useLocation } from 'react-router-dom'
import { useFullscreen } from './shared/hooks/useFullscreen'
import { findTool } from './tools/registry'

export default function App() {
  const { pathname } = useLocation()
  const tool = findTool(pathname)
  const { isFullscreen, toggle, supported } = useFullscreen()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="safe-t safe-x sticky top-0 z-10 border-b border-line bg-ink/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-2 px-3">
          {tool ? (
            <Link
              to="/"
              className="flex size-10 items-center justify-center rounded-xl text-xl text-slate-300 active:scale-95"
              aria-label="返回首页"
            >
              ←
            </Link>
          ) : (
            <span className="ml-1 text-xl">🎯</span>
          )}
          <h1 className="flex-1 truncate text-base font-semibold">
            {tool ? `${tool.icon} ${tool.name}` : '桌游工具箱'}
          </h1>
          {supported && (
            <button
              type="button"
              onClick={toggle}
              className="flex size-10 items-center justify-center rounded-xl text-slate-400 active:scale-95"
              aria-label={isFullscreen ? '退出全屏' : '进入全屏'}
            >
              {isFullscreen ? '⤡' : '⤢'}
            </button>
          )}
        </div>
      </header>

      <main className="safe-b safe-x mx-auto w-full max-w-3xl flex-1 px-3 py-4">
        <Outlet />
      </main>
    </div>
  )
}
