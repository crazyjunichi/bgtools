import type { TFunction } from 'i18next'
import { Suspense, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { IconLocked } from '../icons'
import type { RenderDie } from './dice3d/DiceCanvas'
import { DiceCanvas } from './dice3d/lazy'
import { findDiceSet } from './presets'
import { useDiceSlice, useDiceStore, type DieResult } from './store'
import { DIE_CHIP, dieName, dieRenderOf, faceLabel, type DieSpec } from './types'

type Rolled = { index: number; spec: DieSpec; result: DieResult }

/**
 * 骰子界面的结果块（**弹性**：3D 画布吸收所有余量，读数区刚性）。
 *
 * 3D 画布是 `aria-hidden` 的装饰层，**可访问的真源是下面那排芯片** ——
 * 点芯片与点骰子都能切锁，没有 WebGL 时只是少了上面那块。
 */
export function DiceStage({ setId }: { setId: string }) {
  const { t } = useTranslation()
  const { selected, results } = useDiceSlice(setId)
  const toggleLock = useDiceStore((s) => s.toggleLock)
  const set = findDiceSet(setId)

  // 只画「已勾选且掷过」的，顺序跟骰组一致 —— 与控制栏的清单对得上
  const rolled = useMemo<Rolled[]>(
    () =>
      set
        ? selected
            .filter((i) => results[i])
            .map((i) => ({ index: i, spec: set.dice[i], result: results[i] }))
        : [],
    [set, selected, results],
  )

  // 每次渲染新建数组会让画布的重摆 effect 白跑一轮，这里必须记住
  const dice = useMemo<RenderDie[]>(
    () =>
      rolled.map(({ index, spec, result }) => ({
        key: String(index),
        render: dieRenderOf(spec),
        face: result.face,
        locked: result.locked,
        spin: result.spin,
      })),
    [rolled],
  )

  const { total, tally } = useMemo(() => summarize(rolled, t), [rolled, t])

  if (!set) return null
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface-2 p-4 short:gap-2 short:p-2">
      {rolled.length === 0 ? (
        selected.length === 0 && (
          <span className="text-sm text-text-dim">{t('dice.pool.emptyPick')}</span>
        )
      ) : (
        <>
          {/* fallback 占住同样的空间，加载完下方读数不会跳；
              没有 WebGL 时 DiceCanvas 返回 null，这块空间跟着收掉 */}
          <Suspense fallback={<div className="min-h-0 w-full flex-1" />}>
            <DiceCanvas
              dice={dice}
              onPick={(key) => toggleLock(setId, Number(key))}
              className="min-h-0 w-full flex-1"
            />
          </Suspense>

          <div className="flex shrink-0 flex-col items-center gap-2 short:gap-1">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {rolled.map(({ index, spec, result }) => {
                const face = spec.faces[result.face - 1]
                const label = faceLabel(face, t)
                const name = dieName(spec, t)
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleLock(setId, index)}
                    aria-pressed={result.locked}
                    aria-label={t(result.locked ? 'dice.pool.unlock' : 'dice.pool.lock', {
                      name,
                      face: label,
                    })}
                    // 锁定态整块换成 emerald，压过骰身色：「锁没锁」比「这是哪种骰」更需要一眼看见。
                    // 锁图标是第二编码，不许只靠颜色
                    className={`btn-base min-w-16 flex-col gap-0 border px-3 leading-tight short:!min-h-11 ${
                      result.locked
                        ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                        : DIE_CHIP[spec.hue]
                    }`}
                  >
                    <span className="font-mono text-data-sm font-bold leading-none tabular-nums">
                      {face.glyph}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-xs tabular-nums">
                      {/* 图标位常驻：切锁时芯片宽度不变，一排芯片才不会跟着重排 */}
                      <IconLocked
                        className={`size-3.5 ${result.locked ? '' : 'invisible'}`}
                        aria-hidden
                      />
                      #{index + 1}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1">
              {total !== null && (
                <span className="flex items-baseline gap-2">
                  <span className="section-label">{t('common.total')}</span>
                  <span className="font-mono text-data-md font-bold leading-none tabular-nums text-text">
                    {total}
                  </span>
                </span>
              )}
              {/* 全不同的时候计数行只是把芯片重念一遍，那种情况不显示 */}
              {(total === null || tally.some((e) => e.n > 1)) && (
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="section-label">{t('dice.pool.tally')}</span>
                  {tally.map((e) => (
                    <span key={e.glyph} className="text-sm text-text-muted">
                      <span className="font-mono text-base font-bold text-text">{e.glyph}</span>
                      {e.label !== e.glyph && <span className="sr-only">{e.label}</span>}
                      <span className="font-mono tabular-nums"> ×{e.n}</span>
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

type TallyEntry = { glyph: string; label: string; value?: number; n: number }

/**
 * 整体结果按面的类型自动选口径：有数值的面进总和，所有面都按面计数。
 * 两条口径同一盒游戏里可能都要看（快艇既看总和也看「几个 5」）。
 */
function summarize(rolled: Rolled[], t: TFunction) {
  let total: number | null = null
  const tally = new Map<string, TallyEntry>()

  for (const { spec, result } of rolled) {
    const face = spec.faces[result.face - 1]
    if (face.value !== undefined) total = (total ?? 0) + face.value
    const hit = tally.get(face.glyph)
    if (hit) hit.n++
    else
      tally.set(face.glyph, {
        glyph: face.glyph,
        label: faceLabel(face, t),
        value: face.value,
        n: 1,
      })
  }

  // 数字面按点数升序；符号面没有值，退回出现顺序
  const list = [...tally.values()].sort((a, b) => (a.value ?? 0) - (b.value ?? 0))
  return { total, tally: list }
}
