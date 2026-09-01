import { Stepper } from '../../shared/components/Stepper'
import { buzz } from '../../shared/haptics'
import { QUICK_DICE_TYPES, QUICK_MAX_COUNT, useQuickDiceStore } from './store'

/**
 * 顶栏快捷骰子。刻意不做滚动动画 —— 在别的工具中途弹出来，要的是立刻出数。
 * 身份色沿用骰子工具的 amber，建立"琥珀色 = 骰子"的认知一致。
 */
export function QuickDice() {
  const { sides, count, last, setSides, setCount, roll } = useQuickDiceStore()

  const handleRoll = () => {
    roll()
    buzz([15, 30, 15])
  }

  const total = last ? last.reduce((a, b) => a + b, 0) : null

  return (
    // 横向双栏：参数收进左侧固定窄栏，结果区独占右侧 —— 一屏放完，不出滚动条
    <div className="flex gap-4">
      <div className="flex w-56 shrink-0 flex-col gap-3">
        <div className="flex flex-col gap-2">
          <span className="section-label">骰型</span>
          {/* 3 列两行，每格 ≈64px 宽仍满足触控目标 */}
          <div className="grid grid-cols-3 gap-2">
            {QUICK_DICE_TYPES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSides(s)}
                className={`btn-base ${
                  s === sides ? 'bg-amber-400 text-ink' : 'bg-surface-2 text-text-muted'
                }`}
              >
                d{s}
              </button>
            ))}
          </div>
        </div>

        <Stepper label="数量" value={count} onChange={setCount} min={1} max={QUICK_MAX_COUNT} />

        <button
          type="button"
          onClick={handleRoll}
          className="btn-base mt-auto min-h-16 w-full bg-amber-400 text-xl font-bold text-ink"
        >
          投掷 {count}d{sides}
        </button>
      </div>

      <div className="flex min-h-56 flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface-2 p-4">
        {last === null ? (
          <span className="text-sm text-text-dim">点「投掷」出数</span>
        ) : last.length === 1 ? (
          <span className="font-mono text-data font-bold tabular-nums text-amber-300">
            {last[0]}
          </span>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
              {last.map((v, i) => (
                <span
                  key={i}
                  className="font-mono text-data-sm font-bold tabular-nums text-amber-300"
                >
                  {v}
                </span>
              ))}
            </div>
            <span className="text-sm text-text-muted">
              总和 <span className="font-mono font-bold tabular-nums text-text">{total}</span>
            </span>
          </>
        )}
      </div>
    </div>
  )
}
