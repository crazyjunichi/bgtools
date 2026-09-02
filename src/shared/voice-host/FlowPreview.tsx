import { useTranslation } from 'react-i18next'
import { KIND_ICON, KIND_LABEL, stepText } from './stepView'
import type { RunStep } from './types'

/**
 * 编译后的流程清单，给宿主页当主显示区。
 *
 * 它是**弹性块**：自己带 `overflow-y-auto`，步数多少都不把页面撑出滚动条。
 * 数据来自和实跑同一次 [compile](compile.ts)，所以这里数出来的步数就是真会跑的步数。
 */
export function FlowPreview({ steps }: { steps: RunStep[] }) {
  const { t } = useTranslation()

  return (
    <ol className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
      {steps.map((step, i) => {
        const Icon = KIND_ICON[step.kind]
        return (
          <li
            // 同一句话可能在流程里出现两次（各角色的「请闭眼」），下标才是稳定键
            key={i}
            className="flex shrink-0 items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2"
          >
            <span className="w-6 shrink-0 text-right font-mono text-sm tabular-nums text-text-dim">
              {i + 1}
            </span>
            <Icon className="size-5 shrink-0 text-text-dim" aria-label={t(KIND_LABEL[step.kind])} />
            <span
              className={`min-w-0 flex-1 truncate text-sm ${
                step.kind === 'say' ? 'text-text' : 'text-text-muted'
              }`}
            >
              {stepText(step, t)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
