import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Stepper } from '../../shared/components/Stepper'
import { buzz } from '../../shared/haptics'
import { useWakeLock } from '../../shared/hooks/useWakeLock'
import { IconBack, IconPlay } from '../../shared/icons'
import type { I18nKey } from '../../shared/i18n/types'
import { MAX_BATCH, MIN_BATCH, useRandomWordsStore, type Labeling } from './store'

// 词越多字越小，vmin 跟着视口短边走
const WORD_SIZE: Record<number, string> = {
  1: 'text-[clamp(2.5rem,14vmin,9rem)]',
  2: 'text-[clamp(2.25rem,10vmin,6.5rem)]',
  3: 'text-[clamp(2rem,8.5vmin,5.5rem)]',
  4: 'text-[clamp(1.75rem,7vmin,4.5rem)]',
  5: 'text-[clamp(1.5rem,6vmin,3.75rem)]',
  6: 'text-[clamp(1.5rem,5vmin,3.25rem)]',
}

const LABELINGS = [
  { value: 'none', nameKey: 'tools.randomWords.label.none' },
  { value: 'number', nameKey: 'tools.randomWords.label.number' },
  { value: 'letter', nameKey: 'tools.randomWords.label.letter' },
] as const satisfies readonly { value: Labeling; nameKey: I18nKey }[]

/** 角标字符：数字或字母。只有一张牌时不挂角标（唯一的牌不需要编号） */
function badgeOf(labeling: Labeling, index: number, total: number): string | null {
  if (labeling === 'none' || total === 1) return null
  return labeling === 'number' ? String(index + 1) : String.fromCharCode(65 + index)
}

export default function RandomWordsPage() {
  // 摊在桌上长时间盯屏翻词，不能息屏
  useWakeLock()
  const running = useRandomWordsStore((s) => s.running)
  return running ? <Run /> : <Setup />
}

function Setup() {
  const { t } = useTranslation()
  const { batchSize, labeling, setBatchSize, setLabeling, start } = useRandomWordsStore()

  // 没有主显示区可放，不套 ToolLayout：三项设置居中一列即是整页
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <Stepper
          value={batchSize}
          onChange={setBatchSize}
          min={MIN_BATCH}
          max={MAX_BATCH}
          label={t('tools.randomWords.batchSize')}
        />
        <div className="flex flex-col gap-1.5">
          <span className="section-label">{t('tools.randomWords.labeling')}</span>
          <div className="flex gap-2">
            {LABELINGS.map(({ value, nameKey }) => {
              const active = value === labeling
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setLabeling(value)}
                  className={`btn-base flex-1 ${
                    active ? 'eink-solid bg-sky-400 font-bold text-ink' : 'bg-surface-2 text-text'
                  }`}
                >
                  {t(nameKey)}
                </button>
              )
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            buzz()
            start()
          }}
          className="btn-base eink-solid gap-2 bg-sky-400 font-bold text-ink"
        >
          <IconPlay className="size-6 short:size-5" aria-hidden />
          {t('tools.randomWords.start')}
        </button>
      </div>
    </div>
  )
}

function Run() {
  const { t } = useTranslation()
  const { deck, cursor, batchSize, labeling, next, exit } = useRandomWordsStore()
  const words = deck.slice(cursor, cursor + batchSize)
  // 横屏两列时，奇数张的末张独占一行居中
  const oddLast = batchSize > 1 && words.length % 2 === 1

  const advance = () => {
    buzz(10)
    next()
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* 返回会结束这一局，桌上极易误触，走二次确认。
          包一层 stopPropagation：它的点击不能穿透成「换下一批」 */}
      <div className="absolute top-0 right-0 z-10" onClick={(e) => e.stopPropagation()}>
        <ConfirmButton onConfirm={exit}>
          <IconBack className="size-6 short:size-5" aria-hidden />
          {t('header.backInTool')}
        </ConfirmButton>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={t('tools.randomWords.nextAria')}
        onClick={advance}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            advance()
          }
        }}
        className={`grid min-h-0 w-full flex-1 auto-rows-fr cursor-pointer gap-3 outline-none select-none ${
          batchSize > 1 ? 'wide:grid-cols-2' : ''
        }`}
      >
        {words.map((w, i) => {
          const badge = badgeOf(labeling, i, words.length)
          return (
            <div
              key={w}
              className={`card relative flex items-center justify-center p-4 ${
                oddLast && i === words.length - 1 ? 'wide:col-span-2' : ''
              }`}
            >
              {badge && (
                <span
                  aria-hidden
                  className="absolute top-2 left-2 flex size-9 items-center justify-center rounded-full bg-surface-3 font-mono text-base font-bold text-text-muted short:size-7 short:text-sm"
                >
                  {badge}
                </span>
              )}
              <span
                className={`text-center leading-tight font-bold break-all ${WORD_SIZE[batchSize]}`}
              >
                {w}
              </span>
            </div>
          )
        })}
      </div>

      <p className="shrink-0 pt-2 text-center text-sm text-dim">{t('tools.randomWords.hint')}</p>
    </div>
  )
}
