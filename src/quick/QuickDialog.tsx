import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { IconClose, type LucideIcon } from '../shared/icons'

type Props = {
  title: string
  icon: LucideIcon
  onClose: () => void
  /** 双栏横向布局用宽面板；纵向堆叠的保持窄，免得控件被拉散 */
  wide?: boolean
  children: React.ReactNode
}

/**
 * 通用小工具的模态外壳。z-30 压住顶栏（z-20）；用 fixed 全屏遮罩而非气泡，
 * 免得被工具页 ToolLayout 的 overflow-hidden 裁掉。
 */
export function QuickDialog({ title, icon: Icon, onClose, wide, children }: Props) {
  const { t } = useTranslation()

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
      className="fixed inset-0 z-30 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm short:p-2"
      /*
       * 这里必须是 onClick（同 CLAUDE.md 里那条「会让自己消失的元素」）。用 onPointerDown 的话，
       * 按下就卸载了整个浮层，抬手补发的 click 按新坐标 hit-test 直接穿透到
       * 底下的工具页 —— 关个计时器顺手把骰子页的「投掷」点了，白投一次。
       * 代价是面板内按下、拖到遮罩上抬手会误关（click 派发到共同祖先），
       * 但那个动作罕见，且关掉不丢状态，比穿透误触划算得多。
       */
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* overflow-y-auto 只是兜底：真正保证一屏放完的是 short: 紧凑档 + 内容区的可收缩契约。
          不用 overflow-hidden —— 万一还是超了，宁可能滚，也不能把按钮裁掉点不着 */}
      <div
        className={`card flex max-h-full w-full flex-col gap-4 overflow-y-auto short:gap-2 short:!p-3 ${
          wide ? 'max-w-2xl' : 'max-w-md'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between">
          <span className="flex items-center gap-2 text-lg font-semibold short:text-base">
            <Icon className="size-5 short:size-4" aria-hidden />
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="btn-quiet !min-h-12 w-12 short:!min-h-10 short:w-10"
          >
            <IconClose className="size-5 short:size-4" aria-hidden />
          </button>
        </div>
        {/* min-h-0 是内容区能被压缩的前提：flex 子项默认 min-height:auto，
            不清零的话面板撞上 max-h-full 时只会溢出，不会让内容跟着缩 */}
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
