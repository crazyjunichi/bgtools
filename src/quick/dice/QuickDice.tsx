import { useTranslation } from 'react-i18next'
import { Stepper } from '../../shared/components/Stepper'
import { buzz } from '../../shared/haptics'
import { QUICK_DICE_TYPES, QUICK_MAX_COUNT, useQuickDiceStore } from './store'

/**
 * 顶栏快捷骰子。刻意不做滚动动画 —— 在别的工具中途弹出来，要的是立刻出数。
 * 身份色沿用骰子工具的 amber，建立"琥珀色 = 骰子"的认知一致。
 */
export function QuickDice() {
  const { t } = useTranslation()
  const { sides, count, last, setSides, setCount, roll } = useQuickDiceStore()

  const handleRoll = () => {
    roll()
    buzz([15, 30, 15])
  }

  const total = last ? last.reduce((a, b) => a + b, 0) : null

  return (
    // 朝向只决定排列轴：横屏并排、竖屏堆叠，两种朝向都一屏放完
    <div className="flex flex-col gap-4 short:gap-2 wide:flex-row">
      {/* 刚性块（按钮和步进器压了就点不到）。竖屏排在下贴拇指，宽度只在横屏约束 ——
          矮屏不收窄：手机横屏宽有 ~750px 不紧张，收窄反而让 6 列骰型挤到放不下 d10 */}
      <div className="order-2 flex shrink-0 flex-col gap-3 short:gap-2 wide:order-1 wide:w-56">
        <div className="flex flex-col gap-2">
          <span className="section-label">{t('dice.type')}</span>
          {/* 3 列两行，每格 ≈64px 宽仍满足触控目标；矮屏挤成 6 列一行，省掉一整行 64px */}
          <div className="grid grid-cols-3 gap-2 short:grid-cols-6 short:gap-1">
            {QUICK_DICE_TYPES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSides(s)}
                className={`btn-base short:!min-h-11 short:text-sm ${
                  s === sides ? 'bg-amber-400 text-ink' : 'bg-surface-2 text-text-muted'
                }`}
              >
                d{s}
              </button>
            ))}
          </div>
        </div>

        <Stepper
          label={t('common.count')}
          value={count}
          onChange={setCount}
          min={1}
          max={QUICK_MAX_COUNT}
        />

        <button
          type="button"
          onClick={handleRoll}
          className="btn-base mt-auto min-h-16 w-full bg-amber-400 text-xl font-bold text-ink short:min-h-12 short:text-base"
        >
          {t('dice.roll', { n: count, sides })}
        </button>
      </div>

      {/* 弹性块：下限跟 vmin 走，平板横屏算出来仍是 224px（与原 min-h-56 一致），
          手机横屏收到 ~133px、竖屏 ~148px。用 vh 会在竖屏取长边，那是指针表盘爆宽的原因 */}
      <div className="order-1 flex min-h-[min(14rem,38vmin)] min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface-2 p-4 short:p-2 wide:order-2">
        {last === null ? (
          <span className="text-sm text-text-dim">{t('quick.dice.hint')}</span>
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
              {t('common.total')}{' '}
              <span className="font-mono font-bold tabular-nums text-text">{total}</span>
            </span>
          </>
        )}
      </div>
    </div>
  )
}
