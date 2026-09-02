/**
 * 时长显示。计时器与语音主持人共用，所以不留在任一工具里。
 *
 * 秒数一律补两位：不补的话读数会在 `1:9` / `1:10` 之间跳宽，桌上盯着看很扎眼
 * （配 `tabular-nums` 才完全不跳）。
 */
export function formatMS(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
