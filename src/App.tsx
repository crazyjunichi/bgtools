import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router-dom'
import { AppHeader } from './AppHeader'
import { QuickLayer } from './quick/QuickLayer'
import { htmlLangOf } from './shared/i18n'
import { findTool } from './tools/registry'
import { UpdatePrompt } from './UpdatePrompt'

/**
 * 内容区内距。**刘海与基础内距必须 calc 相加**：拆成 safe-x / px-* 两条规则写在同一个
 * 元素上是同一个 padding，会互相覆盖，刘海一赢内容就直接贴到屏幕边上。
 * 顶部不在这里，见下面的三元 —— 两种页面该不该让出顶部刘海是相反的。
 */
const PAD =
  'pb-[calc(0.5rem_+_env(safe-area-inset-bottom))] ps-[calc(0.5rem_+_env(safe-area-inset-left))] pe-[calc(0.5rem_+_env(safe-area-inset-right))]'

export default function App() {
  const { pathname } = useLocation()
  const tool = findTool(pathname)
  const { t, i18n } = useTranslation()

  /*
   * <html lang> 与标签页标题跟着语言走。index.html 里的值只是首帧默认，
   * 这里补上运行时切换；vite.config 的 PWA manifest 是构建期静态的，改不了。
   */
  useEffect(() => {
    document.documentElement.lang = htmlLangOf(i18n.language)
    document.title = t('app.title')
  }, [t, i18n.language])

  return (
    // 高度锁死一屏：内容超出必须让布局自己收缩，而不是悄悄变成可滚页面。
    // h-full（而非 h-dvh）继承 html/body 的 100% —— PWA standalone 下 dvh 会把状态栏算进去
    // relative 是顶栏 overlay 的定位上下文
    // 工具页横屏下顶栏变成左侧常驻竖条，外壳跟着换主轴（首页始终是通栏顶栏）
    <div
      className={`relative flex h-full overflow-hidden ${tool ? 'flex-col wide:flex-row' : 'flex-col'}`}
    >
      {/* key 让换页时重挂载，顶栏的隐藏状态自然回到初始值 */}
      <AppHeader key={tool?.id ?? 'home'} tool={tool} />

      {/* 顶部内距二选一而不是叠加覆盖：工具页竖屏顶栏是 overlay，那份刘海只能由内容区
          自己让出；首页顶栏正常占位，已经把它吃掉了，这里再让一次就白空一条 */}
      <main
        className={`min-h-0 w-full min-w-0 flex-1 overflow-hidden ${PAD} ${
          tool ? 'pt-[calc(0.5rem_+_env(safe-area-inset-top))]' : 'pt-2'
        }`}
      >
        <Outlet />
      </main>

      {/* 排在 QuickLayer 前面：两者同为 z-30，浮层开着时新版本提示该被压住 */}
      <UpdatePrompt />

      {/* 故意不给 key：换页也不能重挂载，否则正在跑的计时会被打断。
          sidebar 只影响 tile 面板的定位（工具页横屏顶栏在左侧），不参与挂载身份 */}
      <QuickLayer sidebar={!!tool} />
    </div>
  )
}
