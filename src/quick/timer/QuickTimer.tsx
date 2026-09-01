import { useEffect, useState } from 'react'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Stepper } from '../../shared/components/Stepper'
import { buzz } from '../../shared/haptics'
import { IconClose, IconPause, IconPlay } from '../../shared/icons'
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
    // 朝向只决定排列轴：横屏并排、竖屏堆叠。两态共用同一个显示区，
    // 开始/暂停时大数字不会跳位置
    <div className="flex flex-col gap-4 short:gap-2 wide:flex-row">
      {/* 刚性块。竖屏排在下贴拇指，宽度只在横屏约束 */}
      <div className="order-2 flex shrink-0 flex-col gap-3 short:gap-2 wide:order-1 wide:w-56">
        {running || paused ? (
          <>
            <button
              type="button"
              onClick={() => {
                if (running) pause()
                else resume()
                buzz()
              }}
              className="btn-base min-h-16 w-full gap-2 bg-sky-400 text-xl font-bold text-ink short:min-h-12 short:text-base"
            >
              {running ? (
                <IconPause className="size-6 short:size-5" aria-hidden />
              ) : (
                <IconPlay className="size-6 short:size-5" aria-hidden />
              )}
              {running ? '暂停' : '继续'}
            </button>
            {/* 桌上误触取消会毁掉一个限时回合，必须点两次 */}
            <ConfirmButton onConfirm={cancel} className="w-full">
              <IconClose className="size-5 short:size-4" aria-hidden />
              取消
            </ConfirmButton>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <span className="section-label">快速开始</span>
              {/* 矮屏改 4 列一行：省掉一整行 ~52px，正好是塞进手机横屏的最后那点缺口 */}
              <div className="grid grid-cols-2 gap-2 short:grid-cols-4 short:gap-1">
                {PRESETS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      start(sec)
                      buzz(20)
                    }}
                    className="btn-base bg-surface-2 font-mono text-base tabular-nums text-text short:!min-h-11 short:text-sm"
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
              className="btn-base mt-auto min-h-16 w-full bg-sky-400 text-xl font-bold text-ink short:min-h-12 short:text-base"
            >
              开始 {formatMS(durationSec * 1000)}
            </button>
          </>
        )}
      </div>

      {/* 弹性块，同 QuickDice：跟 vmin 走，平板横屏仍是 224px */}
      <div
        className={`order-1 flex min-h-[min(14rem,38vmin)] min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-2xl border p-4 short:p-2 wide:order-2 ${
          paused ? 'border-amber-500/60 bg-amber-500/15' : 'border-line bg-surface-2'
        }`}
      >
        <span className="font-mono text-data font-bold tabular-nums text-text">
          {formatMS(left)}
        </span>
        {/* 暂停态不只靠颜色：加一行文案 */}
        <span className="flex items-center gap-1 text-sm text-text-muted">
          {paused && <IconPause className="size-4" aria-hidden />}
          {running ? '计时中' : paused ? '已暂停' : '未开始'}
        </span>
      </div>
    </div>
  )
}
