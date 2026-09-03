import { lazy, type ComponentProps } from 'react'
import type { DiceCanvas as Impl } from './DiceCanvas'

/**
 * 3D 画布的懒加载入口，两个调用方（[DiceStage](../DiceStage.tsx) 与
 * [QuickDice](../../../quick/dice/QuickDice.tsx)）共用一份。
 *
 * three 是全项目唯一的大依赖，只服务这一个装饰用的画布 —— **不许进首屏包**。
 *
 * 加载失败**必须降级成空组件，不许把 promise 的 reject 交给 Suspense**：那会一路冒到
 * 路由的 errorElement，整页换成报错界面。而出数与锁定的真源是下面那排芯片，
 * 3D 缺了只是少了上面那块。刚部署过导致 chunk 失效的情形另有 [staleChunk](../../staleChunk.ts)
 * 在 `vite:preloadError` 那一刻先试一次重载，走到这里说明已经救不回来了。
 */
const load = () => import('./DiceCanvas')

export const DiceCanvas = lazy(() =>
  load().then(
    (m) => ({ default: m.DiceCanvas }),
    () => ({ default: (_props: ComponentProps<typeof Impl>) => null }),
  ),
)

/** 调用方挂载时调一次：按下「投掷」时 three 早已到位，浮层不会先空一下 */
export function prefetchDiceCanvas() {
  load().catch(() => {})
}
