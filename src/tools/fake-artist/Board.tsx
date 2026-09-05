import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { buzz } from '../../shared/haptics'
import { usePaperTone } from '../../shared/hooks/usePaperTone'
import { useWakeLock } from '../../shared/hooks/useWakeLock'
import {
  colorLabelKey,
  playerHexOf,
  PLAYER_LINE,
} from '../../shared/players/colors'
import { resolveSeat } from '../../shared/players/seats'
import { usePlayersStore } from '../../shared/players/store'
import { paintStroke } from './paint'
import { isDoneOf, roundOf, turnIndexOf, useFakeArtistStore } from './store'

/**
 * 共画板：主题横幅（公开）+ 当前玩家横幅 + 画布。抬笔即提交这一笔、轮到下一位，
 * 误触靠面板里的「撤销上一笔」兜底。
 *
 * 笔画以归一化坐标存 store、只记 seatId（见 [store.ts](store.ts) 的 `Stroke`），
 * 颜色渲染期经 resolveSeat 现取现画 —— 这里只负责把 0..1 乘回当前像素，
 * 画布每次 resize / 切主题都全量重画。
 *
 * 纸面随主题（bg-surface）：「墨」笔画按纸面明暗取反（深纸亮、浅纸深），
 * 固定近黑纸 + 亮描边的旧方案会在增量绘制时露接缝成点状，已废弃。
 */
export function Board() {
  const { t } = useTranslation()
  const players = usePlayersStore((s) => s.players)
  const seats = useFakeArtistStore((s) => s.seats)
  const rounds = useFakeArtistStore((s) => s.rounds)
  const prompt = useFakeArtistStore((s) => s.prompt)
  const strokes = useFakeArtistStore((s) => s.strokes)
  const earlyDone = useFakeArtistStore((s) => s.earlyDone)
  const phase = useFakeArtistStore((s) => s.phase)
  const revealed = useFakeArtistStore((s) => s.revealed)
  const commitStroke = useFakeArtistStore((s) => s.commitStroke)

  // 画一局要几十分钟，中途息屏会把没画完的画作黑掉
  useWakeLock()

  // canvas 拿不到主题类名：纸面与「墨」都靠 data-theme 现读现翻
  const tone = usePaperTone()

  // 名单是真源：改名/换色立刻反映到横幅与已落笔画；被删的人退回席位快照
  const views = useMemo(() => seats.map((s) => resolveSeat(s, players)), [seats, players])
  const viewOf = useMemo(() => new Map(views.map((v) => [v.id, v])), [views])
  /** 席位 → 当笔 hex。席位必然存在（清席/换人都连带清画），缺了说明数据破损，退回灰 */
  const hexOf = useCallback(
    (seatId: string) => playerHexOf(viewOf.get(seatId)?.color ?? 'gray', tone).bg,
    [viewOf, tone],
  )

  const done = isDoneOf({ phase, earlyDone, strokes, seats, rounds })
  const current = done ? undefined : views[turnIndexOf(strokes.length, views.length)]
  const round = roundOf(strokes.length, views.length)

  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  /** 进行中的那一笔：抬笔前只是屏幕上的墨迹，不落 store */
  const liveRef = useRef<{ seat: string; pts: [number, number][] } | null>(null)
  const livePointer = useRef<number | null>(null)

  // strokes / 名单 / 主题 / 容器尺寸变化都全量重画。进行中的笔画也画在这层（liveRef）
  useEffect(() => {
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
      for (const s of strokes) paintStroke(ctx, s.pts, w, h, hexOf(s.seat))
      if (liveRef.current) paintStroke(ctx, liveRef.current.pts, w, h, hexOf(liveRef.current.seat))
    }
    redraw()
    const ro = new ResizeObserver(redraw)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [strokes, hexOf])

  const norm = (e: React.PointerEvent): [number, number] => {
    const r = canvasRef.current!.getBoundingClientRect()
    return [
      Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    ]
  }

  /** 增量画最后一段：每个 pointermove 全量重扫几十笔的代价不值当 */
  const paintLiveTail = (pts: [number, number][], seatId: string) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const tail = pts.length === 1 ? pts : pts.slice(-2)
    paintStroke(ctx, tail, canvas.width, canvas.height, hexOf(seatId))
  }

  const onDown = (e: React.PointerEvent) => {
    if (!current || livePointer.current !== null || !e.isPrimary) return
    e.currentTarget.setPointerCapture(e.pointerId)
    livePointer.current = e.pointerId
    liveRef.current = { seat: current.id, pts: [norm(e)] }
    paintLiveTail(liveRef.current.pts, current.id)
  }

  const onMove = (e: React.PointerEvent) => {
    const live = liveRef.current
    if (!live || e.pointerId !== livePointer.current) return
    live.pts.push(norm(e))
    paintLiveTail(live.pts, live.seat)
  }

  const onUp = (e: React.PointerEvent) => {
    const live = liveRef.current
    if (!live || e.pointerId !== livePointer.current) return
    livePointer.current = null
    liveRef.current = null
    // 纵横比在落笔这一刻采：回放与导出图要靠它还原比例
    const r = e.currentTarget.getBoundingClientRect()
    commitStroke(live.seat, live.pts, r.width / r.height)
    buzz(20)
  }

  const frame = current ? hexOf(current.id) : undefined

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {/* 主题对所有人公开（冒牌货靠它混），轮次只报进度不报名额 */}
      <div className="flex shrink-0 items-center gap-3">
        <span className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-base font-semibold text-text">
          {prompt && t('tools.fakeArtist.board.category', { category: prompt.category })}
        </span>
        {!done && (
          <span className="ml-auto font-mono text-sm tabular-nums text-text-muted">
            {t('tools.fakeArtist.board.round', { n: round, total: rounds })}
          </span>
        )}
      </div>

      {done ? (
        <div className="flex shrink-0 items-center justify-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-2.5">
          <span className="text-lg font-bold text-text">
            {revealed && prompt
              ? t('tools.fakeArtist.board.answer', { word: prompt.word })
              : t('tools.fakeArtist.board.done')}
          </span>
        </div>
      ) : (
        current && (
          // 底线 + 色名双编码：颜色不许是唯一识别手段；外框描边同色（inline 因为画布侧拿不到类名表）
          <div
            className={`flex shrink-0 items-center gap-3 rounded-xl rounded-b-none border-b-4 bg-surface-2 px-4 py-2 ${PLAYER_LINE[current.color]}`}
          >
            <span className="text-sm text-text-muted">{t('tools.fakeArtist.board.turn')}</span>
            <span className="text-xl font-bold text-text short:text-lg">{current.name}</span>
            <span className="text-sm text-text-muted">{t(colorLabelKey(current.color)!)}</span>
          </div>
        )
      )}

      <div
        ref={wrapRef}
        className={`relative min-h-0 flex-1 overflow-hidden rounded-2xl border-2 bg-surface ${
          frame ? '' : 'border-line'
        }`}
        style={frame ? { borderColor: frame } : undefined}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full touch-none select-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
      </div>
    </div>
  )
}
