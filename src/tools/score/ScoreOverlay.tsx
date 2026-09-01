import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconClose } from '../../shared/icons'

type Props = {
  /** 标题区内容，通常是带玩家色的席位名 */
  title: ReactNode
  /**
   * 面板宽度上限。默认 `max-w-md` 是给单人操作用的（调分、换人 —— 内容是一列按钮，
   * 拉宽只会让拇指多跑）；完整记录那种矩阵要横向铺开，自己传更大的档。
   */
  maxWidth?: string
  onClose: () => void
  children: ReactNode
}

/**
 * 计分板浮层的公共外壳 —— 调分（[SeatSheet]）、换人（[SeatPicker]）、
 * 局面（[ScoreSettings]）、完整记录（[ScoreHistory]）共用。
 *
 * 用 fixed 遮罩而非 absolute 气泡：主界面的卡片网格自己 overflow-y-auto，气泡会被裁掉或跟着滚。
 * 遮罩关闭走 onClick 而非 onPointerDown：pointerdown 里卸载浮层后，触屏抬手补发的兼容 click
 * 会按抬手坐标重新 hit-test，穿透到底下的卡片上，顺手就把别人的分改了。
 */
export function ScoreOverlay({ title, maxWidth = 'max-w-md', onClose, children }: Props) {
  const { t } = useTranslation()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`card flex max-h-full w-full flex-col gap-4 overflow-y-auto short:!p-3 short:gap-3 ${maxWidth}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="btn-quiet !min-h-12 w-12 shrink-0 short:!min-h-11 short:w-11"
          >
            <IconClose className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
