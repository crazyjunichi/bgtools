import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Overlay } from '../../shared/components/Overlay'
import { buzz } from '../../shared/haptics'
import { IconDelete } from '../../shared/icons'
import { PLAYER_SOLID } from '../../shared/players/colors'
import type { SeatView } from '../../shared/players/seats'

type Props = {
  seat: SeatView
  /** 本轮已记的分（未封档） */
  delta: number
  /** 含本轮的合计 */
  total: number
  onBump: (amount: number) => void
  onSetDelta: (delta: number) => void
  /** 切到换人面板（同一个浮层位置换内容，不叠两层） */
  onEditSeat: () => void
  /** 连这一列的历史分数一起删，所以走二次确认 */
  onRemove: () => void
  onClose: () => void
}

/**
 * 六键全摆开而不做「步长切换 + 大 ±」：桌上报的是"这轮 7 分"这种零散数，
 * 少一个模式就少一次"以为在 ×10 档"的错记。浮层里横向空间够，不必省。
 */
const BUMPS = [1, 10, 100] as const

/** 允许负分（多数计分游戏都有扣分），所以自己解析而不用 type=number */
const INT = /^-?\d+$/

/**
 * 单人调分浮层：点表头那一整块（合计 / 人名 / 本轮）打开。
 *
 * 为什么是浮层而不是常驻控制栏：控制栏调分要"先选中列 → 移到左栏点 ± → 视线回表格确认"，
 * 一次调分三次视线跳转。浮层把操作和反馈叠在同一处，代价是多一次开关。
 *
 * **本轮那个大数字本身就是输入框**，不再另起一行"输入 + 确认"：这里只有一个待填的数，
 * 把它和六个 ± 键指向同一个可见目标，比多一组控件更省认知。合计降成小字陪衬 ——
 * 记分时要盯的是"这轮几分"，合计是核对用的。
 */
export function SeatSheet({
  seat,
  delta,
  total,
  onBump,
  onSetDelta,
  onEditSeat,
  onRemove,
  onClose,
}: Props) {
  const { t } = useTranslation()
  // null = 没在编辑，显示 store 里的值；非 null 时输入框自己说话（半成品如 "-" 也要能留住）
  const [raw, setRaw] = useState<string | null>(null)

  const commit = () => {
    const text = raw?.trim()
    if (text !== undefined && INT.test(text)) {
      onSetDelta(Number(text))
      buzz()
    }
    setRaw(null)
  }

  // 输入框正聚焦时点 ± 会先 blur 提交草稿，再在提交值上加减 —— 打完 12 直接点 +1 得 13，符合直觉
  const bump = (amount: number) => {
    onBump(amount)
    buzz()
  }

  return (
    <Overlay
      onClose={onClose}
      title={
        <div className="flex min-w-0 items-center gap-2">
          {/* 移除会连历史一起删，所以只给一个图标位、必须点两次；武装后自己撑开文字，名字让位 */}
          <ConfirmButton
            onConfirm={() => {
              onRemove()
              onClose()
            }}
            confirmText={t('tools.score.sheet.confirmRemove')}
            className="shrink-0 !min-h-12 !px-3 !text-sm short:!min-h-11"
          >
            <IconDelete className="size-5" aria-hidden />
            <span className="sr-only">{t('tools.score.sheet.remove')}</span>
          </ConfirmButton>
          {/*
           * 改谁的分是这里最关键的防错点，所以名字用整块实心玩家色铺满剩余宽度，不缩成小色点。
           * 它同时就是换人入口 —— 要换的正是这个名字，指到它本身比另起一个笔图标更直接。
           */}
          <button
            type="button"
            onClick={onEditSeat}
            aria-label={t('tools.score.sheet.editSeat', { name: seat.name })}
            className={`flex min-h-12 min-w-0 flex-1 items-center justify-center rounded-xl px-3 text-lg font-bold short:min-h-11 ${
              PLAYER_SOLID[seat.color]
            }`}
          >
            <span className="truncate">{seat.name}</span>
          </button>
        </div>
      }
    >
      <div className="flex items-stretch gap-3 short:gap-2">
        {/* label 包住数字与标题：点"本轮"两个字也能聚焦，靶面比输入框本身大一圈 */}
        <label className="flex flex-1 cursor-text flex-col items-center rounded-xl bg-sky-500/15 py-2 short:py-1">
          <span className="section-label text-sky-300">{t('tools.score.thisRound')}</span>
          <input
            value={raw ?? String(delta)}
            onChange={(e) => setRaw(e.target.value)}
            onFocus={(e) => {
              setRaw(String(delta))
              // 报分时直接打新数字，不必先删掉旧的
              e.target.select()
            }}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
            }}
            inputMode="numeric"
            enterKeyHint="done"
            className="w-full bg-transparent text-center font-mono text-data font-bold leading-none tabular-nums text-sky-200 caret-sky-300 outline-none"
          />
        </label>
        <div className="flex shrink-0 flex-col items-center justify-center rounded-xl bg-surface-3 px-4 short:px-3">
          <span className="section-label">{t('tools.score.total')}</span>
          <span className="font-mono text-data-sm font-bold tabular-nums">{total}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {BUMPS.map((n) => (
          <button
            key={`plus-${n}`}
            type="button"
            onClick={() => bump(n)}
            className="btn-base bg-sky-400 font-mono text-2xl font-bold tabular-nums text-ink short:!min-h-11 short:text-xl"
          >
            +{n}
          </button>
        ))}
        {BUMPS.map((n) => (
          <button
            key={`minus-${n}`}
            type="button"
            onClick={() => bump(-n)}
            className="btn-quiet font-mono text-2xl tabular-nums short:!min-h-11 short:text-xl"
          >
            −{n}
          </button>
        ))}
      </div>
    </Overlay>
  )
}
