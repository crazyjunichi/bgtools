import { useTranslation } from 'react-i18next'
import { Stepper } from '../components/Stepper'
import { buzz } from '../haptics'
import { IconCheck } from '../icons'
import { formatMS } from '../time'
import { valuesOf } from './compile'
import { useVoiceHostStore } from './store'
import type { HostFlow } from './types'

/**
 * 流程的可调参数区，放在宿主工具页的控制栏里。
 *
 * 内容纯刚性（开关一格一个触控目标、时长是 Stepper），所以宿主页要把它放进
 * ToolLayout 的 `panel`，别指望它能被压扁。
 */
export function HostParams({ flow }: { flow: HostFlow }) {
  const { t } = useTranslation()
  const saved = useVoiceHostStore((s) => s.values[flow.id])
  const setParam = useVoiceHostStore((s) => s.setParam)
  const values = valuesOf(flow, saved)

  const toggles = flow.params.filter((p) => p.kind === 'toggle')
  const secs = flow.params.filter((p) => p.kind === 'sec')

  return (
    <div className="flex flex-col gap-3">
      {toggles.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="section-label">{t('voiceHost.toggles')}</span>
          <div className="grid grid-cols-2 gap-2">
            {toggles.map((p) => {
              const on = values[p.id] === true
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setParam(flow.id, p.id, !on)
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
                  <span className="truncate">{t(p.labelKey)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {secs.map((p) => (
        <Stepper
          key={p.id}
          label={t(p.labelKey)}
          value={typeof values[p.id] === 'number' ? (values[p.id] as number) : p.def}
          onChange={(next) => setParam(flow.id, p.id, next)}
          min={p.min}
          max={p.max}
          step={p.step}
          format={(sec) => formatMS(sec * 1000)}
        />
      ))}
    </div>
  )
}
