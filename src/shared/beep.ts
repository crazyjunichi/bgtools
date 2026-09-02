/**
 * 提示音。现场用 WebAudio 合成三声短音，不引音频文件（几 KB 的资源不值得）。
 * 计时器到时与语音主持人流程里的提示音步骤共用，所以不留在任一工具里。
 *
 * 两处都由用户点击启动整件事，所以不会撞上 autoplay 限制；
 * 浏览器不支持或 context 创建失败就静默跳过 —— 还有震动和屏上的提示兜底。
 */
export function beep() {
  try {
    const ctx = new AudioContext()
    const gain = ctx.createGain()
    gain.connect(ctx.destination)

    const t0 = ctx.currentTime
    const BEATS = [0, 0.28, 0.56]
    const DUR = 0.16

    for (const offset of BEATS) {
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.value = 880
      const g = ctx.createGain()
      // 直接开关会有爆音，做个短促的包络
      g.gain.setValueAtTime(0, t0 + offset)
      g.gain.linearRampToValueAtTime(0.25, t0 + offset + 0.01)
      g.gain.linearRampToValueAtTime(0, t0 + offset + DUR)
      osc.connect(g)
      g.connect(gain)
      osc.start(t0 + offset)
      osc.stop(t0 + offset + DUR)
    }

    // 播完释放，别把 context 一直挂着
    window.setTimeout(() => void ctx.close(), 1500)
  } catch {
    // 无音频输出设备、iOS 静音开关等情况，忽略
  }
}
