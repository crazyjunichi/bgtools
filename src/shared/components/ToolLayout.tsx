/**
 * 左栏宽度档。`narrow` 给「控制栏只有一个读数 + 一个入口」的工具（如炸弹克星的生命），
 * 那种内容撑不满默认档，省下的宽度应该让给主显示区。
 * 两档的 `minmax()` 下限都是"`card` 内距之后仍够两个按钮并排"，**不要再往下调**
 * —— 取值依据见 docs/DESIGN.md §5。
 */
type PanelWidth = 'default' | 'narrow'

// 显式映射而非拼接类名：Tailwind 编译期扫描静态字符串
const PANEL_COLS: Record<PanelWidth, string> = {
  default: 'wide:grid-cols-[minmax(17rem,24%)_1fr]',
  narrow: 'wide:grid-cols-[minmax(13rem,17%)_1fr]',
}

type Props = {
  /** 左侧控制栏：参数、按钮、破坏性操作 */
  panel: React.ReactNode
  /** 横屏下左栏宽度档，默认 `default`；竖屏无效（控制栏一律通栏贴底） */
  panelWidth?: PanelWidth
  /** 右侧主显示区：全桌要看的那块信息 */
  children: React.ReactNode
}

/**
 * 工具页骨架，朝向切换集中在这里 —— 工具页不写一行朝向代码也能在竖屏可用。
 *
 * - 横屏（`wide`，主场景）：控制区靠左给操作者（宽度档见 `panelWidth`），主显示区吃满剩余宽度给全桌看
 * - 竖屏：主显示区在上、控制栏贴底（拇指够得到），仍然一屏不翻页；
 *   控制栏限高，内容过高时只在自己的框里滚，页面级不滚动
 *
 * 判据是 `wide`（orientation）而不是宽度断点：见 [index.css] 里的说明。
 */
export function ToolLayout({ panel, panelWidth = 'default', children }: Props) {
  return (
    <div
      className={`grid h-full min-h-0 grid-rows-[1fr_auto] gap-4 wide:grid-rows-none ${PANEL_COLS[panelWidth]}`}
    >
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
