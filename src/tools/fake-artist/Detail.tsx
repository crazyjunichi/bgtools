import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { usePaperTone } from '../../shared/hooks/usePaperTone'
import { MatchChips } from '../../shared/match/MatchChips'
import type { MatchDraft } from '../../shared/match/types'
import { aspectOf, paintAll, payloadOf } from './match'

/**
 * 历史详情：答案行 + 画作回放 + 颜色图例。
 * 名单 chips 在这里重画一遍 —— MatchDetail 见得有细则就不出它的 chips 了。
 *
 * 与 [Board](Board.tsx) 同一套全量重画：容器尺寸、主题翻转都触发。
 */
export function FakeArtistDetail({ match }: { match: MatchDraft }) {
  const { t } = useTranslation()
  const tone = usePaperTone()
  const payload = useMemo(() => {
    try {
      return payloadOf(match)
    } catch {
      return null
    }
  }, [match])

  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!payload) return
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const redraw = () => {
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(wrap.clientWidth * dpr)
      const h = Math.round(wrap.clientHeight * dpr)
      if (w === 0 || h === 0) return
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, w, h)
      paintAll(ctx, payload, match, w, h, tone)
    }
    redraw()
    const ro = new ResizeObserver(redraw)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [payload, match, tone])

  if (!payload) {
    return (
      <span className="text-sm leading-relaxed text-amber-300">{t('match.detail.unreadable')}</span>
    )
  }

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <span className="shrink-0 text-base font-semibold text-text">
        {t('tools.fakeArtist.board.category', { category: payload.category })}
        {' · '}
        {t('tools.fakeArtist.board.answer', { word: payload.word })}
      </span>
      <div
        ref={wrapRef}
        className="w-full shrink-0 overflow-hidden rounded-xl border border-line bg-surface"
        style={{ aspectRatio: String(aspectOf(payload)) }}
      >
        <canvas ref={canvasRef} className="size-full" />
      </div>
      <MatchChips players={match.players} />
    </div>
  )
}
