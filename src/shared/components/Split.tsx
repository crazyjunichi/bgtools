/** 只描述**横屏**下左右两块的宽度比 —— 竖屏一律等分，理由见下 */
type Ratio = 'even' | 'majorFirst'

// 显式映射而非拼接类名：Tailwind 编译期扫描静态字符串。
// 两点约束：
// - wide:grid-rows-none 必须给：不清掉竖屏那条 grid-template-rows，
//   横屏下两块会既分列又分行，第二块被挤到不存在的第二行
// - 竖屏不沿用横屏的偏斜比例。横向富余的是宽度（次要块窄一点仍能读），
//   纵向富余的是行数，压缩次要块高度会直接切掉整行内容 —— 所以竖屏等分
const RATIO: Record<Ratio, string> = {
  even: 'grid-rows-2 wide:grid-cols-2 wide:grid-rows-none',
  majorFirst: 'grid-rows-2 wide:grid-cols-[3fr_2fr] wide:grid-rows-none',
}

type Props = {
  ratio?: Ratio
  children: React.ReactNode
}

/**
 * 朝向感知的二分容器：横屏并排、竖屏上下等分堆叠，两种朝向都不滚动。
 * 工具页主显示区要放两块信息时用它，别自己写朝向判断 —— 判据集中在 `wide` variant。
 * 换序需求（主显示与控制栏对调）由 [ToolLayout] 负责，这里两块地位对等、顺序不变。
 */
export function Split({ ratio = 'even', children }: Props) {
  return <div className={`grid min-h-0 flex-1 gap-4 ${RATIO[ratio]}`}>{children}</div>
}
