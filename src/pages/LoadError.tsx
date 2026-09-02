import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { IconRepeat } from '../shared/icons'

/**
 * 懒加载的工具页取不到 chunk 时的兜底（路由 errorElement）。
 *
 * 这里**不自动重载** —— [staleChunk](../shared/staleChunk.ts) 已经在 preloadError
 * 那一刻试过一次，走到这个界面说明重载也没救回来，再自动刷就是刷屏。
 */
export default function LoadError() {
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <p className="text-lg text-text-muted">{t('loadError.text')}</p>
      <p className="max-w-sm text-sm text-text-dim">{t('loadError.hint')}</p>
      <button
        type="button"
        onClick={() => location.reload()}
        className="btn-quiet gap-2 px-6 text-base"
      >
        <IconRepeat className="size-5" aria-hidden />
        {t('loadError.retry')}
      </button>
      <Link to="/" className="text-sm text-text-dim underline">
        {t('notFound.home')}
      </Link>
    </div>
  )
}
