/**
 * 文本输入框的一套类名（条目改名、模板搜索、首页筛选）。
 *
 * **下划线式，不要加回四边描边、圆角或底色。** 两个理由：站内「圆角 + 描边 + 实底」正是
 * `btn-quiet` 的形，框式输入框在同屏按钮旁边读起来像个按钮；而首页是印刷版式（卡片与
 * 分区都只用规则线），一个圆角实底盒子会成为整页最重的块。取值依据见 DESIGN.md §5。
 *
 * 高度比主操作矮一档 —— 它是控制条，不是主操作。
 *
 * 是个常量而不是组件：调用点还要往上叠 `pl-*` / `pr-*`，给搜索图标和清除键让位。
 */
export const FIELD =
  'min-h-12 w-full border-b-2 border-line bg-transparent px-1 text-base text-text outline-none placeholder:text-text-dim focus:border-sky-400 short:min-h-10'
