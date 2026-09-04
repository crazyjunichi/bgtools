/**
 * 「JS 被冻结过」监听。tab 被系统冻结期间 WebRTC / WebSocket 的状态字不可信
 * （断开事件可能从没派发，对端看来就是活着的僵尸连接），所以恢复后唯一安全
 * 的假设是传输层已死，调用方应重建连接。
 *
 * 判据是「JS 被暂停过」而不是可见性：息屏/锁屏经常只冻结 JS 而不派发
 * visibilitychange，单靠事件会漏。所以主判据是计时器跳变（冻结期间 interval
 * 不跑，恢复后第一跳就能发现时间差），visibilitychange 只当即时快通道。
 */

/** 短于这个时长的中断（切出去看一眼就回来），连接大概率还活着 */
const STALE_AFTER_MS = 8000
const TICK_MS = 2000

export const watchResume = (cb: () => void): (() => void) => {
  let hiddenAt = 0
  let lastTick = Date.now()
  let fired = false

  const fire = () => {
    // 同一次冻结只报一次，可见性与跳变两个通道谁先到算谁
    if (fired) return
    fired = true
    cb()
  }

  const timer = window.setInterval(() => {
    const now = Date.now()
    const gap = now - lastTick
    lastTick = now
    if (gap > STALE_AFTER_MS) fire()
    else fired = false // 正常跳动才解锁，避免可见性通道与跳变通道对同一次冻结重复上报
  }, TICK_MS)

  const onVis = () => {
    if (document.hidden) {
      hiddenAt = Date.now()
      return
    }
    const stale = hiddenAt > 0 && Date.now() - hiddenAt > STALE_AFTER_MS
    hiddenAt = 0
    if (stale) fire()
  }
  document.addEventListener('visibilitychange', onVis)

  return () => {
    window.clearInterval(timer)
    document.removeEventListener('visibilitychange', onVis)
  }
}
