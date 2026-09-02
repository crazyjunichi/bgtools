import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { buzz } from '../../shared/haptics'
import { IconNewGame, IconRepeat } from '../../shared/icons'

type Props = {
  onDeal: () => void
  onReset: () => void
}

/**
 * 局面快捷键。原来这两个动作在设置浮层里（三层：点设置 → 找到分区 → 二次确认），
 * 但一晚要按好几次，提到左栏常驻。设置浮层只留人数。
 *
 * 两个按钮的确认档位不同：重发道具只换 5 张牌、重来一次就好，直接执行；
 * 新一局会清掉生命 + 12 格拆弹进度，走 ConfirmButton。
 * 光凭"点一次就执行 / 点两次才执行"看不出轻重，所以新一局静息态就带 rose 描边 ——
 * 底色不动（`bg-*` 会和 ConfirmButton 内部的 `bg-surface-2` 撞在同一 CSS 层，谁赢看生成顺序）。
 *
 * `mt-auto` 把这一组沉到左栏底部：横屏下生命卡按内容高度贴顶，余量集中在中间，
 * 手指够得到的位置留给要按的东西。
 */
export function BoardActions({ onDeal, onReset }: Props) {
  const { t } = useTranslation()

  return (
    <div className="mt-auto grid shrink-0 grid-cols-2 gap-3 wide:grid-cols-1">
      <button
        type="button"
        onClick={() => {
          buzz()
          onDeal()
        }}
        className="btn-quiet gap-2 px-4 text-base short:!min-h-11"
      >
        <IconRepeat className="size-5" aria-hidden />
        {t('tools.bombBusters.actions.deal')}
      </button>
      <ConfirmButton
        onConfirm={onReset}
        confirmText={t('tools.bombBusters.actions.confirmNewGame')}
        className="border-2 border-rose-500/60"
      >
        <IconNewGame className="size-5" aria-hidden />
        {t('tools.bombBusters.actions.newGame')}
      </ConfirmButton>
    </div>
  )
}
