import type { ReactNode } from 'react'
import { Qr } from './Qr'

type Props = {
  /** 完整本站 URL，见 [qrLink.ts](../qrLink.ts) 的约定 */
  value: string
  /** 码的无障碍名 */
  label: string
  hint?: string
  onClose: () => void
  /** 额外的操作区（如 dev 预览按钮），跟在提示文字后面 */
  children?: ReactNode
}

/**
 * 全屏出示一个码给别人扫：白底黑码放最大，点任意处关闭。
 * 适用「出示即走」的场景；需要常驻操作（复制/系统分享）的别用它，见 quick/share。
 *
 * 固定全屏 + 点关，所以遮罩用 onClick（自我消失的层不准 onPointerDown）；
 * fixed 相对视口定位，只要中间没有 transform 祖先，overflow 容器裁不到它。
 */
export function QrOverlay({ value, label, hint, onClose, children }: Props) {
  return (
    <div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-ink/60 p-6"
      onClick={onClose}
    >
      <Qr value={value} label={label} className="size-[72vmin]" />
      {hint && <p className="text-center text-base font-bold text-white">{hint}</p>}
      {children}
    </div>
  )
}
