import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buzz } from '../../shared/haptics'
import { PLAYER_SOLID, colorLabelKey } from '../../shared/players/colors'
import { TouchRing, type RingKind } from './TouchRing'
import { groupColor } from './groups'
import { assign } from './pick'
import type { PickMode } from './store'

/** 按住到出结果。够所有人把手指压稳，又不至于等到手酸；触点增减会从头开始 */
const HOLD_MS = 1200

type Point = { id: number; x: number; y: number }
/** value = null 表示参与了但没被选中（选一个模式的落选者） */
type Mark = Point & { value: number | null }
type Result = { marks: Mark[]; groups: number }

type Props = {
  mode: PickMode
  groups: number
}

/**
 * 触摸场。状态机：
 *
 * ```
 * idle ──(≥2 指)──▶ arming ──(1200ms)──▶ locked ──(全部抬手)──▶ 快照
 *  ▲                  │ 触点增减 → 重头计时                        │
 *  └──────────────────┴──────────(下一次按下清快照)────────────────┘
 * ```
 *
 * 三条刻意的设计：
 * - **锁定后不再响应触点增减** —— 否则谁抬一下手结果就变，桌上会吵起来
 * - 锁定期间 `pointermove` 仍更新已入选触点的坐标（标记跟着手指走），抬手的点留在最后位置，
 *   于是"结果快照"不需要额外一份状态
 * - 触点与结果都另存一份 ref：事件处理里要同步读到最新值来决定重不重新计时，
 *   setState 的异步批处理拿不到（同一帧里多指按下会连着来好几个事件）
 */
export function TouchField({ mode, groups }: Props) {
  const { t } = useTranslation()
  const fieldRef = useRef<HTMLDivElement>(null)
  const rectRef = useRef<DOMRect | null>(null)
  const pointsRef = useRef<Point[]>([])
  const resultRef = useRef<Result | null>(null)
  const rafRef = useRef(0)
  /** dev 钉针用：负数避开真实 pointerId（永远 ≥0），于是 move/up 天然不会命中假点 */
  const pinIdRef = useRef(-1)

  const [points, setPoints] = useState<Point[]>([])
  const [result, setResult] = useState<Result | null>(null)
  const [progress, setProgress] = useState(0)
  const [live, setLive] = useState('')

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  useEffect(() => {
    const el = fieldRef.current
    if (!el) return
    // iPad Safari 的双指缩放不吃 touch-action，得把它自己的手势事件也按住
    const stop = (e: Event) => e.preventDefault()
    el.addEventListener('gesturestart', stop)
    return () => el.removeEventListener('gesturestart', stop)
  }, [])

  const commitPoints = (next: Point[]) => {
    pointsRef.current = next
    setPoints(next)
  }

  const commitResult = (next: Result | null) => {
    resultRef.current = next
    setResult(next)
  }

  const disarm = () => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    setProgress(0)
  }

  const lock = () => {
    const snapshot = pointsRef.current
    const values = assign(
      mode,
      snapshot.map((p) => p.id),
      groups,
    )
    const used = Math.min(groups, snapshot.length)
    commitResult({
      marks: snapshot.map((p) => ({ ...p, value: values.get(p.id) ?? null })),
      groups: used,
    })
    // key 写完整字面量而不是查表：i18next 的插值参数类型是按 key 推的，
    // 传一个宽联合进去就推不出 {{n}} / {{g}} 了
    const n = snapshot.length
    setLive(
      mode === 'one'
        ? t('tools.touchPick.a11y.one', { n })
        : mode === 'order'
          ? t('tools.touchPick.a11y.order', { n })
          : t('tools.touchPick.a11y.group', { n, g: used }),
    )
    buzz([18, 36, 18])
  }

  /** 单个 rAF 循环同时驱动进度弧和出结果时刻 —— 两个时钟必然会错开 */
  const arm = () => {
    cancelAnimationFrame(rafRef.current)
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / HOLD_MS)
      setProgress(p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      rafRef.current = 0
      setProgress(0)
      lock()
    }
    rafRef.current = requestAnimationFrame(tick)
    buzz(10)
  }

  const at = (e: React.PointerEvent): Point => {
    const rect = rectRef.current
    return {
      id: e.pointerId,
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
    }
  }

  /**
   * dev 专用：钉一个不随抬手消失的假触点，再 Alt+点击它就移除。
   * 鼠标只有一个指针，多点交互否则只能真机测。
   *
   * 与真手指的区别只有"不会被 move/up 动到"，其余（≥2 起倒计时、增减重置、assign）全走原路径；
   * 快照语义这里刻意从简 —— 改了点数就立刻重算，dev 下要的正是这个。
   */
  const pinToggle = (p: Point) => {
    const hit = pointsRef.current.find((q) => q.id < 0 && Math.hypot(q.x - p.x, q.y - p.y) < 72)
    commitPoints(
      hit
        ? pointsRef.current.filter((q) => q.id !== hit.id)
        : [...pointsRef.current, { ...p, id: pinIdRef.current-- }],
    )
    if (resultRef.current) {
      commitResult(null)
      setLive('')
    }
    if (pointsRef.current.length >= 2) arm()
    else disarm()
  }

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    rectRef.current = e.currentTarget.getBoundingClientRect()

    if (import.meta.env.DEV && e.altKey) {
      pinToggle(at(e))
      return
    }

    // 捕获在场地上而不是 e.target：环随手指移动、随结果卸载，捕获到环上抬手事件就丢了
    e.currentTarget.setPointerCapture(e.pointerId)

    const next = [...pointsRef.current, at(e)]
    commitPoints(next)

    const r = resultRef.current
    if (r) {
      /*
       * 快照只有在**新一轮真的凑够两指**时才清掉。两个都不能省：
       * - 上一轮的手指还在屏幕上（不 stale）→ 新按下的是旁观者，结果不动
       * - 都抬手了但只碰了一指 → 大概是误触，结果留着让桌上继续看
       */
      const stale = r.marks.every((m) => !next.some((p) => p.id === m.id))
      if (stale && next.length >= 2) {
        commitResult(null)
        setLive('')
        arm()
      }
      return
    }
    if (next.length >= 2) arm()
  }

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const tracked = pointsRef.current
    if (!tracked.some((p) => p.id === e.pointerId)) return
    const next = at(e)
    commitPoints(tracked.map((p) => (p.id === e.pointerId ? next : p)))

    const r = resultRef.current
    if (r?.marks.some((m) => m.id === e.pointerId)) {
      commitResult({
        ...r,
        marks: r.marks.map((m) => (m.id === e.pointerId ? { ...m, x: next.x, y: next.y } : m)),
      })
    }
  }

  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointsRef.current.some((p) => p.id === e.pointerId)) return
    commitPoints(pointsRef.current.filter((p) => p.id !== e.pointerId))
    if (resultRef.current) return
    if (pointsRef.current.length >= 2) arm()
    else disarm()
  }

  const ringOf = (
    m: Mark,
  ): { kind: RingKind; label?: string; sub?: string; crown?: boolean; colorClass?: string } => {
    if (mode === 'one') return m.value ? { kind: 'winner', crown: true } : { kind: 'loser' }
    if (mode === 'order') {
      return { kind: m.value === 1 ? 'winner' : 'rank', label: String(m.value ?? '') }
    }
    const color = groupColor(m.value ?? 1)
    const labelKey = colorLabelKey(color)
    return {
      kind: 'group',
      label: String(m.value ?? ''),
      sub: labelKey ? t(labelKey) : undefined,
      colorClass: PLAYER_SOLID[color],
    }
  }

  const arming = !result && points.length >= 2
  const resultHint = (r: Result) =>
    mode === 'one'
      ? t('tools.touchPick.hint.one')
      : mode === 'order'
        ? t('tools.touchPick.hint.order')
        : t('tools.touchPick.hint.group', { n: r.groups })

  const hint = result
    ? points.length === 0
      ? t('tools.touchPick.hint.again')
      : resultHint(result)
    : points.length === 1
      ? t('tools.touchPick.hint.more')
      : arming
        ? t('tools.touchPick.hint.arming')
        : null

  return (
    <div
      ref={fieldRef}
      // touch-none 是硬性的：全局 touch-action 只到 manipulation，双指会被浏览器接管成缩放
      className="relative min-h-0 flex-1 touch-none overflow-hidden rounded-2xl border border-line bg-surface wide:min-w-0"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {!result && points.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="text-6xl short:text-5xl" aria-hidden>
            👆
          </span>
          <span className="max-w-md text-lg text-text-muted short:text-base">
            {t('tools.touchPick.hint.idle')}
          </span>
        </div>
      )}

      {hint && (
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-base font-semibold text-text-muted short:bottom-2 short:text-sm">
          {hint}
        </p>
      )}

      {result
        ? result.marks.map((m) => <TouchRing key={m.id} x={m.x} y={m.y} {...ringOf(m)} />)
        : points.map((p) => (
            <TouchRing
              key={p.id}
              x={p.x}
              y={p.y}
              kind={arming ? 'pending' : 'waiting'}
              progress={progress}
            />
          ))}

      {/* 锁定之后才按下的手指：画出来但明确不参与本轮 */}
      {result &&
        points
          .filter((p) => !result.marks.some((m) => m.id === p.id))
          .map((p) => <TouchRing key={p.id} x={p.x} y={p.y} kind="bystander" />)}

      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </div>
  )
}
