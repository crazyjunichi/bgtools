import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { buzz } from '../../shared/haptics'
import {
  IconBackspace,
  IconEraser,
  IconMore,
  IconMoveDown,
  IconTemplate,
} from '../../shared/icons'
import { fmtScore } from '../../shared/match/format'
import { PLAYER_SOLID } from '../../shared/players/colors'
import type { SeatView } from '../../shared/players/seats'
import { entryLabel, scoreOf, type Entry } from './store'
import { isCount } from './templates'

type Props = {
  /** 选中格所属的席位与条目；缺一个就是没选中 */
  seat?: SeatView
  entry?: Entry
  /** 当前格已存的原始值 */
  raw?: number
  /** null = 清空这一格 */
  onInput: (raw: number | null) => void
  onNext: () => void
  onOpenTemplate: () => void
  onOpenMore: () => void
}

const INT = /^-?\d+$/

/**
 * 右侧数字键盘。**每按一下就写进 store**，没有"确认"这一步 ——
 * 桌上报分是一串连续动作（点格子 → 报数 → 下一条），中间插一个确认键必然被漏掉。
 *
 * 输入缓冲从空开始而不是续写已有值：点一个填了 2 的格子再按 4 得 4，不是 24。
 * 缓冲靠父组件的 `key={pickKey}` 在换格时自然重置，不写 effect。
 * 例外是 `⌫` 与 `±` —— 它们以**当前显示的数**为基准，这样才能就地改一位或翻个符号。
 */
export function SheetKeypad({
  seat,
  entry,
  raw,
  onInput,
  onNext,
  onOpenTemplate,
  onOpenMore,
}: Props) {
  const { t } = useTranslation()
  const [buf, setBuf] = useState('')

  const active = Boolean(seat && entry)
  const base = buf === '' && raw !== undefined ? String(raw) : buf

  const write = (next: string) => {
    setBuf(next)
    onInput(INT.test(next) ? Number(next) : null)
    buzz()
  }

  const digit = (d: string) => write(buf + d)
  const backspace = () => write(base.replace(/.$/, ''))
  // 空格子上先按 ± 再按数字也成立：缓冲里先留一个孤零零的负号，此刻格子算清空
  const sign = () => write(base.startsWith('-') ? base.slice(1) : `-${base}`)
  const clear = () => {
    setBuf('')
    onInput(null)
    buzz()
  }

  const shown = buf === '' ? (raw === undefined ? '·' : fmtScore(raw)) : fmtBuf(buf)
  const counted = entry !== undefined && isCount(entry.scoring)
  const value = INT.test(base) ? Number(base) : 0

  return (
    <div className="flex shrink-0 flex-col gap-2 wide:w-64">
      {/*
       * 上下文块是「选中格」的非颜色编码：矩阵里只有一圈 violet 描边，
       * 谁的哪一条全靠这里明写 —— 强光下描边可能完全看不见。
       *
       * **行数恒定（三行），未选中时也照排**：内容长短一变，下面的键区就跟着上下漂，
       * 同一个数字键换条目后换了位置，桌上盲点必然点错。所以换算表整块搬去了行首浮层
       * （[EntryPanel](EntryPanel.tsx)），折算结果压成大数字右边的小字而不另起一行。
       */}
      <div className="flex shrink-0 flex-col gap-1 rounded-xl bg-surface-2 p-2 short:gap-0.5 short:p-1.5">
        {/* 色条独占整行：列宽只有 96px，矩阵列头那个胶囊常被截断，这里是「填的是谁」的完整回读 */}
        <div className="flex min-h-7 items-center short:min-h-6">
          {active && seat && (
            <span
              className={`w-full truncate rounded-md px-2 py-1 text-center text-sm font-bold short:py-0 ${
                PLAYER_SOLID[seat.color]
              }`}
            >
              {seat.name}
            </span>
          )}
        </div>

        {/*
         * 未选中时这一行放提示语，所以两种文案都得压在单行内（撑成两行就毁了固定高度）。
         * 「数量 / 得分」跟在条目名后面而不另占一行：它限定的正是这一条填什么，隔开了要来回看
         */}
        <div className="flex min-h-5 items-baseline gap-1.5 short:min-h-4">
          <span
            className={`min-w-0 truncate text-sm ${entry ? 'font-semibold' : 'text-text-muted'}`}
          >
            {entry ? entryLabel(entry, t) : t('tools.scoreSheet.keypad.idle')}
          </span>
          {entry && (
            <span className="section-label shrink-0">
              ({t(counted ? 'tools.scoreSheet.keypad.count' : 'tools.scoreSheet.keypad.score')})
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-center gap-2">
          <span
            className={`font-mono text-data-sm font-bold leading-none tabular-nums ${
              active ? 'text-violet-200' : 'text-text-dim'
            }`}
          >
            {shown}
          </span>
          {counted && entry && (
            <span className="shrink-0 text-xs tabular-nums text-text-dim">
              {t('tools.scoreSheet.keypad.derived', { score: fmtScore(scoreOf(entry, value)) })}
            </span>
          )}
        </div>
      </div>

      {/* 刻意不写 min-h-0：要留着自动最小尺寸这条地板，否则挤压时键会被压破 44px */}
      <div className="grid flex-1 grid-cols-4 grid-rows-4 gap-2 short:gap-1.5">
        <Digit d="7" on={digit} off={!active} />
        <Digit d="8" on={digit} off={!active} />
        <Digit d="9" on={digit} off={!active} />
        <Key onPress={backspace} off={!active} label={t('tools.scoreSheet.keypad.backspace')}>
          <IconBackspace className="size-6" aria-hidden />
        </Key>

        <Digit d="4" on={digit} off={!active} />
        <Digit d="5" on={digit} off={!active} />
        <Digit d="6" on={digit} off={!active} />
        <Key onPress={sign} off={!active} label={t('tools.scoreSheet.keypad.sign')}>
          <span className="font-mono text-2xl" aria-hidden>
            ±
          </span>
        </Key>

        <Digit d="1" on={digit} off={!active} />
        <Digit d="2" on={digit} off={!active} />
        <Digit d="3" on={digit} off={!active} />
        <Key onPress={clear} off={!active} label={t('tools.scoreSheet.keypad.clear')}>
          <IconEraser className="size-6" aria-hidden />
        </Key>

        <Digit d="0" on={digit} off={!active} span />
        {/* 「下一条」把视线留在键盘上连着填一列，不必每填一格都回矩阵点一次 */}
        <Key onPress={onNext} off={!active} span accent>
          <IconMoveDown className="size-6" aria-hidden />
          <span className="text-base">{t('tools.scoreSheet.keypad.next')}</span>
        </Key>
      </div>

      {/* 只留这两个：模板是开局要选的，其余出口全在「更多」里 —— 加人已挪到矩阵列头 */}
      <div className="grid shrink-0 grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onOpenTemplate}
          className="btn-quiet gap-2 text-sm short:!min-h-11"
        >
          <IconTemplate className="size-5" aria-hidden />
          {t('tools.scoreSheet.bar.template')}
        </button>
        <button
          type="button"
          onClick={onOpenMore}
          className="btn-quiet gap-2 text-sm short:!min-h-11"
        >
          <IconMore className="size-5" aria-hidden />
          {t('tools.scoreSheet.bar.more')}
        </button>
      </div>
    </div>
  )
}

/** 缓冲里的负号存的是 ASCII 连字符（好做字符串运算），显示时换成 U+2212 */
function fmtBuf(buf: string): string {
  return buf.startsWith('-') ? `−${buf.slice(1)}` : buf
}

function Digit({
  d,
  on,
  off,
  span,
}: {
  d: string
  on: (d: string) => void
  off: boolean
  span?: boolean
}) {
  return (
    <Key onPress={() => on(d)} off={off} span={span}>
      <span className="font-mono text-3xl font-bold tabular-nums short:text-2xl">{d}</span>
    </Key>
  )
}

function Key({
  onPress,
  off,
  span,
  accent,
  label,
  children,
}: {
  onPress: () => void
  off: boolean
  span?: boolean
  accent?: boolean
  label?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={off}
      aria-label={label}
      className={`btn-base min-h-14 gap-2 border disabled:opacity-40 short:!min-h-11 ${
        span ? 'col-span-2' : ''
      } ${accent ? 'border-violet-500/60 bg-violet-500/15 text-violet-200' : 'border-line bg-surface-2'}`}
    >
      {children}
    </button>
  )
}
