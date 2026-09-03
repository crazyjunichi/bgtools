import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { beep } from '../beep'
import { ConfirmButton } from '../components/ConfirmButton'
import { Overlay } from '../components/Overlay'
import { buzz } from '../haptics'
import { useWakeLock } from '../hooks/useWakeLock'
import { IconCheck, IconClose, IconMute, IconPause, IconPlay, IconSkip } from '../icons'
import { formatMS } from '../time'
import { cancelSpeech, speak, speechAvailable } from './speech'
import { TICK_MS, useVoiceHostStore } from './store'
import { KIND_ICON, KIND_LABEL, stepText } from './stepView'
import type { HostFlow } from './types'

/** 让提示音响完再接下一句，别叠在一起 */
const BEEP_MS = 900

/**
 * 主持现场。由宿主工具页在 `flowId` 命中时渲染，**流程的推进就住在这个组件里**
 * —— 关掉浮层即中断是已定的语义，所以不需要像 QuickLayer 那样跨页面常驻。
 *
 * 运行中浮层不可随手关闭（`dismissible`）：桌上一次误触会毁掉整晚的主持，
 * 唯一出口是底部那个二次确认按钮。
 */
export function HostRunner({ flow }: { flow: HostFlow }) {
  const { t } = useTranslation()
  const { steps, index, endAt, remainMs, paused, reveal, next, pause, resume, restart, stop } =
    useVoiceHostStore()
  const [now, setNow] = useState(() => Date.now())

  useWakeLock()

  const step = steps[index]
  const done = step === undefined

  /*
   * 推进引擎。三条自动路径（念完 / 提示音响完 / 倒计时到点）各自负责调一次 advance，
   * `confirm` 步没有定时器 —— 它就是在等人按。
   *
   * advance 用闭包内的开关做成**一次性**的，两处都需要：cleanup 之后才 resolve 的
   * 旧语音要被丢弃（StrictMode 的 setup→cleanup→setup 会真的制造这一幕），
   * 而 interval 在 next() 与重渲染之间还可能再响一次。
   */
  useEffect(() => {
    const cur = steps[index]
    if (paused || cur === undefined) return

    let spent = false
    const advance = () => {
      if (spent) return
      spent = true
      next()
    }

    if (cur.kind === 'say') {
      void speak(stepText(cur, t)).then(advance)
      return () => {
        spent = true
        cancelSpeech()
      }
    }

    if (cur.kind === 'beep') {
      beep()
      const id = window.setTimeout(advance, BEEP_MS)
      return () => {
        spent = true
        window.clearTimeout(id)
      }
    }

    if (cur.kind === 'wait') {
      const id = window.setInterval(() => {
        setNow(Date.now())
        // 剩余时间始终用 endAt 重算，不累减 —— 后台节流下 interval 的次数不可靠
        const at = useVoiceHostStore.getState().endAt
        if (at !== null && Date.now() >= at) advance()
      }, TICK_MS)
      return () => {
        spent = true
        window.clearInterval(id)
      }
    }
  }, [steps, index, paused, next, t])

  const left = endAt !== null ? endAt - now : (remainMs ?? 0)
  const Icon = done ? IconCheck : KIND_ICON[step.kind]
  const shown = Math.min(index + 1, steps.length)

  return (
    <Overlay
      maxWidth="max-w-3xl"
      // 跑完了才允许随手关；运行中只能走下面的「结束主持」
      dismissible={done}
      onClose={stop}
      title={
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-lg font-bold">{t(flow.nameKey)}</span>
          <span className="font-mono text-sm tabular-nums text-text-dim">
            {t('voiceHost.progress', { n: shown, total: steps.length })}
          </span>
        </div>
      }
    >
      {!speechAvailable() && (
        <p className="flex items-center gap-2 rounded-xl border border-amber-500/60 bg-amber-500/15 px-3 py-2 text-sm text-amber-300">
          <IconMute className="size-5 shrink-0" aria-hidden />
          {t('voiceHost.noSpeech')}
        </p>
      )}

      {/* 弹性块：下限跟 vmin 走，句子长短都不把控制条挤出屏幕 */}
      <div
        className={`flex min-h-[min(16rem,38vmin)] flex-1 flex-col items-center justify-center gap-3 rounded-2xl border p-4 text-center short:min-h-[min(9rem,28vmin)] short:p-2 ${
          paused
            ? 'border-amber-500/60 bg-amber-500/15'
            : done
              ? 'border-emerald-500/60 bg-emerald-500/15'
              : 'border-line bg-surface-2'
        }`}
      >
        {/* 状态行。颜色之外必须有文字，多态控件不许只靠颜色区分 */}
        <span className="flex items-center gap-2 text-sm text-text-muted">
          {paused ? (
            <IconPause className="size-4 shrink-0" aria-hidden />
          ) : (
            <Icon className="size-4 shrink-0" aria-hidden />
          )}
          {paused
            ? t('voiceHost.paused')
            : done
              ? t('voiceHost.done')
              : t(KIND_LABEL[step.kind])}
        </span>

        {done ? (
          <button
            type="button"
            onClick={() => {
              restart()
              buzz(20)
            }}
            className="btn-base min-h-16 gap-2 bg-emerald-400 px-6 text-xl font-bold text-ink short:!min-h-12 short:text-base"
          >
            <IconPlay className="size-6 short:size-5" aria-hidden />
            {t('voiceHost.again')}
          </button>
        ) : step.kind === 'wait' ? (
          <span className="font-mono text-data font-bold tabular-nums text-text">
            {formatMS(left)}
          </span>
        ) : step.kind === 'reveal' ? (
          <>
            <p className="text-lg font-bold text-balance text-text-muted">{stepText(step, t)}</p>
            {/* 密件大字：全桌只有该看的人睁着眼，必须 50–70cm 斜视下可读 */}
            <span className="text-data font-bold break-all text-text">{reveal}</span>
          </>
        ) : (
          <p className="text-data-sm font-bold text-balance text-text">{stepText(step, t)}</p>
        )}

        {/* 「等你确认」的主操作放在显示区里而不是控制条：它是此刻唯一该按的东西 */}
        {!done && (step.kind === 'confirm' || step.kind === 'reveal') && (
          <button
            type="button"
            onClick={() => {
              next()
              buzz(20)
            }}
            className="btn-base min-h-16 gap-2 bg-sky-400 px-6 text-xl font-bold text-ink short:!min-h-12 short:text-base"
          >
            <IconCheck className="size-6 short:size-5" aria-hidden />
            {t(step.kind === 'reveal' ? 'voiceHost.memorized' : 'voiceHost.spoken')}
          </button>
        )}
      </div>

      {/* 刚性块 */}
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          // 「等你确认」本身就是在等人，再给一个暂停只会让人以为流程卡住了
          disabled={done || step.kind === 'confirm' || step.kind === 'reveal'}
          onClick={() => {
            if (paused) resume()
            else pause()
            buzz()
          }}
          className="btn-quiet flex-1 gap-2 text-base short:!min-h-11 short:text-sm"
        >
          {paused ? (
            <IconPlay className="size-5 short:size-4" aria-hidden />
          ) : (
            <IconPause className="size-5 short:size-4" aria-hidden />
          )}
          {t(paused ? 'voiceHost.resume' : 'voiceHost.pause')}
        </button>

        <button
          type="button"
          disabled={done}
          onClick={() => {
            next()
            buzz()
          }}
          className="btn-quiet flex-1 gap-2 text-base short:!min-h-11 short:text-sm"
        >
          <IconSkip className="size-5 short:size-4" aria-hidden />
          {t('voiceHost.skip')}
        </button>

        <ConfirmButton onConfirm={stop} confirmText={t('voiceHost.stopConfirm')} className="flex-1">
          <IconClose className="size-5 short:size-4" aria-hidden />
          {t('voiceHost.stop')}
        </ConfirmButton>
      </div>
    </Overlay>
  )
}
