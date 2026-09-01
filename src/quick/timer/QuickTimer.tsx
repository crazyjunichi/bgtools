import { useEffect, useState } from 'react'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Stepper } from '../../shared/components/Stepper'
import { buzz } from '../../shared/haptics'
import { formatMS, MAX_SEC, MIN_SEC, PRESETS, STEP_SEC, useQuickTimerStore } from './store'

const TICK_MS = 250

/**
 * 顶栏快捷计时器。这里只负责显示与操作 —— 到时判定在常驻的 QuickLayer 里，
 * 否则关掉 dialog 就没人 tick 了。
 * 中性色用 sky：同屏 rose 留给"到时"这种打断性警示。
 */
export function QuickTimer() {
  const { durationSec, endAt, remainMs, setDuration, start, pause, resume, cancel } =
    useQuickTimerStore()
  const [now, setNow] = useState(() => Date.now())

  // 只在 dialog 打开期间跑，用于刷新显示；剩余时间始终用 endAt - now 重算
  useEffect(() => {
    if (endAt === null) return
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS)
    return () => window.clearInterval(id)
  }, [endAt])

  const running = endAt !== null
  const paused = remainMs !== null
  const left = running ? endAt - now : (remainMs ?? durationSec * 1000)

  return (
    // 横向双栏：控制收进左侧固定窄栏，时间显示独占右侧。两态共用同一个显示区，
    // 开始/暂停时大数字不会跳位置
    <div className="flex gap-4">
      <div className="flex w-56 shrink-0 flex-col gap-3">
        {running || paused ? (
          <>
            <button
              type="button"
              onClick={() => {
                if (running) pause()
                else resume()
                buzz()
              }}
              className="btn-base min-h-16 w-full bg-sky-400 text-xl font-bold text-ink"
            >
              {running ? '⏸ 暂停' : '▶ 继续'}
            </button>
            {/* 桌上误触取消会毁掉一个限时回合，必须点两次 */}
            <ConfirmButton onConfirm={cancel} className="w-full">
              ✕ 取消
            </ConfirmButton>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <span className="section-label">快速开始</span>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      start(sec)
                      buzz(20)
                    }}
                    className="btn-base bg-surface-2 font-mono text-base tabular-nums text-text"
                  >
                    {formatMS(sec * 1000)}
                  </button>
                ))}
              </div>
            </div>

            <Stepper
              label={`自定义（${STEP_SEC} 秒一档）`}
              value={durationSec}
              onChange={setDuration}
              min={MIN_SEC}
              max={MAX_SEC}
              step={STEP_SEC}
              format={(sec) => formatMS(sec * 1000)}
            />

            <button
              type="button"
              onClick={() => {
                start()
                buzz(20)
              }}
              className="btn-base mt-auto min-h-16 w-full bg-sky-400 text-xl font-bold text-ink"
            >
              开始 {formatMS(durationSec * 1000)}
            </button>
          </>
        )}
      </div>

      <div
        className={`flex min-h-56 flex-1 flex-col items-center justify-center gap-2 rounded-2xl border p-4 ${
          paused ? 'border-amber-500/60 bg-amber-500/15' : 'border-line bg-surface-2'
        }`}
      >
        <span className="font-mono text-data font-bold tabular-nums text-text">
          {formatMS(left)}
        </span>
        {/* 暂停态不只靠颜色：加一行文案 */}
        <span className="text-sm text-text-muted">
          {running ? '计时中' : paused ? '⏸ 已暂停' : '未开始'}
        </span>
      </div>
    </div>
  )
}
