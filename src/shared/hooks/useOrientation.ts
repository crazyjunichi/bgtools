import { useCallback, useEffect, useState } from 'react'

/**
 * 屏幕朝向切换（两态：点一下锁到另一个朝向，没有「回到跟随系统」）。
 *
 * **全屏是锁朝向的前提，不是目的**：`screen.orientation.lock()` 只在全屏或已安装的
 * PWA（manifest `display: fullscreen`）下才生效，所以 toggle 里未全屏就先
 * requestFullscreen。装成 PWA 后这一步无感，浏览器里则顺带把浏览器 UI 也收掉。
 *
 * 桌面浏览器与 iOS Safari 的 lock 一律 reject —— **静默失败**，横竖屏都是可用布局，
 * 不为此弹「请旋转设备」挡住内容。
 */

/** 两条路都没有才隐藏按钮：只要还能全屏，这个键就仍有作用 */
export const canRotate =
  typeof screen.orientation?.lock === 'function' ||
  typeof document.documentElement.requestFullscreen === 'function'

export function useOrientation() {
  const [landscape, setLandscape] = useState(
    () => window.matchMedia('(orientation: landscape)').matches,
  )

  /*
   * 用 matchMedia 而不是 screen.orientation.type：后者在 iOS Safari 整个缺失，
   * 而按钮的 aria-label 得说对「按下去会变成什么」。判据也跟布局用的 wide variant
   * 是同一个 media query，不会出现按钮说横屏、布局仍按竖屏排的分歧
   */
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)')
    const sync = () => setLandscape(mq.matches)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const toggle = useCallback(async () => {
    const target = landscape ? 'portrait' : 'landscape'
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
  }, [landscape])

  return { landscape, toggle }
}
