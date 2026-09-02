import { useTranslation } from 'react-i18next'
import {
  IconCheck,
  IconHistory,
  IconPlayerAdd,
  IconReset,
  IconSettings,
} from '../../shared/icons'

type Props = {
  canNextRound: boolean
  canUndo: boolean
  onAddSeat: () => void
  onNextRound: () => void
  onUndo: () => void
  onOpenHistory: () => void
  onOpenSettings: () => void
}

/** 三个小按钮共用：竖屏横条里不吃余量，min-w 兜住靶面宽度（横屏由 w-20 拉满） */
const SMALL =
  'btn-quiet shrink-0 flex-col gap-1 px-1 text-sm min-w-20 !min-h-16 short:!min-h-11 short:min-w-16 short:gap-0.5 short:py-1 short:text-xs'

/**
 * 操作条：横屏是右侧窄竖条，竖屏是贴底横条（宽度档见 DESIGN.md §5 的「窄条变体」）。
 *
 * 顶上是「加人」—— 摆桌是每局的第一个动作，埋在浮层里等于开局先找设置。
 * 「下一轮」吃掉主轴上的全部余量（`flex-1` 在竖条里是高、在横条里是宽，一个类管两个朝向）。
 * 「撤销」紧跟着它，因为要撤的几乎总是刚点错的那一下。
 * **没有说明文字** —— 五个动作的名字本身就是说明，真正需要引导的只有"一个席位都没有"
 * 那一种情况，那句话占主区的位置。
 *
 * 加减分不在这里，它跟着人走（点卡片开 [SeatSheet]）：操作点和反馈点必须重合。
 */
export function ScoreBar({
  canNextRound,
  canUndo,
  onAddSeat,
  onNextRound,
  onUndo,
  onOpenHistory,
  onOpenSettings,
}: Props) {
  const { t } = useTranslation()

  return (
    <div className="flex shrink-0 gap-2 wide:w-20 wide:flex-col short:gap-1.5">
      <button type="button" onClick={onAddSeat} className={SMALL}>
        <IconPlayerAdd className="size-6 short:size-5" aria-hidden />
        {t('tools.score.bar.addSeat')}
      </button>

      <button
        type="button"
        onClick={onNextRound}
        disabled={!canNextRound}
        className="btn-base flex-1 flex-col gap-1 bg-emerald-400 px-1 text-base font-bold text-ink !min-h-16 short:!min-h-11 short:gap-0.5 short:py-1 short:text-sm"
      >
        <IconCheck className="size-7 short:size-5" aria-hidden />
        {t('tools.score.bar.nextRound')}
      </button>

      <button type="button" onClick={onUndo} disabled={!canUndo} className={SMALL}>
        <IconReset className="size-6 short:size-5" aria-hidden />
        {t('tools.score.bar.undo')}
      </button>

      <button type="button" onClick={onOpenHistory} className={SMALL}>
        <IconHistory className="size-6 short:size-5" aria-hidden />
        {t('tools.score.bar.history')}
      </button>

      <button type="button" onClick={onOpenSettings} className={SMALL}>
        <IconSettings className="size-6 short:size-5" aria-hidden />
        {t('tools.score.bar.settings')}
      </button>
    </div>
  )
}
