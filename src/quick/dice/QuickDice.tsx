import { lazy, Suspense, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Stepper } from '../../shared/components/Stepper'
import type { RenderDie } from '../../shared/dice/dice3d/DiceCanvas'
import { dieRenderOf, numericDie } from '../../shared/dice/types'
import { buzz } from '../../shared/haptics'
import { QUICK_DICE_TYPES, QUICK_MAX_COUNT, useQuickDiceStore } from './store'

/**
 * three.js 是全项目唯一的大依赖（~170KB gzip），不能进首屏包 —— 它只服务
 * 一个装饰用的画布。quick registry 那条"静态 import 不懒加载"针对的是很小的
 * 组件，这里是例外；dialog 一打开就预取，按到「投掷」时早已到位
 */
const DiceCanvas = lazy(() =>
  import('../../shared/dice/dice3d/DiceCanvas').then((m) => ({ default: m.DiceCanvas })),
)

/**
 * 顶栏快捷骰子。数字读数不等动画 —— 在别的工具中途弹出来，要的是立刻出数，
 * 3D 骰子只是同时在上方把这个结果转出来，两者读的是同一个 crypto 结果。
 * 身份色沿用骰子工具的 amber，建立"琥珀色 = 骰子"的认知一致。
 */
export function QuickDice() {
  const { t } = useTranslation()
  const { sides, count, last, seq, setSides, setCount, roll } = useQuickDiceStore()

  useEffect(() => {
    void import('../../shared/dice/dice3d/DiceCanvas')
  }, [])

  const handleRoll = () => {
    roll()
    buzz([15, 30, 15])
  }

  const total = last ? last.reduce((a, b) => a + b, 0) : null
  // 顺手掷一下没有锁定这回事：每颗都用同一个 seq，投掷时全部一起转
  const dice = useMemo<RenderDie[]>(() => {
    if (!last) return []
    const render = dieRenderOf(numericDie(sides, 'amber'))
    return last.map((face, i) => ({ key: String(i), render, face, locked: false, spin: seq }))
  }, [last, seq, sides])

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

      {/* 结果区。内部再分「弹性的 3D 画布 + 刚性的数字读数」，下限按预算反推：
          读数最挤的一档是 4 颗（横屏 88px 两行 + 总和 56px ≈ 212px），
          416px 才能给画布留下 ~156px；用 vmin 而非 vh，竖屏取长边会把整块撑爆 */}
      <div className="order-1 flex min-h-[min(26rem,58vmin)] min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface-2 p-4 short:gap-1 short:p-2 wide:order-2">
        {last === null ? (
          <span className="text-sm text-text-dim">{t('quick.dice.hint')}</span>
        ) : (
          <>
            {/* fallback 撑住同样的空间，加载完不会让下方读数跳一下；
                没有 WebGL 时 DiceCanvas 返回 null，这块空间跟着收掉 */}
            <Suspense fallback={<div className="min-h-0 w-full flex-1" />}>
              <DiceCanvas dice={dice} className="min-h-0 w-full flex-1" />
            </Suspense>
            {/* leading-none 是预算的前提：88px 的字默认行盒会多吃 17px */}
            <div className="flex shrink-0 flex-col items-center gap-2 short:gap-1">
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {last.map((v, i) => (
                  <span
                    key={i}
                    className="font-mono text-data font-bold leading-none tabular-nums text-amber-300"
                  >
                    {v}
                  </span>
                ))}
              </div>
              {last.length > 1 && (
                <span className="flex items-baseline gap-2">
                  <span className="section-label">{t('common.total')}</span>
                  <span className="font-mono text-data-md font-bold leading-none tabular-nums text-text">
                    {total}
                  </span>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
