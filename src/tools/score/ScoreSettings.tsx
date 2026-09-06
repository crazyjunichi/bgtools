import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Overlay } from '../../shared/components/Overlay'
import { IconCheck, IconEraser, IconPlayerAdd, IconRepeat } from '../../shared/icons'

type Props = {
  /** 空桌时「清空所有人」无意义，不显示 */
  hasSeats: boolean
  /** 这一局值不值得记一条。决定出口是结算还是直接清 */
  canFinish: boolean
  onAddSeat: () => void
  /** 打开结算面板 —— 记录一局的唯一入口 */
  onFinish: () => void
  onNewGame: () => void
  onClearAll: () => void
  onClose: () => void
}

/**
 * 收尾出口。留着这层浮层而不把按钮直插操作条：那条窄条放不下
 * [ConfirmButton] 武装后的确认文案，而清空整晚历史正是最不能省二次确认的操作。
 * 开局后极少用到的「加人」也收在这里，操作条的余量让给「下一轮」。
 */
export function ScoreSettings({
  hasSeats,
  canFinish,
  onAddSeat,
  onFinish,
  onNewGame,
  onClearAll,
  onClose,
}: Props) {
  const { t } = useTranslation()

  return (
    <Overlay
      title={<span className="text-lg font-bold">{t('tools.score.settings.title')}</span>}
      onClose={onClose}
    >
      {/*
       * 点完即关 —— 新席位卡已出现在网格里，下一步自然是点卡片改名/绑人，
       * 不必留在浮层里
       */}
      <button
        type="button"
        onClick={() => {
          onAddSeat()
          onClose()
        }}
        className="btn-quiet gap-2 short:!min-h-11"
      >
        <IconPlayerAdd className="size-6 short:size-5" aria-hidden />
        {t('tools.score.settings.addSeat')}
      </button>

      {/*
       * 加过分就走结算（面板里自己带「不记录直接开新局」的二次确认出口），
       * 空局记下来也是废记录，直接给清空按钮
       */}
      {canFinish ? (
        <button
          type="button"
          onClick={() => {
            onClose()
            onFinish()
          }}
          className="btn-base gap-2 bg-emerald-400 px-5 text-base font-bold text-ink eink-solid short:!min-h-11"
        >
          <IconCheck className="size-6 short:size-5" aria-hidden />
          {t('tools.score.settings.finish')}
        </button>
      ) : (
        <ConfirmButton
          onConfirm={() => {
            onNewGame()
            onClose()
          }}
          confirmText={t('tools.score.settings.confirmNewGame')}
          className="short:!min-h-11"
        >
          <IconRepeat className="size-6 short:size-5" aria-hidden />
          {t('tools.score.settings.newGame')}
        </ConfirmButton>
      )}

      {hasSeats && (
        <ConfirmButton
          onConfirm={() => {
            onClearAll()
            onClose()
          }}
          confirmText={t('tools.score.settings.confirmClearAll')}
          className="short:!min-h-11"
        >
          <IconEraser className="size-6 short:size-5" aria-hidden />
          {t('tools.score.settings.clearAll')}
        </ConfirmButton>
      )}
    </Overlay>
  )
}
