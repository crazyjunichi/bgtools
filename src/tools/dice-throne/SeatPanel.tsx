import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Overlay } from '../../shared/components/Overlay'
import { buzz } from '../../shared/haptics'
import { IconDelete, IconMinus, IconPlus } from '../../shared/icons'
import { PLAYER_LINE } from '../../shared/players/colors'
import {
  CP_MAX,
  START_HP_MAX,
  START_HP_MIN,
  START_HP_STEP,
  maxHp,
  useThroneStore,
  type ThroneSeatView,
} from './store'
import { STATUSES, STATUS_MAX } from './statuses'

type Props = {
  seat: ThroneSeatView
  /** 切到换人面板（[SeatPicker]） */
  onEditSeat: () => void
  onRemove: () => void
  onClose: () => void
}

const HP_STEPS = [-5, -1, 1, 5] as const

/** 紧凑步进：CP / 初始生命这类「一个数 + 两键」不需要占整行，两个并排一档 */
function MiniStepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (next: number) => void
}) {
  const { t } = useTranslation()
  const bump = (dir: 1 | -1) => {
    const next = Math.min(Math.max(value + dir * step, min), max)
    if (next === value) return
    onChange(next)
    buzz(12)
  }
  return (
    <div className="flex flex-col gap-1.5">
      <span className="section-label">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={value <= min}
          onClick={() => bump(-1)}
          aria-label={t('stepper.decrease')}
          className="btn-base min-h-12 w-12 shrink-0"
        >
          <IconMinus className="size-6" aria-hidden />
        </button>
        <span className="flex-1 text-center font-mono text-2xl font-semibold tabular-nums">
          {value}
        </span>
        <button
          type="button"
          disabled={value >= max}
          onClick={() => bump(1)}
          aria-label={t('stepper.increase')}
          className="btn-base min-h-12 w-12 shrink-0"
        >
          <IconPlus className="size-6" aria-hidden />
        </button>
      </div>
    </div>
  )
}

/**
 * 单人编辑浮层：面板卡是只读的（全桌要看），增减负在这里做。
 * 状态不分「已挂/未挂」两区 —— 一张网格全员在列，格内直接调层数，0 层即未挂；
 * 未挂的格子整体压暗，让挂着的几项一眼跳出来（出牌的合法性约束全在这些上）。
 */
export function SeatPanel({ seat, onEditSeat, onRemove, onClose }: Props) {
  const { t } = useTranslation()
  const { bumpHp, setCp, setStartHp, setStatus } = useThroneStore()

  const bump = (delta: number) => {
    bumpHp(seat.id, delta)
    buzz(delta < 0 ? [15, 25, 15] : 12)
  }

  return (
    <Overlay
      maxWidth="max-w-lg wide:max-w-4xl"
      title={
        <div className="flex min-w-0 items-center gap-2">
          <ConfirmButton
            onConfirm={() => {
              onRemove()
              onClose()
            }}
            confirmText={t('tools.diceThrone.confirmRemove')}
            className="shrink-0 !min-h-12 !px-3 !text-sm short:!min-h-11"
          >
            <IconDelete className="size-5" aria-hidden />
            <span className="sr-only">{t('tools.diceThrone.remove')}</span>
          </ConfirmButton>
          {/* 玩家色粗边的名字条就是换人入口 —— 要换的正是这个名字，指到它本身比另起图标直接 */}
          <button
            type="button"
            onClick={onEditSeat}
            aria-label={t('tools.diceThrone.editSeat', { name: seat.name })}
            className={`flex min-h-12 min-w-0 flex-1 items-center justify-center rounded-xl border-b-4 px-3 text-lg font-bold short:min-h-11 ${
              PLAYER_LINE[seat.color]
            }`}
          >
            <span className="truncate">{seat.name}</span>
          </button>
        </div>
      }
      onClose={onClose}
    >
      {/* 横屏分栏：左数值、右状态网格；竖屏照旧上下堆叠 */}
      <div className="flex flex-col gap-4 wide:grid wide:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] wide:items-start wide:gap-5">
        <div className="flex flex-col gap-4">
          {/* 生命：伤害常是多位数，±5 与 ±1 四键并列 */}
          <div className="flex flex-col gap-2">
            <span className="section-label">
              {t('tools.diceThrone.hp')} · {seat.hp}/{maxHp(seat)}
            </span>
            <div className="grid grid-cols-4 gap-2">
              {HP_STEPS.map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => bump(delta)}
                  className={`btn-base border font-mono text-xl font-bold tabular-nums short:!min-h-12 ${
                    delta < 0
                      ? 'border-rose-500/60 bg-rose-500/15 text-rose-300 light:text-rose-700 eink:border-black eink:bg-white eink:text-black'
                      : 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 light:text-emerald-700 eink:border-black eink:bg-white eink:text-black'
                  }`}
                >
                  {delta > 0 ? `+${delta}` : `−${-delta}`}
                </button>
              ))}
            </div>
          </div>

          {/* CP 高频、初始生命只在开局定档，都不配独占整行 */}
          <div className="grid grid-cols-2 gap-3">
            <MiniStepper
              label={t('tools.diceThrone.cp')}
              value={seat.cp}
              min={0}
              max={CP_MAX}
              onChange={(cp) => setCp(seat.id, cp)}
            />
            <MiniStepper
              label={t('tools.diceThrone.startHp')}
              value={seat.startHp}
              min={START_HP_MIN}
              max={START_HP_MAX}
              step={START_HP_STEP}
              onChange={(startHp) => setStartHp(seat.id, startHp)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="section-label">{t('tools.diceThrone.statuses')}</span>
          <div className="grid grid-cols-3 gap-2 wide:grid-cols-4 short:gap-1.5">
            {STATUSES.map((s) => {
              const n = seat.statuses[s.id] ?? 0
              const active = n > 0
              return (
                <div
                  key={s.id}
                  className={`flex flex-col gap-0.5 rounded-xl border p-1.5 ${
                    active
                      ? 'border-violet-500/60 bg-violet-500/15 eink:border-black eink:bg-white'
                      : 'border-transparent bg-surface-2'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center gap-1 text-xs ${
                      active ? 'text-text' : 'text-text-muted'
                    }`}
                  >
                    <span aria-hidden className={active ? '' : 'opacity-50 grayscale'}>
                      {s.icon}
                    </span>
                    <span className="truncate">{t(s.nameKey)}</span>
                  </span>
                  <span className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      disabled={n === 0}
                      onClick={() => {
                        setStatus(seat.id, s.id, n - 1)
                        buzz(12)
                      }}
                      aria-label={`${t(s.nameKey)} −1`}
                      className={`btn-base min-h-12 w-12 shrink-0 ${
                        active ? 'text-violet-300 light:text-violet-700' : 'text-text-muted'
                      }`}
                    >
                      <IconMinus className="size-5" aria-hidden />
                    </button>
                    <span
                      className={`min-w-6 text-center font-mono font-bold tabular-nums ${
                        active
                          ? 'text-xl text-violet-200 light:text-violet-700 eink:text-black'
                          : 'text-lg text-text-dim'
                      }`}
                    >
                      {active ? n : '·'}
                    </span>
                    <button
                      type="button"
                      disabled={n >= STATUS_MAX}
                      onClick={() => {
                        setStatus(seat.id, s.id, n + 1)
                        buzz(12)
                      }}
                      aria-label={`${t(s.nameKey)} +1`}
                      className={`btn-base min-h-12 w-12 shrink-0 ${
                        active ? 'text-violet-300 light:text-violet-700' : 'text-text-muted'
                      }`}
                    >
                      <IconPlus className="size-5" aria-hidden />
                    </button>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Overlay>
  )
}
