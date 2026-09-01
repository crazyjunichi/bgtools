import { useEffect } from 'react'

/**
 * 申请屏幕常亮。桌游场景下计时器/计分板放在桌上不能息屏。
 * 不支持或被拒绝时静默降级 —— 这是增强功能，不该阻断页面。
 */
export function useWakeLock(enabled = true) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return

    let sentinel: WakeLockSentinel | null = null
    let disposed = false

    const acquire = async () => {
      if (disposed || document.visibilityState !== 'visible') return
      try {
        sentinel = await navigator.wakeLock.request('screen')
      } catch {
        // 电量过低、后台标签页等情况会拒绝，忽略
      }
    }

    // 切后台时锁会被系统释放，回到前台必须重新申请
    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel?.release()
    }
  }, [enabled])
}
