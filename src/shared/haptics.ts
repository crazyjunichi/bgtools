/** 触感反馈。桌面浏览器与 iOS Safari 无 vibrate，静默忽略 */
export function buzz(pattern: number | number[] = 12) {
  navigator.vibrate?.(pattern)
}
