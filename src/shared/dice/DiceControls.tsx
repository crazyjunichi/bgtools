import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../components/ConfirmButton'
import { buzz } from '../haptics'
import { IconReset } from '../icons'
import { findDiceSet } from './presets'
import { useDiceSlice, useDiceStore } from './store'
import { dieName } from './types'

/**
 * 骰子界面的控制块（**刚性**：按钮压了就点不到）。不带外壳 ——
 * 由调用方决定是嵌进工具页的 ToolLayout 还是塞进浮层。
 */
export function DiceControls({ setId }: { setId: string }) {
  const { t } = useTranslation()
  const { selected, results } = useDiceSlice(setId)
  // 逐个取而不是整份解构：整份会订阅所有骰组，别人那套一动这里就白渲染
  const toggleDie = useDiceStore((s) => s.toggleDie)
  const selectAll = useDiceStore((s) => s.selectAll)
  const selectNone = useDiceStore((s) => s.selectNone)
  const roll = useDiceStore((s) => s.roll)
  const clear = useDiceStore((s) => s.clear)

  const set = findDiceSet(setId)
  if (!set) return null

  const allPicked = selected.length === set.dice.length
  const rolled = Object.keys(results).length > 0
  // 已勾选但没锁的都会被重掷 —— 包括「掷完之后才勾上」的那几颗
  const loose = selected.filter((i) => !results[i]?.locked).length

  const handleRoll = () => {
    roll(setId)
    buzz([15, 30, 15])
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 short:gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="section-label">{t('dice.pool.pick')}</span>
        <button
          type="button"
          onClick={() => (allPicked ? selectNone(setId) : selectAll(setId))}
          className="btn-quiet !min-h-11 px-3 text-sm"
        >
          {t(allPicked ? 'dice.pool.none' : 'dice.pool.all')}
        </button>
      </div>

      {/* 三列在最窄的面板档里仍满足触控目标；一盒游戏的骰子是个位数，不需要滚动 */}
      <div className="grid grid-cols-3 gap-2 short:gap-1">
        {set.dice.map((spec, i) => {
          const picked = selected.includes(i)
          const name = dieName(spec, t)
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggleDie(setId, i)}
              aria-pressed={picked}
              aria-label={t('dice.pool.die', { name, n: i + 1 })}
              // 未勾选除了压暗还加删除线：颜色不许是唯一编码。
              // 用删除线而不是加个勾图标，切换时不会让整格内容跳位
              className={`btn-base flex-col gap-0 leading-tight short:!min-h-11 ${
                picked ? 'bg-amber-400 text-ink' : 'bg-surface-2 text-text-muted line-through'
              }`}
            >
              <span className="text-base font-bold">{name}</span>
              <span className="font-mono text-xs tabular-nums">#{i + 1}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <button
          type="button"
          onClick={handleRoll}
          disabled={rolled ? loose === 0 : selected.length === 0}
          className="btn-base min-h-16 w-full bg-amber-400 text-xl font-bold text-ink disabled:bg-surface-2 disabled:text-text-dim short:!min-h-12 short:text-base"
        >
          {rolled
            ? t('dice.pool.reroll', { n: loose })
            : t('dice.pool.roll', { n: selected.length })}
        </button>
        <ConfirmButton onConfirm={() => clear(setId)} disabled={!rolled} className="w-full">
          <IconReset className="size-5" aria-hidden />
          {t('common.clear')}
        </ConfirmButton>
      </div>
    </div>
  )
}
