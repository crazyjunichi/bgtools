import { useTranslation } from 'react-i18next'
import { quickTools } from './registry'
import { useQuickUI } from './store'

type Props = {
  /** 工具页要在点击后重置顶栏的自动收起计时 */
  onOpen?: () => void
}

/** 顶栏里的小工具入口。只 dispatch，浮层由 App 层的 QuickLayer 渲染 */
export function QuickBar({ onOpen }: Props) {
  const { t } = useTranslation()
  const openTool = useQuickUI((s) => s.openTool)

  return (
    <>
      {quickTools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          onClick={() => {
            openTool(tool.id)
            onOpen?.()
          }}
          aria-label={t(tool.nameKey)}
          className="flex size-12 shrink-0 items-center justify-center rounded-xl text-text active:scale-95"
        >
          <tool.icon className="size-6" aria-hidden />
        </button>
      ))}
    </>
  )
}
