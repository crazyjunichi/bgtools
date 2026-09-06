import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBackOverride } from '../../shared/backOverride'
import { ToolLayout } from '../../shared/components/ToolLayout'
import { DealRoles } from '../../shared/deal-roles/DealRoles'
import { countsOf } from '../../shared/deal-roles/deck'
import { useDealRolesStore } from '../../shared/deal-roles/store'
import { buzz } from '../../shared/haptics'
import { IconDeal, IconPlay } from '../../shared/icons'
import { compile, valuesOf } from '../../shared/voice-host/compile'
import { FlowPreview } from '../../shared/voice-host/FlowPreview'
import { HostParams } from '../../shared/voice-host/HostParams'
import { HostRunner } from '../../shared/voice-host/HostRunner'
import { useVoiceHostStore } from '../../shared/voice-host/store'
import { WEREWOLF_FLOW } from './flow'
import { WEREWOLF_ROLES } from './roles'

/**
 * 狼人杀。首页纯两个入口：**发身份**（通用发牌）与**主持**（调参 + 语音主持）。
 * 真正的主持现场是 [HostRunner](../../shared/voice-host/HostRunner.tsx) 那个二级浮层，
 * 「开始主持」这一下点击同时是解锁音频输出的用户手势。
 */
export default function WerewolfPage() {
  const { t } = useTranslation()
  const [view, setView] = useState<'home' | 'host'>('home')
  const [dealing, setDealing] = useState(false)
  const saved = useVoiceHostStore((s) => s.values[WEREWOLF_FLOW.id])
  const running = useVoiceHostStore((s) => s.flowId) === WEREWOLF_FLOW.id
  const start = useVoiceHostStore((s) => s.start)

  // 不 memo：编译只是过一遍二十来步，而 valuesOf 每次都是新对象，memo 的 deps 反而稳不下来
  const steps = compile(WEREWOLF_FLOW, valuesOf(WEREWOLF_FLOW, saved))

  // 主持视图期间接管顶栏返回：回工具入口而非首页。视图一切换 cleanup 就注销
  useEffect(() => {
    if (view !== 'host') return
    const { set, clear } = useBackOverride.getState()
    set(() => setView('home'))
    return clear
  }, [view])

  // 牌堆就是按配比展开的，关浮层时配比即"发出去的身份"。开关与身份同名是联动的全部依据
  const syncFromDeal = () => {
    const counts = countsOf(WEREWOLF_ROLES, useDealRolesStore.getState().counts[WEREWOLF_ROLES.id])
    const { setParam } = useVoiceHostStore.getState()
    for (const p of WEREWOLF_FLOW.params) {
      if (p.kind === 'toggle' && p.id in counts) setParam(WEREWOLF_FLOW.id, p.id, counts[p.id] > 0)
    }
  }

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
            <IconDeal className="size-10 text-violet-300 short:size-8" aria-hidden />
            <span className="text-2xl font-bold text-text short:text-xl">
              {t('dealRoles.open')}
            </span>
            <span className="text-sm text-text-muted">{t('tools.werewolf.home.dealDesc')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setView('host')
              buzz(20)
            }}
            className="card flex flex-1 flex-col items-center justify-center gap-3"
          >
            <IconPlay className="size-10 text-violet-300 short:size-8" aria-hidden />
            <span className="text-2xl font-bold text-text short:text-xl">
              {t('tools.werewolf.home.host')}
            </span>
            <span className="text-sm text-text-muted">{t('tools.werewolf.home.hostDesc')}</span>
          </button>
        </div>
      ) : (
        <ToolLayout panel={<HostParams flow={WEREWOLF_FLOW} />}>
          <div className="flex shrink-0 items-center justify-between gap-3">
            <span className="section-label">{t(WEREWOLF_FLOW.nameKey)}</span>
            <span className="text-sm text-text-dim">
              {t('voiceHost.stepsTotal', { n: steps.length })}
            </span>
          </div>

          <FlowPreview steps={steps} />

          <button
            type="button"
            onClick={() => {
              start(WEREWOLF_FLOW)
              buzz(20)
            }}
            className="btn-base min-h-16 shrink-0 gap-2 bg-violet-400 text-xl font-bold text-ink eink-solid short:!min-h-12 short:text-base"
          >
            <IconPlay className="size-6 short:size-5" aria-hidden />
            {t('voiceHost.start')}
          </button>
        </ToolLayout>
      )}

      {dealing && (
        <DealRoles
          set={WEREWOLF_ROLES}
          accent="violet"
          onClose={() => {
            syncFromDeal()
            setDealing(false)
          }}
        />
      )}
      {running && <HostRunner flow={WEREWOLF_FLOW} />}
    </>
  )
}
