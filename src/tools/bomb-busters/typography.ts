/**
 * 本工具自己的关键数字字号，比全局 `text-data` 默认档位更激进 —— 同屏只有 12 个格子
 * 加 5 张装备，信息密度低，数字按"容器装得下的最大值"取而不是迁就通用档位。
 *
 * 单位必须是 vmin 而非 vh：竖屏下 vh 取的是长边，会把数字撑爆容器。
 *
 * 改这里任何一个值都要按**最窄视口**重算上限，别只看 iPad Pro。
 * 各档的容器宽度与校核过程见 [docs/DESIGN.md](../../../docs/DESIGN.md) §3「字号上限的推导」。
 */
export const DATA_FONT = {
  /**
   * 生命：左栏（`panelWidth="narrow"`）的读数。**故意不顶容器上限** ——
   * 它不再靠 `flex-1` 撑满左栏，让出的高度给栏底的局面快捷键，
   * 焦点地位改由整卡色带承担（生命上限 6，永远是一位数，压小也远超可读下限）。
   */
  lives: { fontSize: 'clamp(3rem, 11vmin, 6rem)', lineHeight: 1 },
  /** 拆弹编号：三档里唯一顶着上限的，受最窄格子宽度约束 */
  wire: { fontSize: 'clamp(2rem, 9.5vmin, 6rem)', lineHeight: 1 },
  /** 装备编号：与名称、描述抢同一张卡的宽度，只能拿到剩余空间 */
  equipNo: { fontSize: 'clamp(1.5rem, 5.5vmin, 3rem)', lineHeight: 1 },
} as const
