import { useTranslation } from 'react-i18next'
import { PLAYER_LINE } from '../../shared/players/colors'
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

/**
 * 状态 chips 的只读形态：卡片与回看详情共用。无描边、小圆角、紧内距 ——
 * 窄屏六人局时一张卡要塞好几条，胶囊边框那份厚度全是浪费
 */
export function StatusChips({ statuses }: { statuses: Record<string, number> }) {
  const { t } = useTranslation()
  const active = STATUSES.filter((s) => (statuses[s.id] ?? 0) > 0)
  if (active.length === 0) return null
  return (
    <span className="flex min-h-0 flex-wrap items-center justify-center gap-1.5">
      {active.map((s) => (
        <span
          key={s.id}
          className="inline-flex items-center gap-1 rounded-md bg-surface-3 px-2 py-0.5 text-sm text-text"
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
 * 点整卡进编辑浮层。所以卡内没有任何嵌套按钮，整卡就是触控目标。
 *
 * 三段固定分区 —— 顶：名字色带 / 中：HP+CP / 底：状态条常驻。桌上扫视靠位置记忆，
 * 内容随局内数值上下挪等于每次都要重新对焦，所以宁可让状态条在极端情况下自己滚，
 * 也不让 HP 的位置跟着状态数量跳
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
      className={`card flex min-h-0 flex-col overflow-hidden border-2 !p-0 transition-colors ${CARD[level]} ${dead ? 'opacity-60' : ''}`}
    >
      {/* 找"谁"靠名字下的玩家色粗边：它顺带充当名字区与数值区的分隔线 */}
      <span
        className={`shrink-0 truncate border-b-4 px-3 py-1.5 text-center text-lg font-bold ${PLAYER_LINE[seat.color]}`}
      >
        {seat.name}
      </span>

      <span className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-3 short:gap-1 short:p-2">
        <span className="flex items-baseline gap-1 font-mono font-bold leading-none tabular-nums">
          <span className={`text-data ${TONE[level]}`}>{seat.hp}</span>
          <span className="text-2xl text-text-dim">/{maxHp(seat)}</span>
        </span>

        {/* 淘汰有文案，不只靠压暗与红色（颜色不许是唯一编码） */}
        {dead && (
          <span className="text-base font-bold text-rose-300 light:text-rose-700">
            {t('tools.diceThrone.eliminated')}
          </span>
        )}

        <span className="flex items-baseline gap-2 text-base text-text-muted">
          <span>{t('tools.diceThrone.cp')}</span>
          <span className="font-mono text-3xl font-bold leading-none tabular-nums text-text short:text-2xl">
            {seat.cp}
          </span>
        </span>
      </span>

      {/* 没挂状态时这条是空的占位 —— 它换来的是上面所有信息的位置恒定。
          不设高度上限：卡有多高就用多高（1v1 大卡可以摊开六七行），
          真正挤不下（六人竖屏）时才轮到它内滚 */}
      <span className="flex min-h-9 shrink items-center justify-center overflow-y-auto px-2 py-1">
        <StatusChips statuses={seat.statuses} />
      </span>
    </button>
  )
}
