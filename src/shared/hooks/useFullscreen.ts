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
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      // iOS Safari 不支持元素全屏，忽略
    }
  }, [])

  const supported = typeof document.documentElement.requestFullscreen === 'function'

  return { isFullscreen, toggle, supported }
}
