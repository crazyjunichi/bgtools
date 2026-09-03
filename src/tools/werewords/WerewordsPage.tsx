import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBackOverride } from '../../shared/backOverride'
import { ToolLayout } from '../../shared/components/ToolLayout'
import { DealRoles } from '../../shared/deal-roles/DealRoles'
import { buzz } from '../../shared/haptics'
import { IconCheck, IconDeal, IconPlay } from '../../shared/icons'
import { compile, valuesOf } from '../../shared/voice-host/compile'
import { FlowPreview } from '../../shared/voice-host/FlowPreview'
import { HostParams } from '../../shared/voice-host/HostParams'
import { HostRunner } from '../../shared/voice-host/HostRunner'
import { useVoiceHostStore } from '../../shared/voice-host/store'
import { WEREWORDS_FLOW } from './flow'
import { WEREWORDS_ROLES } from './roles'
import { useWerewordsStore } from './store'
import { DIFFICULTIES, type Difficulty } from './words'
import type { I18nKey } from '../../shared/i18n/types'

// 显式映射而非拼接 key：拼接同时丢掉类型校验和全局搜索（项目 i18n 约定）
const DIFFICULTY_LABEL: Record<Difficulty, I18nKey> = {
  easy: 'tools.werewords.difficulty.easy',
  standard: 'tools.werewords.difficulty.standard',
}

/**
 * 狼人真言。首页纯两个入口：**发身份**（通用发牌）与**主持**（调参 + 语音主持）。
 * 魔法词不进页面 —— 按下「开始主持」的瞬间抽词，快照进流程，
 * 之后只在夜里三个 reveal 步的屏幕上出现。
 */
export default function WerewordsPage() {
  const { t } = useTranslation()
  const [view, setView] = useState<'home' | 'host'>('home')
  const [dealing, setDealing] = useState(false)
  const saved = useVoiceHostStore((s) => s.values[WEREWORDS_FLOW.id])
  const running = useVoiceHostStore((s) => s.flowId) === WEREWORDS_FLOW.id
  const start = useVoiceHostStore((s) => s.start)
  const difficulty = useWerewordsStore((s) => s.difficulty)
  const setDifficulty = useWerewordsStore((s) => s.setDifficulty)
  const drawWord = useWerewordsStore((s) => s.drawWord)

  // 不 memo：编译只是过一遍十四步，而 valuesOf 每次都是新对象，memo 的 deps 反而稳不下来
  const steps = compile(WEREWORDS_FLOW, valuesOf(WEREWORDS_FLOW, saved))

  // 主持视图期间接管顶栏返回：回工具入口而非首页。视图一切换 cleanup 就注销
  useEffect(() => {
    if (view !== 'host') return
    const { set, clear } = useBackOverride.getState()
    set(() => setView('home'))
    return clear
  }, [view])

  return (
    <>
      {view === 'home' ? (
        /* 两张大卡分满整屏：竖屏上下、横屏左右，哪张都够得着 */
        <div className="flex h-full flex-col gap-4 wide:flex-row">
          <button
            type="button"
            onClick={() => {
              setDealing(true)
              buzz(20)
            }}
            className="card flex flex-1 flex-col items-center justify-center gap-3"
          >
            <IconDeal className="size-10 text-sky-300 short:size-8" aria-hidden />
            <span className="text-2xl font-bold text-text short:text-xl">
              {t('dealRoles.open')}
            </span>
            <span className="text-sm text-text-muted">{t('tools.werewords.home.dealDesc')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setView('host')
              buzz(20)
            }}
            className="card flex flex-1 flex-col items-center justify-center gap-3"
          >
            <IconPlay className="size-10 text-sky-300 short:size-8" aria-hidden />
            <span className="text-2xl font-bold text-text short:text-xl">
              {t('tools.werewords.home.host')}
            </span>
            <span className="text-sm text-text-muted">{t('tools.werewords.home.hostDesc')}</span>
          </button>
        </div>
      ) : (
        <ToolLayout
          panel={
            <>
              {/* 难度只影响抽词的词池，不进流程参数 —— 它与 say/wait 的取值无关 */}
              <div className="flex shrink-0 flex-col gap-2">
                <span className="section-label">{t('tools.werewords.difficulty.label')}</span>
                <div className="grid grid-cols-2 gap-2">
                  {DIFFICULTIES.map((d) => {
                    const on = difficulty === d
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          setDifficulty(d)
                          buzz()
                        }}
                        // 选中态不只靠颜色：另有一枚 ✓（多态控件至少两种编码）
                        className={`btn-base gap-1.5 border px-3 text-base short:!min-h-11 short:text-sm ${
                          on
                            ? 'border-sky-500/60 bg-sky-500/15 text-sky-300'
                            : 'border-line bg-surface-2 text-text-muted'
                        }`}
                      >
                        {on && <IconCheck className="size-5 shrink-0 short:size-4" aria-hidden />}
                        <span className="truncate">{t(DIFFICULTY_LABEL[d])}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <HostParams flow={WEREWORDS_FLOW} />
            </>
          }
        >
          <div className="flex shrink-0 items-center justify-between gap-3">
            <span className="section-label">{t(WEREWORDS_FLOW.nameKey)}</span>
            <span className="text-sm text-text-dim">
              {t('voiceHost.stepsTotal', { n: steps.length })}
            </span>
          </div>

          <FlowPreview steps={steps} />

          {/* 这一下点击同时是解锁音频输出的用户手势：抽词 → 快照 → 开跑 */}
          <button
            type="button"
            onClick={() => {
              start(WEREWORDS_FLOW, drawWord())
              buzz(20)
            }}
            className="btn-base min-h-16 shrink-0 gap-2 bg-sky-400 text-xl font-bold text-ink short:!min-h-12 short:text-base"
          >
            <IconPlay className="size-6 short:size-5" aria-hidden />
            {t('voiceHost.start')}
          </button>
        </ToolLayout>
      )}

      {dealing && (
        <DealRoles set={WEREWORDS_ROLES} accent="sky" onClose={() => setDealing(false)} />
      )}
      {running && <HostRunner flow={WEREWORDS_FLOW} />}
    </>
  )
}
