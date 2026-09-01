import { useWakeLock } from '../../shared/hooks/useWakeLock'
import { PickBar } from './PickBar'
import { TouchField } from './TouchField'
import { useTouchPickStore } from './store'

/**
 * 手指抽选。**故意不套 [ToolLayout]**：触摸场要吃满能吃的每一寸（手指得摆得开），
 * 而全局操作只有三个模式 + 一个组数，装不满 17rem 的控制栏 —— 压成 80px 窄条，
 * 横屏在右、竖屏贴底，与多轮计分同一套做法。
 *
 * `key={mode}` 让切模式时重挂载触摸场：上一种模式的结果快照对新模式没有意义，
 * 靠重挂载清掉，省得在 TouchField 里再同步一次 state。
 */
export default function TouchPickPage() {
  // 桌上摊着等所有人伸手，不能息屏
  useWakeLock()
  const { mode, groups, setMode, cycleGroups } = useTouchPickStore()

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 wide:flex-row short:gap-2">
      <TouchField key={mode} mode={mode} groups={groups} />
      <PickBar mode={mode} groups={groups} onMode={setMode} onCycleGroups={cycleGroups} />
    </div>
  )
}
