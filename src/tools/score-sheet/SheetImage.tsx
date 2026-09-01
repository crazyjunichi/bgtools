import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { IconClose, IconSave, IconShare } from '../../shared/icons'
import { canShareBlob, saveBlob, shareBlob } from './save'

type Props = {
  blob: Blob
  /**
   * `blob` 的 objectURL。**由 [ScoreSheetPage](ScoreSheetPage.tsx) 建、也由它回收** ——
   * 建在这里就得靠 effect 的 cleanup 回收，而 StrictMode 会「setup → cleanup → setup」
   * 跑一遍挂载 effect，第一次 cleanup 就把 URL 撤了，图直接空白
   */
  url: string
  filename: string
  onClose: () => void
}

/**
 * 全屏看一张导出的 PNG。**不是 [Overlay](../../shared/components/Overlay.tsx)** ——
 * 它是从设置浮层里打开的，得叠在那层（z-20）之上，所以走 `z-30` 自己一层；
 * 关掉后自然回到底下的浮层，不打断「同一时刻只开一个浮层」的约定。
 *
 * 主路径是**系统原生行为**：桌面右键「图片另存为」、平板长按出分享菜单。
 * 底下那两个按钮只是兜底（PWA standalone 里长按菜单有时被吞）。
 */
export function SheetImage({ blob, url, filename, onClose }: Props) {
  const { t } = useTranslation()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const shareable = useMemo(() => canShareBlob(blob, filename), [blob, filename])

  return (
    <div className="safe-b safe-t fixed inset-0 z-30 flex flex-col gap-2 bg-ink/95 p-3 backdrop-blur-sm">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <span className="section-label">{t('tools.scoreSheet.image.title')}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="btn-quiet !min-h-12 w-12 shrink-0 short:!min-h-11 short:w-11"
        >
          <IconClose className="size-5" aria-hidden />
        </button>
      </div>

      {/* 图片周围的留白也能点关：一张全屏图上最自然的退出动作就是点旁边 */}
      <div
        className="flex min-h-0 flex-1 items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {/*
         * **必须 select-text**：`body` 上有 `user-select: none`，
         * iOS 会连带把长按图片的系统菜单一起抑制掉 —— 而那正是这个页面的主路径
         */}
        <img
          src={url}
          alt={t('tools.scoreSheet.image.title')}
          className="max-h-full max-w-full select-text object-contain"
        />
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2">
        <span className="text-xs leading-relaxed text-text-dim">
          {t('tools.scoreSheet.image.hint')}
        </span>
        <div className="flex w-full max-w-md gap-2">
          <button
            type="button"
            onClick={() => saveBlob(blob, filename)}
            className="btn-base flex-1 gap-2 border border-line bg-surface-2 text-base short:!min-h-11"
          >
            <IconSave className="size-6 short:size-5" aria-hidden />
            {t('tools.scoreSheet.image.save')}
          </button>
          {/* 只有真能分享文件时才出这个按钮：桌面 Chrome 有 share 却不收文件，点了必然失败 */}
          {shareable && (
            <button
              type="button"
              onClick={() => void shareBlob(blob, filename, t('tools.scoreSheet.image.title'))}
              className="btn-base flex-1 gap-2 border border-line bg-surface-2 text-base short:!min-h-11"
            >
              <IconShare className="size-6 short:size-5" aria-hidden />
              {t('tools.scoreSheet.image.share')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
