import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { type QuickAccent, quickTools } from './registry'
import { useQuickUI } from './store'

/**
 * 显式映射而非拼接类名：Tailwind 编译期只扫静态字符串。
 * 色块承担辨识度（斜视 45° 下大面积色域比单色线条轮廓先被认出），
 * 但下面的名称文字始终同时在场 —— 颜色是第二编码，不是唯一编码。
 */
const ACCENT: Record<QuickAccent, string> = {
  amber: 'bg-amber-500/15 text-amber-300',
  sky: 'bg-sky-500/15 text-sky-300',
  violet: 'bg-violet-500/15 text-violet-300',
  teal: 'bg-teal-500/15 text-teal-300',
  neutral: 'bg-surface-3 text-text-muted',
}

type Props = {
  /** 工具页横屏的顶栏是左侧竖条，面板要贴它右侧展开；首页横竖屏都是通栏顶栏 */
  sidebar?: boolean
}

/**
 * 小工具的二级面板。非模态抽屉：竖屏挂在顶栏正下方，工具页横屏贴常驻侧栏右侧。
 *
 * 必须由 [QuickLayer](QuickLayer.tsx) 渲染而不是挂进 [QuickBar](QuickBar.tsx) ——
 * 顶栏带 translate + backdrop-blur，两者都会成为 fixed 的包含块，挂里面会跟着顶栏
 * 平移出屏。代价是位置只能按顶栏尺寸硬算：**下面的 top-14 / left-16 必须跟
 * [AppHeader](../AppHeader.tsx) 的 h-14 / wide:w-16 一起改**。
 */
export function QuickMenu({ sidebar }: Props) {
  const { t } = useTranslation()
  const openTool = useQuickUI((s) => s.openTool)
  const close = useQuickUI((s) => s.close)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [close])

  return (
    <>
      {/*
       * 透明兜底层：点面板外任意处收起。非模态所以不给背景色也不 blur。
       * 同 QuickDialog 的遮罩，必须是 onClick —— pointerdown 里关掉面板，
       * 抬手补发的 click 会按新坐标 hit-test 穿到底下的工具页控件上。
       * 代价是这一次点击只用于关闭、不穿透，正是想要的行为。
       */}
      <div className="fixed inset-0 z-30" onClick={close} />

      {/* safe-t / safe-x 的 padding 加在 top/left 之外，刘海才不会盖住面板 */}
      <div
        className={`safe-t safe-x fixed top-14 right-2 z-30 ${
          sidebar ? 'wide:top-0 wide:right-auto wide:left-16' : ''
        }`}
      >
        <div className="card mt-2 grid w-72 grid-cols-3 gap-2 !p-3 wide:ml-2 short:!p-2">
          {quickTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => openTool(tool.id)}
              className="btn-quiet min-h-20 flex-col gap-1 px-1 text-sm leading-tight short:!min-h-16"
            >
              <span
                className={`flex size-10 items-center justify-center rounded-xl short:size-9 ${
                  ACCENT[tool.accent]
                }`}
              >
                <tool.icon className="size-6 short:size-5" aria-hidden />
              </span>
              <span className="text-center">{t(tool.nameKey)}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
