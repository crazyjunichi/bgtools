import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Stepper } from '../../shared/components/Stepper'
import { ToolLayout } from '../../shared/components/ToolLayout'
import { presetOf } from '../../shared/deal-roles/deck'
import { DealRoles } from '../../shared/deal-roles/DealRoles'
import type { DealPool } from '../../shared/deal-roles/online/backend'
import { useDealRolesStore } from '../../shared/deal-roles/store'
import { buzz } from '../../shared/haptics'
import { usePaperTone } from '../../shared/hooks/usePaperTone'
import {
  IconCheck,
  IconDeal,
  IconEye,
  IconPlay,
  IconPlayers,
  IconRepeat,
  IconReset,
  IconShare,
  IconUndo,
} from '../../shared/icons'
import { useArchiveStore } from '../../shared/match/archive'
import { MatchShare } from '../../shared/match/MatchShare'
import { playerHexOf } from '../../shared/players/colors'
import { PlayerChip } from '../../shared/players/PlayerChip'
import { resolveSeat } from '../../shared/players/seats'
import { SeatStart } from '../../shared/players/SeatStart'
import { usePlayersStore } from '../../shared/players/store'
import { Board } from './Board'
import { draftOf, matchTool } from './match'
import { FAKE_ARTIST_ROLES } from './roles'
import { isDoneOf, MAX_ROUNDS, MIN_SEATS, turnIndexOf, useFakeArtistStore } from './store'

const ACCENT = 'emerald' as const

/**
 * 冒牌艺术家在纽约。三个状态：
 * - 空座位：通用开局选人（SeatStart，点击顺序 = 走笔顺序）
 * - setup：每人几笔 + 发身份（抽题发生在打开发牌的那一刻）+ 开始画画
 * - playing：共画板 + 参与者面板，抬笔换人，画满或提前结束后定格、亮答案
 *
 * 发牌与座位刻意不绑定：牌沿桌传，谁拿到冒牌工具不知道 —— 结束只亮词，投票口头进行。
 */
export default function FakeArtistPage() {
  const { t } = useTranslation()
  const players = usePlayersStore((s) => s.players)
  const seats = useFakeArtistStore((s) => s.seats)
  const rounds = useFakeArtistStore((s) => s.rounds)
  const prompt = useFakeArtistStore((s) => s.prompt)
  const strokes = useFakeArtistStore((s) => s.strokes)
  const earlyDone = useFakeArtistStore((s) => s.earlyDone)
  const phase = useFakeArtistStore((s) => s.phase)
  const revealed = useFakeArtistStore((s) => s.revealed)
  const startedAt = useFakeArtistStore((s) => s.startedAt)
  const lastActiveAt = useFakeArtistStore((s) => s.lastActiveAt)
  const aspect = useFakeArtistStore((s) => s.aspect)
  const seatPlayers = useFakeArtistStore((s) => s.seatPlayers)
  const clearSeats = useFakeArtistStore((s) => s.clearSeats)
  const shuffleSeats = useFakeArtistStore((s) => s.shuffleSeats)
  const setRounds = useFakeArtistStore((s) => s.setRounds)
  const drawPrompt = useFakeArtistStore((s) => s.drawPrompt)
  const startPlaying = useFakeArtistStore((s) => s.startPlaying)
  const undoStroke = useFakeArtistStore((s) => s.undoStroke)
  const finishEarly = useFakeArtistStore((s) => s.finishEarly)
  const reveal = useFakeArtistStore((s) => s.reveal)
  const reset = useFakeArtistStore((s) => s.reset)

  const [pool, setPool] = useState<DealPool | null>(null)
  const [sharing, setSharing] = useState(false)

  // 名单是真源：改名/换色立刻反映；被删的人退回席位快照
  const views = useMemo(() => seats.map((s) => resolveSeat(s, players)), [seats, players])
  // 座位表的描边与画布同色值：canvas/inline 拿不到主题类名，跟 Board 共用同一个 tone
  const tone = usePaperTone()
  const done = isDoneOf({ phase, earlyDone, strokes, seats, rounds })
  const turnIdx = turnIndexOf(strokes.length, views.length)
  // 人数下限在选人界面（SeatStart 的 minSeats）就拦住了，这里只差「题抽了没有」
  const canStart = prompt !== null

  /** 这一局的待归档记录。null = 没的可记（没抽题/一笔没画），分享与归档共用 */
  const draft = useMemo(
    () => draftOf({ prompt, strokes, rounds, startedAt, lastActiveAt, aspect }, views),
    [prompt, strokes, rounds, startedAt, lastActiveAt, aspect, views],
  )

  /** 再来一局：公布过答案才记录上一局（fire-and-forget 同结算面板约定）；没公布就重开是作废局 */
  const again = () => {
    if (revealed && draft) void useArchiveStore.getState().archive(draft)
    reset()
  }

  const openDeal = () => {
    // 配比跟这局人数走（1 冒 + 其余画）；预设表没覆盖的人数保持上次的配比
    const preset = presetOf(FAKE_ARTIST_ROLES, views.length)
    if (preset) useDealRolesStore.getState().applyPreset(FAKE_ARTIST_ROLES.id, { ...preset.counts })
    const p = drawPrompt()
    // 艺术家那格是词，冒牌货那格是主题（规则上他知道主题，靠它装画家）
    setPool({ artist: p.word, fake: t('tools.fakeArtist.board.category', { category: p.category }) })
    buzz(20)
  }

  if (seats.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <SeatStart onSeat={seatPlayers} minSeats={MIN_SEATS} />
      </div>
    )
  }

  return (
    <>
      {phase === 'setup' ? (
        <ToolLayout
          panel={
            <>
              <Stepper
                value={rounds}
                onChange={setRounds}
                min={1}
                max={MAX_ROUNDS}
                label={t('tools.fakeArtist.setup.rounds')}
              />
              <button
                type="button"
                onClick={openDeal}
                className="btn-base min-h-16 shrink-0 gap-2 bg-emerald-400 text-xl font-bold text-ink short:!min-h-12 short:text-base"
              >
                <IconDeal className="size-6 short:size-5" aria-hidden />
                {t('dealRoles.open')}
              </button>
              <button
                type="button"
                disabled={!canStart}
                onClick={() => {
                  startPlaying()
                  buzz(20)
                }}
                className="btn-quiet shrink-0 gap-2 !text-base short:!min-h-11"
              >
                <IconPlay className="size-5 short:size-4" aria-hidden />
                {prompt === null
                  ? t('tools.fakeArtist.setup.needDeal')
                  : t('tools.fakeArtist.setup.start')}
              </button>
              <ConfirmButton
                onConfirm={clearSeats}
                confirmText={t('tools.fakeArtist.setup.reseatConfirm')}
                className="mt-auto"
              >
                <IconPlayers className="size-5 short:size-4" aria-hidden />
                {t('tools.fakeArtist.setup.reseat')}
              </ConfirmButton>
            </>
          }
        >
          {/* 入座后的席位预览：这里排的就是走笔顺序，换人去「换一拨人」重选 */}
          <div className="card flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto wide:min-w-0">
            {/* 换序按钮贴着它的作用对象（这份名单），不占控制栏 */}
            <div className="flex shrink-0 items-center gap-2">
              <span className="section-label">{t('tools.fakeArtist.setup.seats')}</span>
              <button
                type="button"
                onClick={() => {
                  shuffleSeats()
                  buzz()
                }}
                className="btn-quiet ml-auto min-h-12 gap-2 px-3 text-sm"
              >
                <IconRepeat className="size-5" aria-hidden />
                {t('tools.fakeArtist.setup.shuffle')}
              </button>
            </div>
            <div className="flex flex-wrap content-start gap-2">
              {views.map((v, i) => (
                <span key={v.id} className="flex items-center gap-1.5">
                  <span className="font-mono text-sm tabular-nums text-text-dim">{i + 1}</span>
                  <PlayerChip player={v} />
                </span>
              ))}
            </div>
          </div>
        </ToolLayout>
      ) : (
        <ToolLayout
          panel={
            <>
              {/* 座位表：当前人大一档高亮（描边 + 名字），每人已画几笔在右侧。
                  竖屏 panel 贴底、纵向没地方，名单两列排；横屏侧栏恢复单列 */}
              <div className="flex shrink-0 flex-col gap-2">
                <span className="section-label">{t('tools.fakeArtist.board.order')}</span>
                <div className="grid grid-cols-2 gap-2 wide:flex wide:flex-col">
                  {views.map((v, i) => {
                    const isCurrent = !done && i === turnIdx
                    const count = strokes.filter((_, k) => k % views.length === i).length
                    return (
                      <div
                        key={v.id}
                        className={`flex items-center gap-2 rounded-xl px-2 py-1.5 ${
                          isCurrent ? 'bg-surface-3' : ''
                        }`}
                        style={
                          isCurrent
                            ? { outline: `2px solid ${playerHexOf(v.color, tone).bg}`, outlineOffset: -2 }
                            : undefined
                        }
                      >
                        <span className="w-4 shrink-0 font-mono text-sm tabular-nums text-text-dim">
                          {i + 1}
                        </span>
                        <PlayerChip player={v} size="sm" />
                        <span className="ml-auto shrink-0 font-mono text-sm tabular-nums text-text-muted">
                          {t('tools.fakeArtist.board.strokesOf', { n: count, total: rounds })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/*
               * 底栏永远恰好两个按钮，跟着阶段换：
               * 作画中 = 撤销 + 结束作画；定格 = 公布答案 + 再来一局（作废不记）；
               * 亮答案后 = 分享 + 再来一局（记录上一局，见 again）
               */}
              <div className="mt-auto flex shrink-0 flex-col gap-2">
                {!done && (
                  <>
                    <button
                      type="button"
                      disabled={strokes.length === 0}
                      onClick={() => {
                        undoStroke()
                        buzz()
                      }}
                      className="btn-quiet gap-2 !text-base short:!min-h-11"
                    >
                      <IconUndo className="size-5 short:size-4" aria-hidden />
                      {t('tools.fakeArtist.board.undo')}
                    </button>
                    <ConfirmButton
                      onConfirm={finishEarly}
                      confirmText={t('tools.fakeArtist.board.finishConfirm')}
                      className="!text-base short:!min-h-11"
                    >
                      <IconCheck className="size-5 short:size-4" aria-hidden />
                      {t('tools.fakeArtist.board.finish')}
                    </ConfirmButton>
                  </>
                )}
                {done && !revealed && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        reveal()
                        buzz(20)
                      }}
                      className="btn-base min-h-16 gap-2 bg-emerald-400 text-xl font-bold text-ink short:!min-h-12 short:text-base"
                    >
                      <IconEye className="size-6 short:size-5" aria-hidden />
                      {t('tools.fakeArtist.board.reveal')}
                    </button>
                    <ConfirmButton
                      onConfirm={again}
                      confirmText={t('tools.fakeArtist.board.againConfirm')}
                      className="!text-base short:!min-h-11"
                    >
                      <IconReset className="size-5 short:size-4" aria-hidden />
                      {t('tools.fakeArtist.board.again')}
                    </ConfirmButton>
                  </>
                )}
                {revealed && (
                  <>
                    <button
                      type="button"
                      disabled={draft === null}
                      onClick={() => setSharing(true)}
                      className="btn-base min-h-16 gap-2 bg-emerald-400 text-xl font-bold text-ink short:!min-h-12 short:text-base"
                    >
                      <IconShare className="size-6 short:size-5" aria-hidden />
                      {t('tools.fakeArtist.board.share')}
                    </button>
                    <ConfirmButton
                      onConfirm={again}
                      confirmText={t('tools.fakeArtist.board.againConfirm')}
                      className="!text-base short:!min-h-11"
                    >
                      <IconReset className="size-5 short:size-4" aria-hidden />
                      {t('tools.fakeArtist.board.again')}
                    </ConfirmButton>
                  </>
                )}
              </div>
            </>
          }
        >
          <Board />
        </ToolLayout>
      )}

      {pool && (
        <DealRoles
          set={FAKE_ARTIST_ROLES}
          accent={ACCENT}
          pool={pool}
          onClose={() => setPool(null)}
        />
      )}
      {/* 分享只在亮答案后开得出来（按钮就藏在那个分支里），draft 为空时按钮本来就是灰的 */}
      {sharing && draft && (
        <MatchShare match={draft} exports={matchTool.exports} onClose={() => setSharing(false)} />
      )}
    </>
  )
}
