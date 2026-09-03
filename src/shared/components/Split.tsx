/** 只描述**横屏**下左右两块的宽度比 —— 竖屏的高度分配是另一个维度，见 `Stack` */
type Ratio = 'even' | 'majorFirst'

/**
 * 竖屏堆叠时的高度分配。
 * 竖屏刻意不沿用横屏的偏斜比例：横向富余的是宽度（次要块窄一点仍能读），
 * 纵向富余的是行数，按固定比例压缩会直接切掉整行内容。
 *
 * - `even`：两块等分，谁也不知道对方要多高时的默认
 * - `autoFirst`：首块按内容取高、次块吃掉余量。用在首块高度有硬上限
 *   （格子数固定、放大也没用）而次块条目多、多给就多显的组合
 */
type Stack = 'even' | 'autoFirst'

// 显式映射而非拼接类名：Tailwind 编译期扫描静态字符串。
// wide:grid-rows-none 必须给：不清掉竖屏那条 grid-template-rows，
// 横屏下两块会既分列又分行，第二块被挤到不存在的第二行
const RATIO: Record<Ratio, string> = {
  even: 'wide:grid-cols-2 wide:grid-rows-none',
  majorFirst: 'wide:grid-cols-[3fr_2fr] wide:grid-rows-none',
}

const STACK: Record<Stack, string> = {
  even: 'grid-rows-2',
  autoFirst: 'grid-rows-[auto_1fr]',
}

type Props = {
  ratio?: Ratio
  stack?: Stack
  children: React.ReactNode
}

/**
 * 朝向感知的二分容器：横屏并排（宽度比见 `ratio`）、竖屏上下堆叠（高度分配见 `stack`），
 * 两种朝向都不滚动。
 * 工具页主显示区要放两块信息时用它，别自己写朝向判断 —— 判据集中在 `wide` variant。
 * 换序需求（主显示与控制栏对调）由 [ToolLayout] 负责，这里两块地位对等、顺序不变。
 */
export function Split({ ratio = 'even', stack = 'even', children }: Props) {
  return (
    <div className={`grid min-h-0 flex-1 gap-4 ${STACK[stack]} ${RATIO[ratio]}`}>{children}</div>
  )
}
