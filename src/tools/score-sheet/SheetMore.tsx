import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Overlay } from '../../shared/components/Overlay'
import {
  IconCheck,
  IconDelete,
  IconHistory,
  IconPlayerAdd,
  IconRepeat,
  IconShare,
} from '../../shared/icons'

type Props = {
  /** 当前局有没有填过东西。空局分享只会得到一张全是 `·` 的图，按钮直接禁用 */
  canShare: boolean
  /** 这一局值不值得记一条（见 [isComplete](store.ts)）。决定出口是结算还是直接清 */
  canFinish: boolean
  /** 加一列并关闭浮层 —— 盖着浮层盲加看不见新列，加完回到矩阵再点列头绑人 */
  onAddSeat: () => void
  /** 连人带分全清，回到开局入座（store 的 clearSeats） */
  onClearSeats: () => void
  onShare: () => void
  onOpenHistory: () => void
  /** 打开结算面板 —— 记录一局的唯一入口 */
  onFinish: () => void
  onNewGame: () => void
  onClose: () => void
}

/** 三个出口按钮共用一档：次要操作，比 newGame 的实心档轻 */
const EXIT_BTN = 'btn-base gap-2 border border-line bg-surface-2 text-base short:!min-h-11'

/**
 * 一局里低频的出口：席位调整、分享、历史、新一局。与模板选择分家的理由是使用频率 ——
 * 模板是开局第一件事，这些是收尾动作，堆在一个浮层里前者会被后者挤到要滚。
 *
 * 新一局不直插键盘的动作行：那一行两格都太窄，放不下 [ConfirmButton] 武装后的确认文案，
 * 而清空整局分数正是最不能省二次确认的操作。
 */
export function SheetMore({
  canShare,
  canFinish,
  onAddSeat,
  onClearSeats,
  onShare,
  onOpenHistory,
  onFinish,
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
        <span className="section-label">{t('tools.scoreSheet.more.seats')}</span>
        <div className="flex flex-col gap-2 wide:flex-row">
          <button
            type="button"
            onClick={() => {
              onAddSeat()
              onClose()
            }}
            className={`${EXIT_BTN} wide:flex-1`}
          >
            <IconPlayerAdd className="size-6 short:size-5" aria-hidden />
            {t('tools.scoreSheet.addSeat')}
          </button>
          <ConfirmButton
            className="wide:flex-1"
            onConfirm={() => {
              onClearSeats()
              onClose()
            }}
            confirmText={t('tools.scoreSheet.more.confirmClearSeats')}
          >
            <IconDelete className="size-6 short:size-5" aria-hidden />
            {t('tools.scoreSheet.more.clearSeats')}
          </ConfirmButton>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="section-label">{t('tools.scoreSheet.more.output')}</span>
        {/*
         * 分享**不关这个浮层** —— 分享层是 z-30 的独立 lightbox，
         * 排版与外观在它里面选，看完关掉自然回到这里
         */}
        <button type="button" onClick={onShare} disabled={!canShare} className={EXIT_BTN}>
          <IconShare className="size-6 short:size-5" aria-hidden />
          {t('tools.scoreSheet.more.share')}
        </button>

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
      </div>

      {/*
       * 填齐了就走结算（面板里自己带「不记录直接开新局」的二次确认出口），
       * 没填齐的局记下来也是废记录，直接给清空按钮 —— 那才是最不能省二次确认的操作
       */}
      {canFinish ? (
        <button
          type="button"
          onClick={() => {
            onClose()
            onFinish()
          }}
          className="btn-base gap-2 bg-emerald-400 px-5 text-base font-bold text-ink short:!min-h-11"
        >
          <IconCheck className="size-6 short:size-5" aria-hidden />
          {t('tools.scoreSheet.more.finish')}
        </button>
      ) : (
        <ConfirmButton
          onConfirm={() => {
            onNewGame()
            onClose()
          }}
          confirmText={t('tools.scoreSheet.more.confirmNewGame')}
        >
          <IconRepeat className="size-6 short:size-5" aria-hidden />
          {t('tools.scoreSheet.more.newGame')}
        </ConfirmButton>
      )}
    </Overlay>
  )
}
