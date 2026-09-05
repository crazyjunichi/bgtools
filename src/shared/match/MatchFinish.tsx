import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FIELD } from '../components/fieldStyle'
import { Overlay } from '../components/Overlay'
import { IconCheck, IconCrown, IconRepeat, IconShare } from '../icons'
import { PLAYER_LINE } from '../players/colors'
import { useArchiveStore } from './archive'
import type { MatchExport } from './detail'
import { durationText, fmtScore } from './format'
import { NOTE_MAX } from './MatchNote'
import { MatchShare } from './MatchShare'
import type { MatchDraft } from './types'

/**
 * 时长滑杆的档位（分钟）。密段压在常见桌游时长上，长尾到 5 小时；
 * 档位是索引不是连续值 —— 拖起来一格一跳，不会停在 77 这种零头上
 */
const DURATION_STEPS_MIN = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 90, 105, 120, 150, 180, 240, 300]

/** 测得的时长吸附到最近的档位，作为滑杆的初始位置 */
function nearestStepIdx(ms: number): number {
  const min = ms / 60_000
  let best = 0
  for (let i = 1; i < DURATION_STEPS_MIN.length; i++) {
    if (Math.abs(DURATION_STEPS_MIN[i] - min) < Math.abs(DURATION_STEPS_MIN[best] - min)) best = i
  }
  return best
}

type Props = {
  /**
   * 工具算好的这一局。**在打开面板那一刻取一次快照**（尤其是 `endAt`，
   * 它是最后一次实质操作的时刻而不是现在）。分数与名次由工具算（只有它知道怎么算），
   * 面板不做任何规则判断 —— 打开即归档，它本身就是「记好了」的完成态
   */
  draft: MatchDraft
  /**
   * 计分纸这类**玩完才摊开记**的工具测不到真实游戏时长（量到的只是记账耗时），
   * 传它来给玩家一个报真实时长的滑杆；边玩边记的工具不传，测得的时长就是真的
   */
  editableDuration?: boolean
  /**
   * 这个工具自己的明细导出，给分享按钮用。
   * **由工具页传进来**：shared 不许去查 tools 的注册表，而工具页知道自己的
   */
  exports?: readonly MatchExport[]
  /** 归档成功后回传记录 id：工具 store 记下它，同一局再结算才覆盖得中 */
  onArchived: (id: string) => void
  /** 开新局（记录已落盘） */
  onDone: () => void
  onClose: () => void
}

/**
 * 一局结束时的结算面板 —— **所有工具共用这一个出口**，历史与统计才只依赖一种记录形态。
 *
 * 它不持有「当前局」：谁参与了这一局只属于打开它的那个工具页，
 * 面板只是把那份状态收成一条 [Match](types.ts) 写进存档（见 [archive](archive.ts)）。
 * 没有「要不要记」这一步：点「本局结算」就是记，弹出的直接是完成态。
 */
export function MatchFinish({ draft, editableDuration = false, exports, onArchived, onDone, onClose }: Props) {
  const { t } = useTranslation()
  const status = useArchiveStore((s) => s.status)
  const load = useArchiveStore((s) => s.load)
  const archive = useArchiveStore((s) => s.archive)

  /** 落盘成功的记录 id；null = 还没写完，或这台设备记不下来 */
  const [savedId, setSavedId] = useState<string | null>(null)
  const [note, setNote] = useState(draft.note ?? '')
  /** 滑杆档位索引；null = 没动过，沿用测得的时长 */
  const [stepIdx, setStepIdx] = useState<number | null>(null)
  const [sharing, setSharing] = useState(false)
  // StrictMode 与重渲染都不能让归档跑第二遍，否则同一局记两条
  const once = useRef(false)

  useEffect(() => {
    if (once.current) return
    once.current = true
    void (async () => {
      await load()
      const id = await archive(draft)
      if (id !== null) {
        setSavedId(id)
        onArchived(id)
      }
    })()
  }, [archive, draft, load, onArchived])

  // IDB 打不开不算崩点：分享照用，只是明确说这局记不下来
  const unavailable = savedId === null && status === 'unavailable'

  const measuredMs = Math.max(0, draft.endAt - draft.startedAt)
  /** 面板里到处显示的那份时长：没动滑杆就是测得值，动了就是选的那档 */
  const shownMs = stepIdx === null ? measuredMs : DURATION_STEPS_MIN[stepIdx] * 60_000

  /*
   * 备注与时长是这局面板里唯二能改的东西，共用一条防抖覆盖写回：
   * 打字和拖滑杆都会连着出一串值，停下来才落盘。改时长是以 endAt 为锚倒推
   * startedAt 写回 —— Match 没有单独的时长字段，startedAt/endAt 的差就是它
   */
  useEffect(() => {
    if (savedId === null) return
    if (stepIdx === null && note.trim() === (draft.note ?? '')) return
    const timer = setTimeout(() => {
      void archive({
        ...draft,
        id: savedId,
        startedAt: stepIdx === null ? draft.startedAt : draft.endAt - shownMs,
        note: note.trim() === '' ? undefined : note.trim(),
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [archive, draft, note, savedId, shownMs, stepIdx])

  const header = (
    <span className="flex min-w-0 flex-col">
      <span className="text-lg font-bold">{t('match.title')}</span>
      {/* 「已记录」只是状态，收进副标题：emerald 在全场面板里只留给「开新局」这个主操作。
          可调时长的面板里时长由滑杆行显示，副标题不重复 */}
      <span className="flex min-w-0 items-center gap-1 text-xs text-text-dim">
        {!editableDuration && (
          <span className="shrink-0 tabular-nums">
            {t('match.duration')} · {durationText(t, shownMs)}
          </span>
        )}
        {!unavailable && (
          <span className="flex shrink-0 items-center gap-0.5 text-emerald-300">
            {!editableDuration && '· '}
            <IconCheck className="size-3.5" aria-hidden />
            {t('match.saved')}
          </span>
        )}
      </span>
    </span>
  )

  return (
    <Overlay maxWidth="max-w-lg wide:max-w-2xl" title={header} onClose={onClose}>
      {unavailable && (
        <p className="text-sm leading-relaxed text-amber-300">{t('match.unavailable')}</p>
      )}

      {/*
       * 横屏两列（同 MatchShare 的预览/控制分栏）：左列结果榜是唯一的弹性块，
       * 人多时在框里自滚；右列滑杆/备注/按钮全刚性。竖屏堆叠，结果榜照样给一个
       * 高度上限自滚 —— 浮层整体（Overlay 的 card）不许滚
       */}
      <div className="flex min-h-0 flex-col gap-4 wide:flex-row short:gap-3">
        {/*
         * 结果榜是这局面板的主角：名次/胜负在 draft 里已经算好，这里只展示。
         * 按名次排（draft 里是座位序），分数用大字号 mono —— 全场面板里最大的内容是结果，
         * 不是按钮。胜者行给 emerald 淡底 + 王冠两重编码（颜色不许是唯一编码）
         */}
        <div className="flex max-h-[38vh] min-h-0 flex-col gap-1 overflow-y-auto rounded-xl bg-surface-2 p-2 wide:max-h-[60vh] wide:flex-1">
          {[...draft.players]
            .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
            .map((p, i) => {
              const win = p.outcome === 'win'
              return (
                <span
                  key={i}
                  className={`flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-2 ${
                    win ? 'bg-emerald-500/10' : ''
                  }`}
                >
                  {win ? (
                    <IconCrown className="size-5 shrink-0 text-amber-300" aria-hidden />
                  ) : (
                    /* 占位对齐：有无王冠的行，名字要对在同一条竖线上 */
                    <span className="size-5 shrink-0" aria-hidden />
                  )}
                  <span
                    className={`min-w-0 truncate rounded-md border-b-2 px-2 py-0.5 text-base font-bold ${PLAYER_LINE[p.color]}`}
                  >
                    {p.name}
                  </span>
                  {p.score !== undefined && (
                    <span className="ml-auto font-mono text-xl font-bold tabular-nums">
                      {fmtScore(p.score)}
                    </span>
                  )}
                </span>
              )
            })}
        </div>

        <div className="flex shrink-0 flex-col gap-4 wide:w-72 short:gap-3">
          {editableDuration && (
            <div className="flex flex-col">
              <span className="flex items-baseline justify-between gap-2">
                <span className="section-label">{t('match.playTime')}</span>
                <span className="font-mono text-base font-bold tabular-nums">
                  {durationText(t, shownMs)}
                </span>
              </span>
              <input
                type="range"
                min={0}
                max={DURATION_STEPS_MIN.length - 1}
                step={1}
                value={stepIdx ?? nearestStepIdx(measuredMs)}
                onChange={(e) => setStepIdx(Number(e.target.value))}
                aria-label={t('match.playTime')}
                aria-valuetext={durationText(t, shownMs)}
                className="slider-lg"
              />
            </div>
          )}

          {/* 备注没有小标签：placeholder 说的就是同一件事，aria-label 留给读屏 */}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
            placeholder={t('match.notePlaceholder')}
            aria-label={t('match.note')}
            className={FIELD}
          />

          <button
            type="button"
            onClick={() => setSharing(true)}
            className="btn-base gap-2 border border-line bg-surface-2 text-base short:!min-h-11"
          >
            <IconShare className="size-6 short:size-5" aria-hidden />
            {t('match.share.title')}
          </button>

          <button
            type="button"
            onClick={onDone}
            className="btn-base gap-2 bg-emerald-400 px-5 text-base font-bold text-ink short:!min-h-11"
          >
            <IconRepeat className="size-6 short:size-5" aria-hidden />
            {t('match.newGame')}
          </button>
        </div>
      </div>

      {sharing && (
        <MatchShare
          match={{
            ...draft,
            startedAt: draft.endAt - shownMs,
            note: note.trim() === '' ? undefined : note.trim(),
          }}
          exports={exports}
          onClose={() => setSharing(false)}
        />
      )}
    </Overlay>
  )
}
