import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ToolLayout } from '../../shared/components/ToolLayout'
import { IconCheck } from '../../shared/icons'
import type { I18nKey } from '../../shared/i18n/types'
import { useArchiveStore } from '../../shared/match/archive'
import { durationText } from '../../shared/match/format'
import { usePlayersStore } from '../../shared/players/store'
import { gameRows, overview, playerRows, statsSource } from './aggregate'
import { GameList } from './GameList'
import { MatchDetail } from './MatchDetail'
import { PlayerDetail } from './PlayerDetail'
import { PlayerList } from './PlayerList'
import { TimeList } from './TimeList'

const VIEWS = [
  { id: 'players', labelKey: 'tools.stats.view.players' },
  { id: 'games', labelKey: 'tools.stats.view.games' },
  { id: 'time', labelKey: 'tools.stats.view.time' },
] as const satisfies readonly { id: string; labelKey: I18nKey }[]

type View = (typeof VIEWS)[number]['id']

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline justify-between gap-2">
      <span className="truncate text-sm text-text-muted">{label}</span>
      <span className="shrink-0 font-mono text-base tabular-nums">{value}</span>
    </span>
  )
}

/**
 * 战绩统计 —— **只读 [Match](../../shared/match/types.ts) 这一个契约**，
 * 不碰任何工具的私有存档（连 `payload` 都不解），所以新工具接进结算面板就自动进统计。
 *
 * 全量扫存档现算，不维护累计表：一晚几条、一年几百条，聚合成本可忽略，
 * 而累计表必然与「删掉某一局」脱节。
 */
export default function StatsPage() {
  const { t } = useTranslation()
  const { matches, status, load } = useArchiveStore()
  const roster = usePlayersStore((s) => s.players)
  const [view, setView] = useState<View>('players')
  const [openId, setOpenId] = useState<string | null>(null)
  const [openMatchId, setOpenMatchId] = useState<string | null>(null)

  // 这一页的全部内容都来自存档，所以进页面就读盘（别的工具是打开浮层才读）
  useEffect(() => {
    void load()
  }, [load])

  const rows = useMemo(() => statsSource(matches), [matches])
  const sum = useMemo(() => overview(matches), [matches])
  const players = useMemo(() => playerRows(rows, roster), [rows, roster])
  const games = useMemo(() => gameRows(rows, roster), [rows, roster])

  const open = openId === null ? undefined : players.find((p) => p.playerId === openId)
  const openMatch = openMatchId === null ? undefined : matches.find((m) => m.id === openMatchId)

  const panel = (
    <>
      {/* 换行而不是固定列数：横屏左栏放不下三个并排，英文标签会被截断 */}
      <div className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            aria-pressed={view === v.id}
            // 选中态是「淡底 + ✓」两重编码：斜视下只靠底色深浅分不出选没选
            className={`btn-base min-w-0 flex-1 basis-24 gap-2 border px-3 text-base short:!min-h-11 ${
              view === v.id
                ? 'border-sky-500/60 bg-sky-500/15 text-sky-200'
                : 'border-line bg-surface-2 text-text'
            }`}
          >
            {view === v.id && <IconCheck className="size-5 shrink-0" aria-hidden />}
            <span className="truncate">{t(v.labelKey)}</span>
          </button>
        ))}
      </div>

      <div className="card flex flex-col gap-2 !p-3">
        <span className="section-label">{t('tools.stats.overview')}</span>
        <Stat label={t('tools.stats.totalGames')} value={String(sum.games)} />
        <Stat label={t('tools.stats.totalTime')} value={durationText(t, sum.totalMs)} />
        <Stat label={t('tools.stats.gameKinds')} value={String(sum.gameKinds)} />
      </div>

      {/* 说清为什么这里的局数比计分纸历史里少 */}
      {sum.legacy > 0 && (
        <p className="text-xs leading-relaxed text-text-dim">
          {t('tools.stats.legacyHint', { n: sum.legacy })}
        </p>
      )}
    </>
  )

  return (
    <ToolLayout panel={panel}>
      {/* 列表自己滚，页面级不滚 */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {status === 'loading' && <p className="px-1 py-2 text-sm text-text-muted">{t('common.loading')}</p>}

        {/* IndexedDB 被禁（隐私模式等）就没有统计可看，其余工具照用 */}
        {status === 'unavailable' && (
          <p className="px-1 py-2 text-sm leading-relaxed text-amber-300">
            {t('tools.stats.unavailable')}
          </p>
        )}

        {/* 「按时间」连旧存档一起列，所以它的空判据是整张表空，不是「有几局进了统计」 */}
        {status === 'ready' && (view === 'time' ? matches.length === 0 : sum.games === 0) && (
          <p className="px-1 py-2 text-sm leading-relaxed text-text-muted">
            {t('tools.stats.empty')}
          </p>
        )}

        {/* 有记录但全是临时席位：个人战绩为空得说清是为什么 */}
        {sum.games > 0 && view === 'players' && players.length === 0 && (
          <p className="px-1 py-2 text-sm leading-relaxed text-text-muted">
            {t('tools.stats.playerEmpty')}
          </p>
        )}

        {view === 'players' && <PlayerList rows={players} onOpen={setOpenId} />}
        {view === 'games' && <GameList rows={games} />}
        {view === 'time' && <TimeList matches={matches} onOpen={setOpenMatchId} />}
      </div>

      {open && <PlayerDetail row={open} onClose={() => setOpenId(null)} />}
      {openMatch && (
        <MatchDetail key={openMatch.id} match={openMatch} onClose={() => setOpenMatchId(null)} />
      )}
    </ToolLayout>
  )
}
