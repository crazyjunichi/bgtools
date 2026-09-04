import { useTranslation } from 'react-i18next'
import { PLAYER_DOT } from '../../shared/players/colors'
import { STATUSES } from './statuses'
import { maxHp, type ThroneSeatView } from './store'

type Level = 'dead' | 'critical' | 'low' | 'ok'

const levelOf = (hp: number, max: number): Level =>
  hp === 0 ? 'dead' : hp <= max * 0.25 ? 'critical' : hp <= max * 0.5 ? 'low' : 'ok'

/**
 * 血量色带：绿 → 琥珀 → 红，整块卡跟着变（依据同 [LifeBar](../bomb-busters/LifeBar.tsx)：
 * 不读数字也该知道还剩多少）。淘汰不在这里表达 —— 那由 `eliminated` 文案与压暗承担
 */
const CARD: Record<Level, string> = {
  dead: 'border-rose-400/70 eink:border-black',
  critical: 'border-rose-400 bg-rose-500/25 eink:border-black',
  low: 'border-amber-400 bg-amber-500/15 eink:border-black',
  ok: 'border-emerald-400/70 bg-emerald-500/10 eink:border-black',
}

const TONE: Record<Level, string> = {
  dead: 'text-rose-200 light:text-rose-700',
  critical: 'text-rose-300 light:text-rose-700',
  low: 'text-amber-300',
  ok: 'text-emerald-200 light:text-emerald-700',
}

/** 状态 chips 的只读形态：卡片与回看详情共用 */
export function StatusChips({ statuses }: { statuses: Record<string, number> }) {
  const { t } = useTranslation()
  const active = STATUSES.filter((s) => (statuses[s.id] ?? 0) > 0)
  if (active.length === 0) return null
  return (
    <span className="flex min-h-0 flex-wrap items-center justify-center gap-1.5">
      {active.map((s) => (
        <span
          key={s.id}
          className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-3 px-2 py-0.5 text-xs text-text"
        >
          <span aria-hidden>{s.icon}</span>
          {t(s.nameKey)}
          {(statuses[s.id] ?? 0) > 1 && (
            <span className="font-mono font-bold tabular-nums">×{statuses[s.id]}</span>
          )}
        </span>
      ))}
    </span>
  )
}

type Props = {
  seat: ThroneSeatView
  onOpen: () => void
}

/**
 * 面板卡：**只读**，全桌随时要看（对手的状态直接约束你能否指他为目标）；
 * 点整卡进编辑浮层。所以卡内没有任何嵌套按钮，整卡就是触控目标
 */
export function ThroneCard({ seat, onOpen }: Props) {
  const { t } = useTranslation()
  const level = levelOf(seat.hp, maxHp(seat))
  const dead = seat.hp === 0

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('tools.diceThrone.cardAria', { name: seat.name, hp: seat.hp, cp: seat.cp })}
      className={`card flex min-h-0 flex-col items-center justify-center gap-2 border-2 transition-colors short:gap-1 ${CARD[level]} ${dead ? 'opacity-60' : ''}`}
    >
      <span className="flex min-w-0 items-center gap-2 text-base font-semibold text-text">
        <span className={`size-3 shrink-0 rounded-full ${PLAYER_DOT[seat.color]}`} aria-hidden />
        <span className="truncate">{seat.name}</span>
      </span>

      <span className="flex items-baseline gap-1 font-mono font-bold leading-none tabular-nums">
        <span className={`text-data ${TONE[level]}`}>{seat.hp}</span>
        <span className="text-xl text-text-dim">/{maxHp(seat)}</span>
      </span>

      {/* 淘汰有文案，不只靠压暗与红色（颜色不许是唯一编码） */}
      {dead && (
        <span className="text-sm font-bold text-rose-300 light:text-rose-700">
          {t('tools.diceThrone.eliminated')}
        </span>
      )}

      <span className="flex items-baseline gap-2 text-sm text-text-muted">
        <span>{t('tools.diceThrone.cp')}</span>
        <span className="font-mono text-2xl font-bold leading-none tabular-nums text-text short:text-xl">
          {seat.cp}
        </span>
      </span>

      <StatusChips statuses={seat.statuses} />
    </button>
  )
}
