import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Stepper } from '../../shared/components/Stepper'
import { ToolLayout } from '../../shared/components/ToolLayout'
import { buzz } from '../../shared/haptics'
import { Die } from './Die'
import { DICE_TYPES, MAX_COUNT, useDiceStore } from './store'

const ROLL_MS = 600
const TICK_MS = 70

// 显式映射而非拼接类名：Tailwind 编译期扫描静态字符串
const COLS_CLASS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}

function colsFor(n: number) {
  if (n <= 4) return 2
  if (n <= 9) return 3
  return 4
}

/** 时刻格式跟界面语言走：中文 24 小时制、英文 AM/PM，与用户预期一致 */
function formatTime(at: number, locale: string) {
  return new Date(at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}

export default function DicePage() {
  const { t, i18n } = useTranslation()
  const { sides, count, last, history, setSides, setCount, roll, clearHistory } = useDiceStore()
  const [rolling, setRolling] = useState(false)
  // 动画期间展示的临时随机值，落定后置空、改读 store 的真实结果
  const [preview, setPreview] = useState<number[] | null>(null)
  const timers = useRef<{ tick?: number; stop?: number }>({})

  useEffect(
    () => () => {
      window.clearInterval(timers.current.tick)
      window.clearTimeout(timers.current.stop)
    },
    [],
  )

  const handleRoll = () => {
    if (rolling) return
    setRolling(true)
    buzz(20)

    timers.current.tick = window.setInterval(() => {
      // 动画用的假值，不影响真实结果
      setPreview(Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides)))
    }, TICK_MS)

    timers.current.stop = window.setTimeout(() => {
      window.clearInterval(timers.current.tick)
      roll()
      setPreview(null)
      setRolling(false)
      buzz([15, 30, 15])
    }, ROLL_MS)
  }

  const shown = preview ?? last?.values ?? []
  const total = preview ? preview.reduce((a, b) => a + b, 0) : last?.total
  const cols = colsFor(shown.length)

  return (
    <ToolLayout
      panel={
        <>
          <section className="card flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="section-label">{t('dice.type')}</span>
              <div className="flex flex-wrap gap-2">
                {DICE_TYPES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSides(s)}
                    className={`btn-base min-w-16 px-3 ${
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
              max={MAX_COUNT}
            />
          </section>

          <button
            type="button"
            onClick={handleRoll}
            disabled={rolling}
            className="btn-base min-h-20 w-full bg-amber-400 text-xl font-bold text-ink"
          >
            {rolling ? t('dice.rolling') : t('dice.roll', { n: count, sides })}
          </button>

          {history.length > 0 && (
            <section className="flex min-h-0 flex-none flex-col gap-2 wide:flex-1">
              <div className="flex items-center justify-between">
                <span className="section-label">{t('tools.dice.history')}</span>
                <ConfirmButton onConfirm={clearHistory} className="!min-h-12 !px-4 !text-sm">
                  {t('common.clear')}
                </ConfirmButton>
              </div>
              {/* 历史是次要信息，允许在自己的框里滚，页面级仍然不翻页。
                  竖屏时控制栏在底部只有 45dvh，给历史限高 256px，别把投掷按钮顶出可视区 */}
              <ul className="max-h-64 min-h-0 flex-1 divide-y divide-line overflow-y-auto rounded-2xl border border-line bg-surface wide:max-h-none">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="w-14 shrink-0 font-mono text-text-dim">
                      {h.values.length}d{h.sides}
                    </span>
                    <span className="flex-1 truncate font-mono text-text-muted">
                      {h.values.join(' · ')}
                    </span>
                    <span className="font-mono text-base font-bold text-amber-300">{h.total}</span>
                    <span className="w-10 shrink-0 text-right text-xs text-text-dim">
                      {formatTime(h.at, i18n.language)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      }
    >
      {shown.length > 0 ? (
        <>
          <div className="flex min-h-0 flex-1 items-center justify-center">
            {/* aspectRatio + max-h/max-w 双向夹住：骰子随可用空间缩放，永不溢出一屏 */}
            <div
              className={`grid max-h-full max-w-full gap-3 ${COLS_CLASS[cols]}`}
              style={{ aspectRatio: `${cols} / ${Math.ceil(shown.length / cols)}` }}
            >
              {shown.map((v, i) => (
                <Die key={i} value={v} sides={sides} rolling={rolling} />
              ))}
            </div>
          </div>
          {shown.length > 1 && (
            <p className="shrink-0 text-center text-text-muted">
              {t('common.total')}{' '}
              <span className="font-mono text-data font-bold tabular-nums text-text">{total}</span>
            </p>
          )}
        </>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center text-lg text-text-dim">
          {t('tools.dice.hint')}
        </div>
      )}
    </ToolLayout>
  )
}
