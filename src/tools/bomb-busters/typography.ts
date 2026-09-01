/**
 * 本工具自己的关键数字字号，比全局 `text-data` 默认档位更激进。
 * 依据：这里同屏只有 12 个格子 + 5 张道具，信息密度低，格子能给到 96–120px 宽，
 * 所以数字按"格子装得下的最大值"取，而不是迁就通用档位。
 *
 * 单位是 vmin 而非 vh：横屏下 vmin === vh（取值与表现和原来完全一致），
 * 竖屏下自动改按宽度算 —— 否则 820×1180 竖屏里 18vh = 212px 会把生命数字撑爆卡片。
 *
 * 上限算法：等宽字体两位数宽 ≈ 1.2em，格子最窄的场景是 1024×768 横屏
 * （拆弹区 413px / 4 列 = 96px），所以 9.5vmin @768 = 73px → 88px 宽，仍留 6px 余量。
 * 改这些值前先按最窄尺寸重算，别只看 iPad Pro。
 */
export const DATA_FONT = {
  /**
   * 生命：整屏唯一焦点，左栏（`panelWidth="narrow"`，≥208px）只放它一个数。
   * 上限校核：card 的 p-5 后剩 168px，等宽单个数字 0.6em + "/6" 的 text-3xl ≈ 36px，
   * 18vmin @820 = 148px → 88 + 36 = 124px，仍留余量（生命上限 6，永远是一位数）
   */
  lives: { fontSize: 'clamp(4rem, 18vmin, 10rem)', lineHeight: 1 },
  /** 拆弹编号：受最窄格子宽度约束 */
  wire: { fontSize: 'clamp(2rem, 9.5vmin, 6rem)', lineHeight: 1 },
  /** 道具编号：与名称、描述抢同一张卡的宽度，只能拿到剩余空间 */
  equipNo: { fontSize: 'clamp(1.5rem, 5.5vmin, 3rem)', lineHeight: 1 },
} as const
