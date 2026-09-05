import { useEffect, useState } from 'react'
import { paperTone, type PaperTone } from '../players/colors'

/**
 * 页面当前主题的纸面明暗，`<html data-theme>` 一变就翻。
 * canvas / inline style 拿不到 Tailwind 主题类名，只能读 DOM。
 * 放在 hooks 而不是 colors.ts：那个文件是纯数据表，不引 React。
 */
export function usePaperTone(): PaperTone {
  const [tone, setTone] = useState<PaperTone>(paperTone)
  useEffect(() => {
    const mo = new MutationObserver(() => setTone(paperTone()))
    mo.observe(document.documentElement, { attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [])
  return tone
}
