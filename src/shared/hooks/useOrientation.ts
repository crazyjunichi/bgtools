import { useCallback, useEffect, useState } from 'react'

/**
 * 屏幕朝向切换（两态：竖屏 / 横屏直选，没有「回到跟随系统」）。
 * 入口在设置面板（quick/settings）—— 点按频率低，不占顶栏。
 *
 * **全屏是锁朝向的前提，不是目的**：`screen.orientation.lock()` 只在全屏或已安装的
 * PWA（manifest `display: fullscreen`）下才生效，所以 set 里未全屏就先
 * requestFullscreen。装成 PWA 后这一步无感，浏览器里则顺带把浏览器 UI 也收掉。
 *
 * 桌面浏览器与 iOS Safari 的 lock 一律 reject —— **静默失败**，横竖屏都是可用布局，
 * 不为此弹「请旋转设备」挡住内容。
 */

/** 两条路都没有才不显示朝向选项：只要还能全屏，这个设置就仍有作用 */
export const canRotate =
  typeof screen.orientation?.lock === 'function' ||
  typeof document.documentElement.requestFullscreen === 'function'

export type Orientation = 'portrait' | 'landscape'

export function useOrientation() {
  const [landscape, setLandscape] = useState(
    () => window.matchMedia('(orientation: landscape)').matches,
  )

  /*
   * 用 matchMedia 而不是 screen.orientation.type：后者在 iOS Safari 整个缺失，
   * 而选中态得跟真实朝向一致。判据也跟布局用的 wide variant 是同一条 media query，
   * 不会出现选项说横屏、布局仍按竖屏排的分歧
   */
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)')
    const sync = () => setLandscape(mq.matches)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const set = useCallback(
    async (target: Orientation) => {
      if ((target === 'landscape') === landscape) return
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
      } catch {
        // iOS Safari 不支持元素全屏；下面的 lock 照样试一次
      }
      try {
        await screen.orientation?.lock(target)
      } catch {
        // 桌面浏览器 / iOS 一律走这里
      }
    },
    [landscape],
  )

  return { landscape, set }
}
