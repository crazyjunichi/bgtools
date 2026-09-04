import jsQR from 'jsqr'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { sitePathOf } from '../../shared/qrLink'
import { useQuickUI } from '../store'

type Status = 'starting' | 'scanning' | 'denied' | 'noCamera' | 'unsupported'

/** 同一画面每帧都会解出同一个码，冷却期内不重复触发 */
const RETRIGGER_MS = 3000
/** 抽帧超过这个尺寸只白耗 CPU，对识别率没有提升 */
const MAX_FRAME = 720

/** 非安全上下文（http、旧 WebView）下 mediaDevices 整个不存在，DOM 类型却标着必有 */
function mediaDevices(): MediaDevices | undefined {
  return navigator.mediaDevices as MediaDevices | undefined
}

/**
 * 扫二维码打开本站链接（目前唯一的来源是扫码发牌的 join 码）。
 * 纯瞬态没有 store：dialog 关掉相机即释放，扫到的结果也只是一个动作 —— 跳转。
 */
export function QuickScan() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const close = useQuickUI((s) => s.close)
  const videoRef = useRef<HTMLVideoElement>(null)
  // 环境不支持相机时连「正在打开」都不该闪一下，所以首帧就算出来，不进 effect
  const [status, setStatus] = useState<Status>(() =>
    mediaDevices()?.getUserMedia ? 'starting' : 'unsupported',
  )
  const [badLink, setBadLink] = useState(false)

  useEffect(() => {
    const md = mediaDevices()
    if (!md?.getUserMedia) return
    let cancelled = false
    let stream: MediaStream | null = null
    let raf = 0
    let badTimer = 0
    let lastText = ''
    let lastAt = 0
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const onCode = (text: string) => {
      const path = sitePathOf(text)
      if (path) {
        close()
        navigate(path)
        return
      }
      setBadLink(true)
      badTimer = window.setTimeout(() => setBadLink(false), RETRIGGER_MS)
    }

    const tick = () => {
      const video = videoRef.current
      if (video && ctx && video.readyState >= video.HAVE_CURRENT_DATA) {
        const scale = Math.min(1, MAX_FRAME / Math.max(video.videoWidth, video.videoHeight))
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(frame.data, frame.width, frame.height)
        if (code) {
          const now = Date.now()
          if (code.data !== lastText || now - lastAt > RETRIGGER_MS) {
            lastText = code.data
            lastAt = now
            onCode(code.data)
          }
        }
      }
      raf = requestAnimationFrame(tick)
    }

    md.getUserMedia({ audio: false, video: { facingMode: 'environment' } })
      .then((s) => {
        // 权限弹窗期间 dialog 可能已被关掉：拿到流也要立刻还回去
        if (cancelled || !videoRef.current) {
          s.getTracks().forEach((track) => track.stop())
          return
        }
        stream = s
        videoRef.current.srcObject = s
        void videoRef.current.play()
        setStatus('scanning')
        raf = requestAnimationFrame(tick)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setStatus(
          err instanceof DOMException && err.name === 'NotFoundError' ? 'noCamera' : 'denied',
        )
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.clearTimeout(badTimer)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [close, navigate])

  const failure =
    status === 'starting'
      ? t('quick.scan.starting')
      : status === 'denied'
        ? t('quick.scan.denied')
        : status === 'noCamera'
          ? t('quick.scan.noCamera')
          : status === 'unsupported'
            ? t('quick.scan.unsupported')
            : null

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 预览近正方形、宽高同时受限，视口单位按规则取 vmin */}
      <div className="relative size-[min(22rem,55vmin)] overflow-hidden rounded-xl bg-ink">
        <video ref={videoRef} playsInline muted className="size-full object-cover" />
        {failure && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-text-muted">
            {failure}
          </div>
        )}
      </div>
      {/* min-h 占位：提示出现/消失时预览不跟着跳 */}
      <p className={`min-h-6 text-sm ${badLink ? 'text-amber-300' : 'text-text-muted'}`}>
        {badLink ? t('quick.scan.badLink') : t('quick.scan.hint')}
      </p>
    </div>
  )
}
