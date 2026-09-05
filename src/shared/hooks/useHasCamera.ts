import { useEffect, useState } from 'react'

/**
 * 设备是否有摄像头，用于扫码入口的显隐。
 * 首帧 false（确认有才显示）：无摄像头的桌面不该看到按钮闪一下再消失，
 * 代价是有摄像头的设备入口晚一拍出现。
 * enumerateDevices 无需摄像头权限即可列出设备（未授权时 label 被掩码，kind 可用）。
 */
export function useHasCamera(): boolean {
  const [has, setHas] = useState(false)

  useEffect(() => {
    // 非安全上下文（http、旧 WebView）下 mediaDevices 整个不存在，DOM 类型却标着必有
    const md = navigator.mediaDevices as MediaDevices | undefined
    if (!md?.enumerateDevices) return
    let cancelled = false
    const check = () => {
      md.enumerateDevices()
        .then((devices) => {
          if (!cancelled) setHas(devices.some((d) => d.kind === 'videoinput'))
        })
        .catch(() => {
          // 枚举失败只是"不确定"，保守显示 —— 扫码页里还有 denied/noCamera 文案兜底
          if (!cancelled) setHas(true)
        })
    }
    check()
    // 热插拔摄像头时重判
    md.addEventListener('devicechange', check)
    return () => {
      cancelled = true
      md.removeEventListener('devicechange', check)
    }
  }, [])

  return has
}
