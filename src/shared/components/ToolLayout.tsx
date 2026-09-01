type Props = {
  /** 左侧控制栏：参数、按钮、破坏性操作 */
  panel: React.ReactNode
  /** 右侧主显示区：全桌要看的那块信息 */
  children: React.ReactNode
}

/**
 * 工具页横向双栏骨架。平板横屏平放在桌上时，控制区靠边给操作者、
 * 主显示区吃满剩余空间给全桌看，整页不滚动。
 * 窄屏/竖屏（<lg）退化为单列可滚 —— 前端无法强制横屏，只能保证可用。
 */
export function ToolLayout({ panel, children }: Props) {
  return (
    <div className="grid h-full min-h-0 gap-4 max-lg:overflow-y-auto lg:grid-cols-[minmax(17rem,24%)_1fr]">
      <aside className="flex min-h-0 flex-col gap-3 lg:overflow-hidden">{panel}</aside>
      <div className="flex min-h-0 flex-col gap-3 lg:overflow-hidden">{children}</div>
    </div>
  )
}
