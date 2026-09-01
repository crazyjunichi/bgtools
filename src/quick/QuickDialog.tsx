import { useEffect } from 'react'

type Props = {
  title: string
  icon: string
  onClose: () => void
  /** 双栏横向布局用宽面板；纵向堆叠的保持窄，免得控件被拉散 */
  wide?: boolean
  children: React.ReactNode
}

/**
 * 通用小工具的模态外壳。z-30 压住顶栏（z-20）；用 fixed 全屏遮罩而非气泡，
 * 免得被工具页 ToolLayout 的 overflow-hidden 裁掉。
 */
export function QuickDialog({ title, icon, onClose, wide, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    // 点遮罩关闭；面板自身的点击不冒泡到遮罩
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`card flex max-h-full w-full flex-col gap-4 overflow-y-auto ${
          wide ? 'max-w-2xl' : 'max-w-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">
            {icon} {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="btn-quiet !min-h-12 w-12 text-xl"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
