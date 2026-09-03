/**
 * 落盘与系统分享。所有工具的导出都走这里 —— 文件名规则统一了，
 * 一晚导出的一堆文件才排得到一起。
 */

const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * 文件名带**本地**时刻：一晚导好几张，靠时间戳才分得清哪张是哪局
 * （用 ISO 的 UTC 串会和玩家记忆里的时间差几个小时）。
 *
 * `prefix` 是出处（工具 id 之类），`parts` 拼在时间戳后面区分同一局的多种导出 ——
 * 时间戳只精确到分钟，连切两种排版会撞名，浏览器那边会变成 `xxx (1).png`，
 * 事后认不出哪张是哪种。
 */
export function stampName(prefix: string, at: number, ext: string, ...parts: string[]): string {
  const d = new Date(at)
  const stamp = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`
  return `${prefix}-${[stamp, ...parts].join('-')}.${ext}`
}

function download(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  download(url, filename)
  /*
   * 立刻 revoke 会让部分浏览器的下载拿不到数据（click 是同步的，取数据不是）。
   * 一分钟后再收，够长也不会真的漏 —— 页面本来就活得比这久。
   */
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function saveText(text: string, filename: string, mime: string) {
  saveBlob(new Blob([text], { type: mime }), filename)
}

function toFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type })
}

/**
 * 这台设备能不能走系统分享面板。**要连 files 一起问** ——
 * 桌面 Chrome 有 `navigator.share` 却不接受文件，只问前者会渲染出一个必然失败的按钮。
 */
export function canShareBlob(blob: Blob, filename: string): boolean {
  return (
    typeof navigator.canShare === 'function' && navigator.canShare({ files: [toFile(blob, filename)] })
  )
}

/** 用户在系统面板上点取消会 reject（AbortError），那不是错误，静默即可 */
export async function shareBlob(blob: Blob, filename: string, title: string) {
  try {
    await navigator.share({ files: [toFile(blob, filename)], title })
  } catch (e) {
    if ((e as Error)?.name !== 'AbortError') console.warn('[share] share failed', e)
  }
}
