import { useTranslation } from 'react-i18next'
import { Overlay } from '../../shared/components/Overlay'
import type { SeatView } from '../../shared/players/seats'
import { ScoreRounds } from './ScoreRounds'
import type { Round } from './store'

type Props = {
  seats: SeatView[]
  rounds: Round[]
  draft: Record<string, number>
  onClose: () => void
}

/**
 * 完整记录：整块就是逐轮矩阵（[ScoreRounds](ScoreRounds.tsx)）。
 *
 * 主界面（[ScoreGrid]）是一人一张卡，回溯是低频动作，不该为它常占屏幕并把每人的宽度
 * 压到一列 —— 所以放浮层。
 */
export function ScoreHistory({ seats, rounds, draft, onClose }: Props) {
  const { t } = useTranslation()

  return (
    <Overlay
      title={<span className="text-lg font-bold">{t('tools.score.history.title')}</span>}
      maxWidth="max-w-5xl"
      onClose={onClose}
    >
      <ScoreRounds seats={seats} rounds={rounds} draft={draft} />
    </Overlay>
  )
}
