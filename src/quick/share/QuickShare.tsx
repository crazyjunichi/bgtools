import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Qr } from '../../shared/components/Qr'
import { IconCheck, IconCopy, IconShare } from '../../shared/icons'
import { canCopyText, copyText } from '../../shared/match/share/summary'

/** 「已复制」勾号停留一会就退回原样 */
const COPIED_MS = 2000

/**
 * 分享本站：把当前页面（含 hash 路由）的完整 URL 出示成二维码，别的设备扫了打开同一页。
 * 链接怎么被认领是扫码端的事，约定见 [qrLink.ts](../../shared/qrLink.ts)。
 * 纯瞬态没有 store：打开时取一次地址，关掉什么都不留。
 */
export function QuickShare() {
  const { t } = useTranslation()
  // dialog 开着期间底下的页面不会跳走，打开那一刻的地址就是要分享的
  const [url] = useState(() => location.href)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!(await copyText(url))) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), COPIED_MS)
  }

  const share = async () => {
    try {
      await navigator.share({ title: document.title, url })
    } catch {
      // 用户在系统面板里取消也算正常结束
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 二维码近正方形、宽高同时受限，视口单位按规则取 vmin */}
      <Qr value={url} label={url} className="size-[min(20rem,50vmin)] rounded-xl" />
      <p className="w-full truncate text-center text-xs text-text-muted">{url}</p>
      <p className="text-xs text-text-dim">
        {t('quick.share.builtAt', { time: new Date(__BUILD_TIME__).toLocaleString() })}
      </p>
      <div className="flex w-full gap-2">
        {canCopyText() && (
          <button type="button" onClick={() => void copy()} className="btn-base flex-1 gap-2 bg-surface-2">
            {copied ? (
              <IconCheck className="size-6 text-emerald-300 short:size-5" aria-hidden />
            ) : (
              <IconCopy className="size-6 short:size-5" aria-hidden />
            )}
            {copied ? t('quick.share.copied') : t('quick.share.copyLink')}
          </button>
        )}
        {typeof navigator.share === 'function' && (
          <button type="button" onClick={() => void share()} className="btn-base flex-1 gap-2 bg-surface-2">
            <IconShare className="size-6 short:size-5" aria-hidden />
            {t('quick.share.shareBtn')}
          </button>
        )}
      </div>
    </div>
  )
}
