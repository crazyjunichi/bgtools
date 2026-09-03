import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../components/ConfirmButton'
import { FIELD } from '../components/fieldStyle'
import { Overlay } from '../components/Overlay'
import { findGame, GAMES } from '../games/registry'
import { IconCheck, IconCrown, IconRepeat, IconShare } from '../icons'
import { PLAYER_DOT } from '../players/colors'
import { useArchiveStore } from './archive'
import type { MatchExport } from './detail'
import { durationText } from './format'
import { MatchChips } from './MatchChips'
import { NOTE_MAX } from './MatchNote'
import { MatchShare } from './MatchShare'
import { coopResult, teamResult } from './result'
import type { MatchDraft } from './types'

type Props = {
  /**
   * 工具算好的这一局。**在打开面板那一刻取一次快照**（尤其是 `endAt`，
   * 它是最后一次实质操作的时刻而不是现在），面板里的改动都只落在这份副本上。
   * 分数与名次由工具算（只有它知道怎么算），面板只让人调「谁算赢」这类规则外的判断。
   */
  draft: MatchDraft
  /**
   * 这个工具自己的明细导出，给「已记录」态那个分享按钮用。
   * **由工具页传进来**：shared 不许去查 tools 的注册表，而工具页知道自己的
   */
  exports?: readonly MatchExport[]
  /** 记录成功（或用户选了不记录）之后开新局 */
  onDone: () => void
  onClose: () => void
}

const ROW = 'btn-base w-full justify-between gap-3 border px-3 text-base short:!min-h-11'
const ROW_OFF = 'border-line bg-surface-2 text-text'
/** 获胜态：语义色 emerald（完成）+ 皇冠，两重编码 —— 颜色不许是唯一编码 */
const ROW_WIN = 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'

/**
 * 一局结束时的结算面板 —— **所有工具共用这一个出口**，历史与统计才只依赖一种记录形态。
 *
 * 它不持有「当前局」：谁参与了这一局只属于打开它的那个工具页，
 * 面板只是把那份状态收成一条 [Match](types.ts) 写进存档（见 [archive](archive.ts)）。
 */
export function MatchFinish({ draft, exports, onDone, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const status = useArchiveStore((s) => s.status)
  const load = useArchiveStore((s) => s.load)
  const archive = useArchiveStore((s) => s.archive)

  const { mode, startedAt, endAt } = draft
  const [gameId, setGameId] = useState(draft.gameId)
  const [players, setPlayers] = useState(draft.players)
  const [coopWin, setCoopWin] = useState(true)
  const [winnerTeam, setWinnerTeam] = useState<string | null>(null)
  const [note, setNote] = useState('')
  /**
   * 已经写进存档的那一局。**记下来之后不立刻开新局** ——
   * 刚打完那一下正是最想分享的时刻，而开了新局这一局的 draft 就没处拿了
   */
  const [saved, setSaved] = useState<MatchDraft | null>(null)
  const [sharing, setSharing] = useState(false)

  // 读一次盘只为知道 IDB 能不能用：禁用时得当场告诉用户这局记不下来，而不是静默丢掉
  useEffect(() => {
    void load()
  }, [load])

  const game = findGame(gameId)
  const teams = game?.teams ?? []

  /** 选游戏的列表按当前语言的名字排 —— 中文下是拼音序，比声明序好扫 */
  const options = useMemo(
    () =>
      GAMES.map((g) => ({ id: g.id, icon: g.icon, name: t(g.nameKey) })).sort((a, b) =>
        a.name.localeCompare(b.name, i18n.language),
      ),
    [t, i18n],
  )

  const unavailable = status === 'unavailable'
  const hasTemp = players.some((p) => p.playerId === null)

  const toggleWin = (i: number) =>
    setPlayers(
      players.map((p, idx) =>
        idx === i ? { ...p, outcome: p.outcome === 'win' ? 'loss' : 'win' } : p,
      ),
    )

  const setTeam = (i: number, teamId: string) =>
    setPlayers(players.map((p, idx) => (idx === i ? { ...p, teamId } : p)))

  const save = () => {
    const final =
      mode === 'coop'
        ? coopResult(players, coopWin)
        : mode === 'team'
          ? teamResult(players, winnerTeam)
          : players
    const trimmed = note.trim()
    const next: MatchDraft = {
      ...draft,
      gameId,
      players: final,
      note: trimmed === '' ? undefined : trimmed,
    }
    void archive(next)
    setSaved(next)
  }

  const header = (
    <span className="flex min-w-0 flex-col">
      <span className="text-lg font-bold">{t('match.title')}</span>
      <span className="truncate text-xs text-text-dim">
        {t('match.duration')} · {durationText(t, Math.max(0, endAt - startedAt))}
      </span>
    </span>
  )

  /*
   * 已记录态：这一局已经落盘，所以那些选项不再可改（改了也写不回去），
   * 只剩「拿走它」和「开下一局」两个去处
   */
  if (saved !== null) {
    return (
      <Overlay maxWidth="max-w-lg" title={header} onClose={onClose}>
        <p className="flex items-center gap-2 text-base text-emerald-300">
          <IconCheck className="size-6 shrink-0 short:size-5" aria-hidden />
          {t('match.saved')}
        </p>

        <MatchChips players={saved.players} />

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

        {sharing && (
          <MatchShare match={saved} exports={exports} onClose={() => setSharing(false)} />
        )}
      </Overlay>
    )
  }

  return (
    <Overlay maxWidth="max-w-lg" title={header} onClose={onClose}>
      {draft.gameId === null && (
        <div className="flex flex-col gap-2">
          <span className="section-label">{t('match.gameLabel')}</span>
          {/* 约束的是高度，所以是 vh 不是 vmin */}
          <div className="flex max-h-[26vh] flex-wrap gap-2 overflow-y-auto">
            <button
              type="button"
              onClick={() => setGameId(null)}
              aria-pressed={gameId === null}
              className={`btn-base min-w-24 flex-1 border px-3 text-base short:!min-h-11 ${
                gameId === null ? 'border-sky-500/60 bg-sky-500/15 text-sky-200 light:text-sky-700' : ROW_OFF
              }`}
            >
              {t('match.gameNone')}
            </button>
            {options.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGameId(g.id)}
                aria-pressed={gameId === g.id}
                className={`btn-base min-w-32 flex-1 gap-2 border px-3 text-base short:!min-h-11 ${
                  gameId === g.id ? 'border-sky-500/60 bg-sky-500/15 text-sky-200 light:text-sky-700' : ROW_OFF
                }`}
              >
                <span aria-hidden>{g.icon}</span>
                <span className="truncate">{g.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'coop' && (
        <div className="flex flex-col gap-2">
          <span className="section-label">{t('match.coopQuestion')}</span>
          <div className="grid grid-cols-2 gap-2">
            {([true, false] as const).map((win) => (
              <button
                key={String(win)}
                type="button"
                onClick={() => setCoopWin(win)}
                aria-pressed={coopWin === win}
                className={`btn-base gap-2 border px-3 text-base short:!min-h-11 ${
                  coopWin === win ? ROW_WIN : ROW_OFF
                }`}
              >
                {coopWin === win && <IconCheck className="size-5" aria-hidden />}
                {t(win ? 'match.coopWin' : 'match.coopLoss')}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'team' && teams.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="section-label">{t('match.winnerTeam')}</span>
          <div className="flex flex-wrap gap-2">
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => setWinnerTeam(team.id)}
                aria-pressed={winnerTeam === team.id}
                className={`btn-base min-w-28 flex-1 gap-2 border px-3 text-base short:!min-h-11 ${
                  winnerTeam === team.id ? ROW_WIN : ROW_OFF
                }`}
              >
                {winnerTeam === team.id && <IconCheck className="size-5" aria-hidden />}
                {t(team.nameKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="section-label">{t('match.players')}</span>
        <div className="flex max-h-[34vh] flex-col gap-2 overflow-y-auto">
          {players.map((p, i) => {
            const dot = (
              <span
                className={`size-3 shrink-0 rounded-full ${PLAYER_DOT[p.color]}`}
                aria-hidden
              />
            )
            const name = <span className="truncate">{p.name}</span>

            if (mode === 'ranked') {
              const win = p.outcome === 'win'
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleWin(i)}
                  aria-pressed={win}
                  aria-label={t('match.markWin', { name: p.name })}
                  className={`${ROW} shrink-0 ${win ? ROW_WIN : ROW_OFF}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {dot}
                    {name}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {/* 名次由分数算出、这里不给改：改了就和这局的分数自相矛盾 */}
                    <span className="text-xs tabular-nums text-text-dim">
                      {t('match.rank', { n: p.rank ?? 1 })}
                    </span>
                    <span className="font-mono tabular-nums">{p.score ?? 0}</span>
                    {win && <IconCrown className="size-5" aria-hidden />}
                  </span>
                </button>
              )
            }

            if (mode === 'team' && teams.length > 0) {
              return (
                <div
                  key={i}
                  className={`flex shrink-0 flex-col gap-2 rounded-xl border p-3 ${ROW_OFF}`}
                >
                  <span className="flex min-w-0 items-center gap-3 text-base">
                    {dot}
                    {name}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => setTeam(i, team.id)}
                        aria-pressed={p.teamId === team.id}
                        aria-label={`${p.name} · ${t(team.nameKey)}`}
                        className={`btn-base min-w-24 flex-1 gap-2 border px-3 text-sm short:!min-h-11 ${
                          p.teamId === team.id
                            ? 'border-sky-500/60 bg-sky-500/15 text-sky-200 light:text-sky-700'
                            : ROW_OFF
                        }`}
                      >
                        {p.teamId === team.id && <IconCheck className="size-4" aria-hidden />}
                        {t(team.nameKey)}
                      </button>
                    ))}
                  </div>
                </div>
              )
            }

            return (
              <div key={i} className={`${ROW} shrink-0 ${ROW_OFF}`}>
                <span className="flex min-w-0 items-center gap-3">
                  {dot}
                  {name}
                </span>
              </div>
            )
          })}
        </div>
        {hasTemp && <p className="text-xs leading-relaxed text-text-dim">{t('match.tempHint')}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <span className="section-label">{t('match.note')}</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
          placeholder={t('match.notePlaceholder')}
          aria-label={t('match.note')}
          className={FIELD}
        />
      </div>

      {unavailable ? (
        <p className="text-sm leading-relaxed text-amber-300">{t('match.unavailable')}</p>
      ) : (
        <button
          type="button"
          onClick={save}
          className="btn-base gap-2 bg-emerald-400 px-5 text-base font-bold text-ink short:!min-h-11"
        >
          <IconCheck className="size-6 short:size-5" aria-hidden />
          {t('match.save')}
        </button>
      )}

      <ConfirmButton onConfirm={onDone} confirmText={t('match.confirmDiscard')}>
        {t('match.discard')}
      </ConfirmButton>
    </Overlay>
  )
}
