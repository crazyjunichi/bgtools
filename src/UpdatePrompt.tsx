import { useTranslation } from 'react-i18next'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { IconClose, IconUpdate } from './shared/icons'

/**
 * 新版本提示条。PWA 的更新策略是 prompt 而非 autoUpdate（理由见 vite.config.ts）：
 * 新 SW 装好后先停在 waiting，旧页面继续用完整的旧缓存，直到用户点这里才接管并重载。
 * 代价是不点就一直停在旧版，所以这条提示不能做得太隐蔽。
 *
 * 只在构建产物里真的干活：dev 下 virtual:pwa-register 是空实现，needRefresh 恒为 false。
 *
 * 位置贴底居中而不是顶部：顶栏是会自动收起的 overlay，提示挂在那儿会跟它抢同一块热区。
 * z-30 与 quick 的 dialog 同层、DOM 里排在它前面，所以浮层开着时提示被压在下面。
 */
export function UpdatePrompt() {
  const { t } = useTranslation()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    // 外层只负责定位与避让刘海：safe-b 与内置的 p-* 会互相覆盖，间距交给内层的 m-*
    <div className="safe-b safe-x pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center">
      <div className="card pointer-events-auto m-3 flex max-w-full items-center gap-3 !p-3 short:m-2">
        <IconUpdate className="size-6 shrink-0 text-sky-300" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold">{t('update.available')}</p>
          {/* 矮屏是手持场景，省下这一行的高度 */}
          <p className="text-sm text-text-dim short:hidden">{t('update.hint')}</p>
        </div>
        <button
          type="button"
          onClick={() => void updateServiceWorker()}
          className="btn-base shrink-0 bg-sky-400 px-5 text-ink short:!min-h-12"
        >
          {t('update.action')}
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          aria-label={t('update.later')}
          className="btn-quiet !min-h-12 w-12 shrink-0 short:!min-h-11 short:w-11"
        >
          <IconClose className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  )
}
