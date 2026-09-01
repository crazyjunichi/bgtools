import { useCallback, useEffect, useState } from 'react'

export function useFullscreen() {
  const [isFullscreen, setFullscreen] = useState(() => !!document.fullscreenElement)

  useEffect(() => {
    const sync = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        // 先解锁再退出：反过来的话锁已随全屏一起失效，unlock 会抛
        try {
          screen.orientation?.unlock()
        } catch {
          // 没锁成功过自然也解不了，无所谓
        }
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
        // 锁横屏只有"全屏 + Android Chrome"这一条路走得通，iOS Safari 没有这个 API。
        // 拿不到就算了 —— 竖屏本身是可用布局，不为此弹"请旋转设备"挡住内容
        try {
          await screen.orientation?.lock('landscape')
        } catch {
          // 桌面浏览器 / iOS 一律走这里
        }
      }
    } catch {
      // iOS Safari 不支持元素全屏，忽略
    }
  }, [])

  const supported = typeof document.documentElement.requestFullscreen === 'function'

  return { isFullscreen, toggle, supported }
}
