import { useTranslation } from 'react-i18next'
import { Overlay } from '../../shared/components/Overlay'
import { Stepper } from '../../shared/components/Stepper'
import { buzz } from '../../shared/haptics'
import { IconEdit } from '../../shared/icons'
import { PLAYER_DOT } from '../../shared/players/colors'
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
  onClose: () => void
}

const HP_STEPS = [-5, -1, 1, 5] as const

/**
 * 单人编辑浮层：面板卡是只读的（全桌要看），增减负在这里做。
 * 状态的高频操作是「加一层」（点了 chip 就是挂上一层 token），
 * 所以未挂载的给一排快捷格、已挂载的给 Stepper 精调，归零即摘除
 */
export function SeatPanel({ seat, onEditSeat, onClose }: Props) {
  const { t } = useTranslation()
  const { bumpHp, setCp, setStartHp, setStatus } = useThroneStore()

  const active = STATUSES.filter((s) => (seat.statuses[s.id] ?? 0) > 0)
  const inactive = STATUSES.filter((s) => !(seat.statuses[s.id] > 0))

  const bump = (delta: number) => {
    bumpHp(seat.id, delta)
    buzz(delta < 0 ? [15, 25, 15] : 12)
  }

  return (
    <Overlay
      title={
        <span className="flex min-w-0 items-center gap-2 text-lg font-bold text-text">
          <span className={`size-3 shrink-0 rounded-full ${PLAYER_DOT[seat.color]}`} aria-hidden />
          <span className="truncate">{seat.name}</span>
        </span>
      }
      onClose={onClose}
    >
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
              className={`btn-base font-mono text-xl font-bold tabular-nums short:!min-h-12 ${
                delta < 0
                  ? 'border-2 border-rose-400/70 bg-rose-500/25 text-rose-100 light:text-rose-700 eink:border-black eink:bg-white'
                  : 'border-2 border-emerald-400/70 bg-emerald-500/20 text-emerald-100 light:text-emerald-700 eink:border-black eink:bg-white'
              }`}
            >
              {delta > 0 ? `+${delta}` : `−${-delta}`}
            </button>
          ))}
        </div>
      </div>

      <Stepper
        label={t('tools.diceThrone.cp')}
        value={seat.cp}
        min={0}
        max={CP_MAX}
        onChange={(cp) => setCp(seat.id, cp)}
      />

      <Stepper
        label={t('tools.diceThrone.startHp')}
        value={seat.startHp}
        min={START_HP_MIN}
        max={START_HP_MAX}
        step={START_HP_STEP}
        onChange={(startHp) => setStartHp(seat.id, startHp)}
      />

      <div className="flex flex-col gap-2">
        <span className="section-label">{t('tools.diceThrone.statuses')}</span>

        {active.map((s) => (
          <div key={s.id} className="flex items-center gap-3">
            <span className="flex min-w-0 flex-1 items-center gap-2 text-base text-text">
              <span aria-hidden>{s.icon}</span>
              <span className="truncate">{t(s.nameKey)}</span>
            </span>
            <div className="shrink-0">
              <Stepper
                value={seat.statuses[s.id] ?? 0}
                min={0}
                max={STATUS_MAX}
                onChange={(n) => setStatus(seat.id, s.id, n)}
              />
            </div>
          </div>
        ))}

        {inactive.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {inactive.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setStatus(seat.id, s.id, 1)
                  buzz(12)
                }}
                className="btn-base min-h-12 flex-col gap-0.5 bg-surface-2 py-1 leading-tight text-text-muted"
              >
                <span aria-hidden>{s.icon}</span>
                <span className="text-xs">{t(s.nameKey)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onEditSeat}
        className="btn-base gap-2 border border-line bg-surface-2 text-base short:!min-h-11"
      >
        <IconEdit className="size-5" aria-hidden />
        {t('tools.diceThrone.changeSeat')}
      </button>
    </Overlay>
  )
}
