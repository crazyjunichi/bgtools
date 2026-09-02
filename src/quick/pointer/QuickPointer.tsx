import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buzz } from '../../shared/haptics'
import { SPIN_MS, useQuickPointerStore } from './store'

const TICKS = Array.from({ length: 12 }, (_, i) => i * 30)

/**
 * 末端斜率 =(1-y2)/(1-x2)，即停住那一刻的残速：越大越"咔"一下卡停，趋 0 则像被吸住。
 * 这里 (1-0.72)/(1-0.42)≈0.48，还有近半转速就硬截断。
 * 关键是 x2 不能太靠前 —— x2 小意味着大半时间都耗在末尾的慢速爬行上，尾巴就发绵。
 * 首个控制点 (0.08, 0.3) 让起转几乎没有加速过程：点下去就已经是高速。
 */
const SPIN_EASING = 'cubic-bezier(0.08, 0.3, 0.42, 0.72)'

/**
 * 顶栏快捷指针。点一下顺时针转若干圈后随机停向一个方向，用来指人/指方位。
 * 身份色用 violet：amber 已被快速骰子占、sky 归计时器，且不与语义色冲突。
 */
export function QuickPointer() {
  const { t } = useTranslation()
  const { angle, spin } = useQuickPointerStore()
  const [spinning, setSpinning] = useState(false)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const handleSpin = () => {
    if (spinning) return
    spin()
    setSpinning(true)
    // 用定时器而非 transitionend：dialog 中途被关掉时 transitionend 不会来
    timer.current = window.setTimeout(() => {
      setSpinning(false)
      buzz([18, 36, 18])
    }, SPIN_MS)
  }

  const spun = angle > 0
  const landed = spun && !spinning
  const direction = angle % 360
  const hour = Math.round(direction / 30) % 12 || 12

  return (
    // 朝向只决定排列轴：横屏并排、竖屏堆叠，两种朝向都一屏放完
    <div className="flex flex-col gap-4 short:gap-2 wide:flex-row">
      {/* 刚性块。竖屏排在下贴拇指，宽度只在横屏约束 */}
      <div className="order-2 flex shrink-0 flex-col gap-3 short:gap-2 wide:order-1 wide:w-56">
        <div
          className={`flex flex-col items-center gap-1 rounded-2xl border p-4 short:p-2 ${
            landed ? 'border-violet-500/60 bg-violet-500/15' : 'border-line bg-surface-2'
          }`}
        >
          {/* 转动中不能提前显示终值，否则结果被剧透 */}
          {landed ? (
            <span className="font-mono text-data-sm font-bold tabular-nums text-violet-300">
              {direction}°
            </span>
          ) : (
            <span className="font-mono text-data-sm font-bold tabular-nums text-text-dim">--</span>
          )}
          <span className="text-center text-sm text-text-muted">
            {spinning
              ? t('quick.pointer.spinning')
              : landed
                ? t('quick.pointer.oclock', { hour })
                : t('quick.pointer.hint')}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSpin}
          disabled={spinning}
          className="btn-base mt-auto min-h-16 w-full bg-violet-400 text-xl font-bold text-ink short:min-h-12 short:text-base"
        >
          {t(spinning ? 'quick.pointer.spinning' : 'quick.pointer.spin')}
        </button>
      </div>

      {/* 弹性块：表盘自带尺寸，这里不设下限，只负责居中 */}
      <div className="order-1 flex min-h-0 min-w-0 flex-1 items-center justify-center rounded-2xl border border-line bg-surface-2 p-4 short:p-2 wide:order-2">
        {/* 表盘整体就是按钮：桌上最直觉的动作是直接戳指针 */}
        <button
          type="button"
          onClick={handleSpin}
          disabled={spinning}
          aria-label={t('quick.pointer.spin')}
          // 表盘宽高同时受限，所以只能用 vmin：换 vh 竖屏会取长边，顶着 shrink-0 硬溢出
          className="relative size-[min(18rem,42vmin)] shrink-0 rounded-full transition-transform duration-75 active:scale-[0.97]"
        >
          {/* 落定后整圈发光，是"停下来了"最外围的一层反馈 */}
          <div
            className={`absolute inset-0 rounded-full border-2 bg-surface-3 ${
              landed
                ? 'border-violet-400 shadow-[0_0_30px_-2px] shadow-violet-500/60'
                : 'border-line'
            }`}
          />

          {/* 所有 rotate 层统一裁在圆内：方形层旋转后的包围盒最多比表盘大 41%，
              而它会算进 dialog(overflow-y-auto) 的可滚区域，凭落点角度随机冒出滚动条。
              裁掉的只是圆外的透明角，视觉上没东西被切；发光描边在这一层之外，不受影响 */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            {TICKS.map((deg) => (
              <div
                key={deg}
                className="absolute inset-0"
                style={{ transform: `rotate(${deg}deg)` }}
              >
                {/* 顶端那根加高加亮，作为角度读数的 0° 基准 */}
                <div
                  className={
                    deg === 0
                      ? 'absolute top-2 left-1/2 h-5 w-1.5 -translate-x-1/2 rounded-full bg-violet-300'
                      : 'absolute top-2 left-1/2 h-3.5 w-1 -translate-x-1/2 rounded-full bg-line'
                  }
                />
              </div>
            ))}

            <div
              className="absolute inset-0"
              style={{
                transform: `rotate(${angle}deg)`,
                // 长时 transform 过渡是本工具的核心表现，属于 duration-75 规则的有意例外
                transition: spinning ? `transform ${SPIN_MS}ms ${SPIN_EASING}` : 'none',
              }}
            >
              {/* 单向针：根部收在中心轴下面，只有一头指向结果，免得桌上两边的人各读一头 */}
              <svg viewBox="0 0 100 100" className="size-full drop-shadow-lg">
                <polygon points="50,7 58,46 50,58 42,46" className="fill-violet-400" />
              </svg>
            </div>
          </div>

          {/* 中心轴，盖住头尾两段的接缝 */}
          <div className="absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-line bg-surface-2" />
        </button>
      </div>
    </div>
  )
}
