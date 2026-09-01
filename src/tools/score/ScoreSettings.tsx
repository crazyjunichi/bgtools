import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Overlay } from '../../shared/components/Overlay'
import { IconRepeat } from '../../shared/icons'

type Props = {
  onNewGame: () => void
  onClose: () => void
}

/**
 * 只有「新一局」一个动作。留着这层浮层而不把按钮直插操作条：80px 宽的条里放不下
 * [ConfirmButton] 武装后的确认文案，而清空整晚历史正是最不能省二次确认的操作。
 */
export function ScoreSettings({ onNewGame, onClose }: Props) {
  const { t } = useTranslation()

  return (
    <Overlay
      title={<span className="text-lg font-bold">{t('tools.score.settings.title')}</span>}
      onClose={onClose}
    >
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
    </Overlay>
  )
}
