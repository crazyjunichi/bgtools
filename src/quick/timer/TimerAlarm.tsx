import { useTranslation } from 'react-i18next'
import { buzz } from '../../shared/haptics'
import { IconAlarm, IconRepeat } from '../../shared/icons'
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
  const { t } = useTranslation()
  const { durationSec, dismiss, start } = useQuickTimerStore()

  return (
    // 整屏可点消除；按钮区自己吃掉事件，不冒泡
    <div
      /*
       * 同 QuickDialog 遮罩：必须 onClick。整屏 pointerdown 一按就卸载，
       * 抬手补发的 click 按新坐标 hit-test 全落到底下的工具页上 ——
       * 这一层是全屏的，穿透是必然而非偶然。
       */
      onClick={dismiss}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-rose-600/95 p-6 backdrop-blur-sm"
    >
      {/* 图标跟着 text-data 的 clamp 走（size-[0.9em]），不写死 px：整屏提醒在 10"–13" 平板上都要撑满 */}
      <span className="flex animate-pulse items-center gap-4 text-center text-data font-bold text-white">
        <IconAlarm className="size-[0.9em]" aria-hidden />
        {t('quick.timer.alarm.title')}
      </span>

      {/* 外层换成 click 后，这里的拦截也必须跟着换，否则按钮的 click 冒上去会立刻 dismiss */}
      <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => {
            start()
            buzz(20)
          }}
          className="btn-base gap-2 bg-white px-6 text-lg font-bold text-ink"
        >
          <IconRepeat className="size-5" aria-hidden />
          {t('quick.timer.alarm.again', { time: formatMS(durationSec * 1000) })}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="btn-base border-2 border-white/70 px-6 text-lg font-bold text-white"
        >
          {t('quick.timer.alarm.dismiss')}
        </button>
      </div>

      <span className="text-sm text-white/80">{t('quick.timer.alarm.tapToClose')}</span>
    </div>
  )
}
