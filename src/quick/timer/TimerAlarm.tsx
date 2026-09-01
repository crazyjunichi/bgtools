import { buzz } from '../../shared/haptics'
import { formatMS, useQuickTimerStore } from './store'

/**
 * 到时提醒。全屏红底是刻意的：平板平放在桌上、没人盯着屏幕，
 * 只有整屏变色才能在斜视 45° 下被立刻注意到。
 *
 * 这是 DESIGN.md「rose 仅限破坏性语义」的一处例外 —— 它全屏独占且瞬时，
 * 不会与工具内的 rose 同屏，用的仍是 rose-600 + 白字加粗（4.5:1）这一档。
 * z-40 压住 dialog(z-30)：计时器 dialog 开着时到时，提醒必须在最上层。
 */
export function TimerAlarm() {
  const { durationSec, dismiss, start } = useQuickTimerStore()

  return (
    // 整屏可点消除；按钮区自己吃掉事件，不冒泡
    <div
      onPointerDown={dismiss}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-rose-600/95 p-6 backdrop-blur-sm"
    >
      <span className="animate-pulse text-center text-data font-bold text-white">⏰ 时间到</span>

      <div className="flex gap-3" onPointerDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => {
            start()
            buzz(20)
          }}
          className="btn-base bg-white px-6 text-lg font-bold text-ink"
        >
          🔄 再计 {formatMS(durationSec * 1000)}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="btn-base border-2 border-white/70 px-6 text-lg font-bold text-white"
        >
          知道了
        </button>
      </div>

      <span className="text-sm text-white/80">点任意处关闭</span>
    </div>
  )
}
