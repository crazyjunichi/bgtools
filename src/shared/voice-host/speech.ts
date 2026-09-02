import i18n, { htmlLangOf } from '../i18n'

/**
 * TTS 播报。用浏览器内置的 SpeechSynthesis —— 项目纯本地无后端，不引音频文件也不发请求。
 *
 * **语速 / 音量 / 音色刻意不设**，全走系统默认：桌上每台设备的默认音色差异很大，
 * 给了滑块也调不出一个通用值，而念错语言才是真问题（所以 `lang` 必须给）。
 */

/** 不支持是正常分支，不是崩点 —— 上层降级成大字显示，同 idb.ts 那条约定 */
export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * 一句话的最长停留。两处都要它：
 * - **超时兜底**：`onend` 在部分 WebKit 上存在不触发的情况，卡住就是整晚流程停摆
 * - **不支持 TTS 时**当作「够桌上的人把这行字读完」的停留时长
 *
 * 宁可估长：估短了会打断还在播的语音，估长了只是多停一会儿。
 */
export function estimateMs(text: string): number {
  return Math.min(30_000, Math.max(2_000, text.length * 400 + 2_000))
}

/**
 * 念一句，念完（或出错、或超时）才 resolve。
 *
 * 调用方必须自己防 stale resolve（见 [store](store.ts) 的 `gen`）：
 * `cancel()` 会让 `onerror` 立刻触发，这个 promise 照样会 resolve。
 */
export function speak(text: string): Promise<void> {
  if (!speechAvailable()) {
    return new Promise((resolve) => window.setTimeout(resolve, estimateMs(text)))
  }

  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      resolve()
    }

    const u = new SpeechSynthesisUtterance(text)
    // 不给 lang 的话中文会被系统默认的英文音色逐字母念
    u.lang = htmlLangOf(i18n.language)
    u.onend = finish
    u.onerror = finish

    const timeout = window.setTimeout(finish, estimateMs(text))

    // 先清队列：上一句没念完时 speak 只会排队，流程就跟画面对不上了
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  })
}

export function cancelSpeech(): void {
  if (speechAvailable()) window.speechSynthesis.cancel()
}
