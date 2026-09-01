import { Outlet, useLocation } from 'react-router-dom'
import { AppHeader } from './AppHeader'
import { QuickLayer } from './quick/QuickLayer'
import { findTool } from './tools/registry'

export default function App() {
  const { pathname } = useLocation()
  const tool = findTool(pathname)

  return (
    // 高度锁死一屏：内容超出必须让布局自己收缩，而不是悄悄变成可滚页面。
    // h-full（而非 h-dvh）继承 html/body 的 100% —— PWA standalone 下 dvh 会把状态栏算进去
    // relative 是顶栏 overlay 的定位上下文
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* key 让换页时重挂载，顶栏的隐藏状态自然回到初始值 */}
      <AppHeader key={tool?.id ?? 'home'} tool={tool} />

      {/* 工具页顶栏不占位，safe-t 得由内容区自己让出刘海 */}
      <main
        className={`safe-b safe-x min-h-0 w-full flex-1 overflow-hidden px-4 py-3 ${
          tool ? 'safe-t' : ''
        }`}
      >
        <Outlet />
      </main>

      {/* 故意不给 key：换页也不能重挂载，否则正在跑的计时会被打断 */}
      <QuickLayer />
    </div>
  )
}
