import { useEffect, useRef, useState } from 'react'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Stepper } from '../../shared/components/Stepper'
import { buzz } from '../../shared/haptics'
import { Die } from './Die'
import { DICE_TYPES, MAX_COUNT, useDiceStore } from './store'

const ROLL_MS = 600
const TICK_MS = 70

function colsClass(n: number) {
  if (n <= 4) return 'grid-cols-2'
  if (n <= 9) return 'grid-cols-3'
  return 'grid-cols-4'
}

function formatTime(at: number) {
  return new Date(at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export default function DicePage() {
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

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-400">骰型</span>
          <div className="flex flex-wrap gap-2">
            {DICE_TYPES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSides(s)}
                className={`min-w-14 rounded-xl px-3 py-2.5 text-sm font-semibold transition active:scale-95 ${
                  s === sides ? 'bg-amber-400 text-ink' : 'bg-surface-2 text-slate-300'
                }`}
              >
                d{s}
              </button>
            ))}
          </div>
        </div>
        <Stepper label="数量" value={count} onChange={setCount} min={1} max={MAX_COUNT} />
      </section>

      <button
        type="button"
        onClick={handleRoll}
        disabled={rolling}
        className="rounded-2xl bg-amber-400 py-5 text-lg font-bold text-ink transition active:scale-[0.98] disabled:opacity-60"
      >
        {rolling ? '投掷中…' : `投掷 ${count}d${sides}`}
      </button>

      {shown.length > 0 && (
        <section className="flex flex-col items-center gap-4">
          <div className={`grid w-full max-w-sm gap-2.5 ${colsClass(shown.length)}`}>
            {shown.map((v, i) => (
              <Die key={i} value={v} sides={sides} rolling={rolling} />
            ))}
          </div>
          {shown.length > 1 && (
            <p className="text-slate-400">
              总和 <span className="font-mono text-2xl font-bold text-slate-100">{total}</span>
            </p>
          )}
        </section>
      )}

      {history.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">历史记录</span>
            <ConfirmButton onConfirm={clearHistory} className="!px-3 !py-1.5 !text-xs">
              清空
            </ConfirmButton>
          </div>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="w-14 shrink-0 font-mono text-slate-500">
                  {h.values.length}d{h.sides}
                </span>
                <span className="flex-1 truncate font-mono text-slate-300">
                  {h.values.join(' · ')}
                </span>
                <span className="font-mono font-bold text-amber-300">{h.total}</span>
                <span className="w-10 shrink-0 text-right text-xs text-slate-600">
                  {formatTime(h.at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
