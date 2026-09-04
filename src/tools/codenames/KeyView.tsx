import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { htmlLangOf } from '../../shared/i18n'
import { BoardGrid } from './BoardGrid'
import type { Mark } from './game'
import { decodeKeyUrl } from './keyCode'

/** 队长在手机上手动记的进度：哪格已翻（带删除线）+ 点牌顺序角标 */
type Track = {
  revealed: boolean[]
  marks: (Mark | null)[]
}

/**
 * 队长扫码落地页。**挂在 `App` 之外**（与 `/` 平级，同 [Join](../pages/Join.tsx)）：
 * 扫码进来的人不是来用工具箱的，他一进来就该看到答案。
 * 布局与桌面端偷看层一致：一行提示 + 键卡网格填满剩余空间。
 *
 * 牌面全在 URL 里，无网络；进度与桌面端**无同步通道**，队长看着桌面
 * 点自己手机做镜像记录（点牌标记已翻），记录按 URL 存 localStorage，刷新/息屏不丢。
 */
export default function KeyView() {
  const { t, i18n } = useTranslation()
  const { search } = useLocation()
  const d = new URLSearchParams(search).get('d') ?? ''
  const board = decodeKeyUrl(d)
  const storeKey = `bgtools:codenames-key:${d}`

  const [track, setTrack] = useState<Track | null>(() => {
    if (!board) return null
    try {
      const raw = localStorage.getItem(storeKey)
      if (raw) {
        const v = JSON.parse(raw) as Track
        if (v.revealed?.length === board.key.length && v.marks?.length === board.key.length) {
          return v
        }
      }
    } catch {
      // 坏存档当没有，重新记
    }
    return { revealed: board.key.map(() => false), marks: board.key.map(() => null) }
  })

  useEffect(() => {
    if (!track) return
    try {
      localStorage.setItem(storeKey, JSON.stringify(track))
    } catch {
      // 隐私模式写不进就算了，本次开着仍能用
    }
  }, [track, storeKey])

  // App 里那个 effect 管不到这条路由，lang 得自己设
  useEffect(() => {
    document.documentElement.lang = htmlLangOf(i18n.language)
  }, [i18n.language])

  if (!board || !track) {
    return (
      <div className="safe-x safe-t safe-b flex h-full items-center justify-center p-4">
        <p className="text-base text-text-muted">{t('tools.codenames.keyInvalid')}</p>
      </div>
    )
  }

  const tap = (i: number) =>
    setTrack((prev) => {
      if (!prev || prev.revealed[i]) return prev
      const revealed = prev.revealed.slice()
      revealed[i] = true
      const marks = prev.marks.slice()
      // 角标数字是点牌顺序；颜色落这张牌自己的归属色（手机上不知道是谁点的）
      marks[i] = { by: board.key[i], turn: prev.revealed.filter(Boolean).length + 1 }
      return { revealed, marks }
    })

  return (
    <div className="safe-x safe-t safe-b flex h-full flex-col gap-3 p-4 short:gap-2 short:p-2">
      <p className="text-center text-lg text-text-muted short:text-base">
        {t('tools.codenames.keyOnly')} · {t('tools.codenames.keyHint')}
      </p>
      <BoardGrid
        words={board.words}
        keys={board.key}
        revealed={track.revealed}
        marks={track.marks}
        showKey
        fill={false}
        onTap={tap}
        tappable
      />
    </div>
  )
}
