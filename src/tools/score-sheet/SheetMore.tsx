import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Overlay } from '../../shared/components/Overlay'
import { IconCsv, IconHistory, IconImage, IconRepeat } from '../../shared/icons'

type Props = {
  /** 当前局有没有填过东西。空局导出只会得到一张全是 `·` 的图，两个导出按钮直接禁用 */
  canExport: boolean
  onExportImage: () => void
  onExportCsv: () => void
  onOpenHistory: () => void
  onNewGame: () => void
  onClose: () => void
}

/** 三个出口按钮共用一档：次要操作，比 newGame 的实心档轻 */
const EXIT_BTN = 'btn-base gap-2 border border-line bg-surface-2 text-base short:!min-h-11'

/**
 * 一局打完才用一次的出口：导出、历史、新一局。与模板选择分家的理由是使用频率 ——
 * 模板是开局第一件事，这些是收尾动作，堆在一个浮层里前者会被后者挤到要滚。
 *
 * 新一局不直插键盘的动作行：那一行两格都太窄，放不下 [ConfirmButton] 武装后的确认文案，
 * 而清空整局分数正是最不能省二次确认的操作。
 */
export function SheetMore({
  canExport,
  onExportImage,
  onExportCsv,
  onOpenHistory,
  onNewGame,
  onClose,
}: Props) {
  const { t } = useTranslation()

  return (
    <Overlay
      title={<span className="text-lg font-bold">{t('tools.scoreSheet.more.title')}</span>}
      onClose={onClose}
    >
      <div className="flex flex-col gap-2">
        <span className="section-label">{t('tools.scoreSheet.more.export')}</span>
        <div className="grid grid-cols-2 gap-2">
          {/*
           * 导出图片**不关这个浮层** —— 图片层是 z-30 的独立 lightbox，
           * 看完关掉自然回到这里。CSV 是即刻下载，留在原地也不打断什么
           */}
          <button type="button" onClick={onExportImage} disabled={!canExport} className={EXIT_BTN}>
            <IconImage className="size-6 short:size-5" aria-hidden />
            {t('tools.scoreSheet.more.exportImage')}
          </button>
          <button type="button" onClick={onExportCsv} disabled={!canExport} className={EXIT_BTN}>
            <IconCsv className="size-6 short:size-5" aria-hidden />
            {t('tools.scoreSheet.more.exportCsv')}
          </button>
        </div>

        {/* 历史是另一个浮层，沿用「同一时刻只开一个」：先关自己再开它 */}
        <button
          type="button"
          onClick={() => {
            onClose()
            onOpenHistory()
          }}
          className={EXIT_BTN}
        >
          <IconHistory className="size-6 short:size-5" aria-hidden />
          {t('tools.scoreSheet.more.history')}
        </button>

        <p className="text-xs leading-relaxed text-text-dim">
          {t('tools.scoreSheet.more.archiveHint')}
        </p>
      </div>

      <ConfirmButton
        onConfirm={() => {
          onNewGame()
          onClose()
        }}
        confirmText={t('tools.scoreSheet.more.confirmNewGame')}
        className="short:!min-h-11"
      >
        <IconRepeat className="size-6 short:size-5" aria-hidden />
        {t('tools.scoreSheet.more.newGame')}
      </ConfirmButton>
    </Overlay>
  )
}
