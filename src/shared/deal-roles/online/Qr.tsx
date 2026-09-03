import qrcode from 'qrcode-generator'
import { useMemo } from 'react'

/** 静默区，按二维码规范留四个模块 —— 少了在深色底上会有扫码器识别不出边界 */
const QUIET = 4

type Props = {
  value: string
  label: string
  className?: string
}

/**
 * 二维码。自己把模块矩阵渲染成 SVG，不用库里那几个 `createXxxTag` ——
 * 矢量在平板上放多大都锐利，也没有 canvas 的 DPI 问题。
 *
 * **必须白底黑码**，哪怕整个应用是深色主题：反色二维码有相当一部分手机相机认不出来。
 *
 * 只喂 ASCII（[payload.ts](payload.ts) 拼出来的 URL 就是）—— 库默认的 Byte 模式
 * 不带 UTF-8 转换，中文得额外引入它的可选模块。
 */
export function Qr({ value, label, className }: Props) {
  const { d, span } = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(value)
    qr.make()
    const n = qr.getModuleCount()
    // 一个 path 装下所有模块：几百个 <rect> 在低端平板上光是布局就要几十毫秒
    let path = ''
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) path += `M${c} ${r}h1v1h-1z`
      }
    }
    return { d: path, span: n + QUIET * 2 }
  }, [value])

  return (
    <svg
      viewBox={`${-QUIET} ${-QUIET} ${span} ${span}`}
      className={className}
      // 模块边界压在半个像素上会被抗锯齿糊成灰边，识别率明显下降
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
    >
      <rect x={-QUIET} y={-QUIET} width={span} height={span} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  )
}
