import { useTranslation } from 'react-i18next'
import type { I18nKey } from '../../shared/i18n/types'
import {
  IconCheck,
  IconCrown,
  IconGroups,
  IconOrder,
  type LucideIcon,
} from '../../shared/icons'
import type { PickMode } from './store'

const MODES = [
  { mode: 'one', nameKey: 'tools.touchPick.mode.one', Icon: IconCrown },
  { mode: 'order', nameKey: 'tools.touchPick.mode.order', Icon: IconOrder },
  { mode: 'group', nameKey: 'tools.touchPick.mode.group', Icon: IconGroups },
] as const satisfies readonly { mode: PickMode; nameKey: I18nKey; Icon: LucideIcon }[]

/** 抄 [ScoreBar](../score/ScoreBar.tsx)：横屏是 80px 竖条里的一格，竖屏是贴底横条里的一格 */
const BTN =
  'btn-base relative shrink-0 flex-col gap-1 px-1 text-sm min-w-20 !min-h-16 short:!min-h-11 short:min-w-16 short:gap-0.5 short:py-1 short:text-xs'

type Props = {
  mode: PickMode
  groups: number
  onMode: (mode: PickMode) => void
  onCycleGroups: () => void
}

/**
 * 模式切换条。选中态除了实心色**还带一个勾**：桌上斜视时三个按钮的色差会被视角吃掉，
 * 颜色不许是唯一编码。
 */
export function PickBar({ mode, groups, onMode, onCycleGroups }: Props) {
  const { t } = useTranslation()

  return (
    <div className="flex shrink-0 gap-2 wide:w-20 wide:flex-col short:gap-1.5">
      {MODES.map(({ mode: m, nameKey, Icon }) => {
        const active = m === mode
        return (
          <button
            key={m}
            type="button"
            aria-pressed={active}
            onClick={() => onMode(m)}
            className={`${BTN} ${active ? 'bg-emerald-400 font-bold text-ink' : 'bg-surface-2 text-text'}`}
          >
            <Icon className="size-6 short:size-5" aria-hidden />
            {t(nameKey)}
            {active && <IconCheck className="absolute top-1 right-1 size-4" aria-hidden />}
          </button>
        )
      })}

      {/* 组数只在分组模式下有意义。窄条放不下 Stepper，所以是循环递增 */}
      {mode === 'group' && (
        <button
          type="button"
          onClick={onCycleGroups}
          aria-label={t('tools.touchPick.groupsAria', { n: groups })}
          className={`${BTN} bg-surface-2 text-text`}
        >
          <span className="font-mono text-2xl leading-none font-bold tabular-nums short:text-xl">
            {groups}
          </span>
          <span aria-hidden>{t('tools.touchPick.groupsUnit')}</span>
        </button>
      )}
    </div>
  )
}
