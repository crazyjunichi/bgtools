import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { QuickBar } from './quick/QuickBar'
import { useBackOverride } from './shared/backOverride'
import { useHeaderTitle } from './shared/headerTitle'
import { IconBack, IconLogo } from './shared/icons'
import type { ToolEntry } from './tools/types'

type Props = { tool?: ToolEntry }

/**
 * 全站顶栏。返回是通用能力，不下放给各工具自己实现。
 * 工具页里的形态按朝向分两种，因为横屏最贵的是高度、竖屏最贵的是宽度：
 *
 * - **横屏**：左侧常驻窄竖条。顶部整条留给内容；标题放不下，`sr-only` 只留给读屏
 * - **竖屏**：通栏常显。竖屏是更常见的朝向，返回键必须一直够得着
 *
 * 两种形态都**正常参与 flex 布局占位**（旧方案是竖屏 absolute overlay + 3 秒自动收起 +
 * 顶部热区唤出，为的是把那条高度还给内容；常显之后那套机制没了存在理由，一并删掉）。
 * 朝向差异全部走 `wide:` 覆盖，不引入 JS 判朝向。
 */
export function AppHeader({ tool }: Props) {
  const { t } = useTranslation()
  // 工具内子视图注册的返回接管（如狼人真言的主持页）：有它时返回回工具入口而非首页
  const onBack = useBackOverride((s) => s.onBack)
  // 工具页对标题的临时接管（如计分纸从游戏卡进入时显示那盒游戏），见 shared/headerTitle
  const titleOverride = useHeaderTitle((s) => s.title)

  return (
    <header
      className={`safe-t safe-x ${
        tool
          ? 'shrink-0 border-b border-line bg-canvas wide:h-full wide:border-r wide:border-b-0'
          : // 首页是印刷版式：页眉那条规则线要粗且亮，跟区块的细分隔线分出层级
            'shrink-0 border-b-2 border-text bg-canvas'
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
          onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex size-12 items-center justify-center rounded-xl text-text-muted active:scale-95"
              aria-label={t('header.backInTool')}
            >
              <IconBack className="size-6" aria-hidden />
            </button>
          ) : (
            <Link
              to="/"
              className="flex size-12 items-center justify-center rounded-xl text-text-muted active:scale-95"
              aria-label={t('header.back')}
            >
              <IconBack className="size-6" aria-hidden />
            </Link>
          )
        ) : (
          <IconLogo className="ml-2 size-6 text-text" aria-hidden />
        )}
        {/* 横屏侧栏只有 64px，塞不下标题；用 sr-only 而非 hidden，读屏仍报得出当前工具 */}
        <h1
          className={`flex-1 truncate ${
            tool
              ? 'text-lg font-semibold wide:sr-only'
              : // 与首页区块标题同一套字距，负 me 吃掉末字后面那份
                '-me-[0.25em] text-base font-bold tracking-[0.25em]'
          }`}
        >
          {tool
            ? `${titleOverride?.icon ?? tool.icon} ${t(titleOverride?.nameKey ?? tool.nameKey)}`
            : t('app.title')}
        </h1>
        {/* 小工具入口（首页直达配置类那两个，工具页收进 tile 面板）+ 计时器芯片 */}
        <QuickBar home={!tool} />
      </div>
    </header>
  )
}
