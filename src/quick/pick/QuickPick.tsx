import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buzz } from '../../shared/haptics'
import { useActiveMatch } from '../../shared/match/active'
import { PlayerChip } from '../../shared/players/PlayerChip'
import { resolveSeat } from '../../shared/players/seats'
import { usePlayersStore } from '../../shared/players/store'
import { SPIN_MS, useQuickPickStore } from './store'

/** 轮播换人的间隔。这只是过程动画，不是结果 */
const TICK_MS = 70

/**
 * 从「当前工具页正在打的这一局」里随机点一个人 —— 谁先出牌、谁当起始玩家、谁去拿水。
 *
 * 候选**只能**是这局真在坐的席位（见 [active](../../shared/match/active.ts)），
 * 退回全局名单是错的：桌上 6 人名单、这局只 4 人在打时会点到没在玩的人。
 * 顶栏入口因此也只在有席位时才出现（[registry](../registry.ts) 的 `needsMatch`）。
 */
export function QuickPick() {
  const { t } = useTranslation()
  const seats = useActiveMatch((s) => s.active?.seats)
  const players = usePlayersStore((s) => s.players)
  const pickedId = useQuickPickStore((s) => s.pickedId)
  const pick = useQuickPickStore((s) => s.pick)

  const [spinning, setSpinning] = useState(false)
  const [flashId, setFlashId] = useState<string | null>(null)
  const timer = useRef(0)
  const ticker = useRef(0)

  // 名单是真源：这一局开始后改了名/换了色，这里要跟着变
  const views = useMemo(() => (seats ?? []).map((s) => resolveSeat(s, players)), [seats, players])

  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      window.clearInterval(ticker.current)
    },
    [],
  )

  const handlePick = () => {
    if (spinning) return
    const ids = views.map((v) => v.id)
    pick(ids)
    setSpinning(true)
    ticker.current = window.setInterval(() => {
      // 纯视觉的假值，这一处允许 Math.random（结果本身由 store 用 crypto 抽好了）
      setFlashId(ids[Math.floor(Math.random() * ids.length)] ?? null)
    }, TICK_MS)
    // 用定时器而非 transitionend：dialog 中途被关掉时那个事件不会来
    timer.current = window.setTimeout(() => {
      window.clearInterval(ticker.current)
      setSpinning(false)
      setFlashId(null)
      buzz([18, 36, 18])
    }, SPIN_MS)
  }

  const picked = views.find((v) => v.id === pickedId)
  const landed = picked !== undefined && !spinning
  // 轮播中亮的是乱跳的那个，不能提前落在终值上，否则结果被剧透
  const litId = spinning ? flashId : pickedId

  // 浮层开着时切回首页会走到这里（顶栏那个按钮此时已经消失）
  if (views.length === 0) {
    return (
      <p className="px-1 py-2 text-sm leading-relaxed text-text-muted">{t('quick.pick.empty')}</p>
    )
  }

  return (
    // 朝向只决定排列轴：横屏并排、竖屏堆叠
    <div className="flex flex-col gap-4 short:gap-2 wide:flex-row">
      {/* 刚性块。竖屏排在下贴拇指，宽度只在横屏约束 */}
      <div className="order-2 flex shrink-0 flex-col gap-3 short:gap-2 wide:order-1 wide:w-56">
        <div
          className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl border p-4 short:p-2 ${
            landed ? 'border-fuchsia-500/60 bg-fuchsia-500/15' : 'border-line bg-surface-2'
          }`}
        >
          <span
            aria-live="polite"
            className={`max-w-full truncate text-data-sm font-bold ${
              landed ? 'text-fuchsia-300' : 'text-text-dim'
            }`}
          >
            {spinning ? t('quick.pick.spinning') : landed ? picked.name : '--'}
          </span>
          {landed && (
            <span className="text-center text-sm text-text-muted">{t('quick.pick.result')}</span>
          )}
        </div>

        <button
          type="button"
          onClick={handlePick}
          disabled={spinning}
          className="btn-base mt-auto min-h-16 w-full bg-fuchsia-400 text-xl font-bold text-ink short:min-h-12 short:text-base"
        >
          {t(landed ? 'quick.pick.again' : 'quick.pick.spin')}
        </button>
      </div>

      {/* 弹性块：候选人。三个人时不占地方，十六个人就在自己的框里滚 —— 胶囊本身不缩 */}
      <div className="order-1 flex min-w-0 flex-1 flex-col gap-2 rounded-2xl border border-line bg-surface-2 p-3 short:p-2 wide:order-2">
        <span className="section-label shrink-0">{t('quick.pick.candidates')}</span>
        {/* 受约束的只有高度，所以是 vh 而不是 vmin */}
        <div className="flex max-h-[min(18rem,42vh)] flex-wrap content-start gap-2 overflow-y-auto">
          {views.map((v) => (
            <PlayerChip key={v.id} player={v} variant={v.id === litId ? 'line' : 'soft'} />
          ))}
        </div>
      </div>
    </div>
  )
}
