import { quickTools } from './registry'
import { useQuickUI } from './store'

type Props = {
  /** 工具页要在点击后重置顶栏的自动收起计时 */
  onOpen?: () => void
}

/** 顶栏里的小工具入口。只 dispatch，浮层由 App 层的 QuickLayer 渲染 */
export function QuickBar({ onOpen }: Props) {
  const openTool = useQuickUI((s) => s.openTool)

  return (
    <>
      {quickTools.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => {
            openTool(t.id)
            onOpen?.()
          }}
          aria-label={t.name}
          className="flex size-12 shrink-0 items-center justify-center rounded-xl text-xl active:scale-95"
        >
          {t.icon}
        </button>
      ))}
    </>
  )
}
