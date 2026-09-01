type Props = {
  /** 左侧控制栏：参数、按钮、破坏性操作 */
  panel: React.ReactNode
  /** 右侧主显示区：全桌要看的那块信息 */
  children: React.ReactNode
}

/**
 * 工具页骨架，朝向切换集中在这里 —— 工具页不写一行朝向代码也能在竖屏可用。
 *
 * - 横屏（`wide`，主场景）：控制区靠左给操作者，主显示区吃满剩余宽度给全桌看
 * - 竖屏：主显示区在上、控制栏贴底（拇指够得到），仍然一屏不翻页；
 *   控制栏内容过高时只在自己的框里滚（`max-h-[45dvh]`），页面级不滚动
 *
 * 判据是 `wide`（orientation）而不是宽度断点：见 [index.css] 里的说明。
 */
export function ToolLayout({ panel, children }: Props) {
  return (
    <div className="grid h-full min-h-0 grid-rows-[1fr_auto] gap-4 wide:grid-cols-[minmax(17rem,24%)_1fr] wide:grid-rows-none">
      {/* order 让 DOM 顺序保持"控制在前"（读屏与 Tab 顺序更自然），视觉上竖屏才下沉 */}
      <aside className="order-2 flex max-h-[45dvh] min-h-0 flex-col gap-3 overflow-y-auto wide:order-1 wide:max-h-none wide:overflow-hidden">
        {panel}
      </aside>
      <div className="order-1 flex min-h-0 flex-col gap-3 overflow-hidden wide:order-2">
        {children}
      </div>
    </div>
  )
}
