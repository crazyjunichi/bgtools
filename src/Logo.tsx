/**
 * 站点 logo(首页顶栏用):滚动骰子,与 favicon 同一图形。
 * 骰身与弧线走 currentColor,骰点用 fill-canvas 挖空 —— 顶栏底色就是 canvas,
 * 深浅/墨水屏主题自动适配,不需要 favicon 那套 media query。
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden>
      <g transform="translate(-5 -2)">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={14}>
          <path d="M150 168a140 140 0 0 0 0 176" opacity={0.35} />
          <path d="M102 200a100 100 0 0 0 0 112" opacity={0.2} />
        </g>
        <g transform="rotate(-18 300 258)">
          <rect x={184} y={142} width={232} height={232} rx={50} fill="currentColor" />
          <g className="fill-canvas">
            <circle cx={232} cy={190} r={24} />
            <circle cx={300} cy={258} r={24} />
            <circle cx={368} cy={326} r={24} />
          </g>
        </g>
      </g>
    </svg>
  )
}
