import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { I18nKey } from '../../shared/i18n/types'
import { useArchiveStore } from '../../shared/match/archive'
import { usePlayersStore } from '../../shared/players/store'
import { gameRows, overview, playerRows, statsSource } from './aggregate'
import { GameList } from './GameList'
import { MatchDetail } from './MatchDetail'
import { OverviewCards } from './OverviewCards'
import { PlayerList } from './PlayerList'
import { TimeList } from './TimeList'

const VIEWS = [
  { id: 'players', labelKey: 'tools.stats.view.players' },
  { id: 'games', labelKey: 'tools.stats.view.games' },
  { id: 'time', labelKey: 'tools.stats.view.time' },
] as const satisfies readonly { id: string; labelKey: I18nKey }[]

type View = (typeof VIEWS)[number]['id']

/**
 * 视图切换。竖屏是吸顶的文字 tab（下划线 + 变色两重编码），横屏是左栏的竖排导航（淡底 + 变色）。
 * **横向形态的总高固定为 52px**（h-11 + 容器 py-1）—— [TimeList](TimeList.tsx) 的日期头按这个值吸顶。
 * 竖屏形态必须做滚动根的直接子级（sticky 只吸在祖先滚动容器里，再包一层就会被那层的高度卡住），
 * 所以 `wide:hidden` 也写在它自己身上。
 */
function StatsNav({
  view,
  onChange,
  vertical,
}: {
  view: View
  onChange: (v: View) => void
  vertical?: boolean
}) {
  const { t } = useTranslation()
  return (
    <nav
      className={
        vertical
          ? 'flex shrink-0 flex-col gap-1'
          : // bg-canvas 兜住从下面滚过的列表行
            'sticky top-0 z-10 flex gap-1 bg-canvas py-1 wide:hidden'
      }
    >
      {VIEWS.map((v) => {
        const on = view === v.id
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onChange(v.id)}
            aria-pressed={on}
            className={
              vertical
                ? `flex min-h-11 items-center rounded-lg px-3 text-left text-sm font-semibold ${
                    on ? 'bg-sky-500/15 text-sky-300' : 'text-text-muted'
                  }`
                : `h-11 flex-1 border-b-2 px-2 text-sm font-semibold ${
                    on ? 'border-sky-400 text-sky-300' : 'border-transparent text-text-muted'
                  }`
            }
          >
            {t(v.labelKey)}
          </button>
        )
      })}
    </nav>
  )
}

/**
 * 战绩统计 —— **只读 [Match](../../shared/match/types.ts) 这一个契约**，
 * 不碰任何工具的私有存档（连 `payload` 都不解），所以新工具接进结算面板就自动进统计。
 *
 * 全量扫存档现算，不维护累计表：一晚几条、一年几百条，聚合成本可忽略，
 * 而累计表必然与「删掉某一局」脱节。
 *
 * 布局是阅读页而非工具页（不上桌、单人近距看）：不套 ToolLayout，页面级滚动 + 44px 行。
 * 竖屏 = 概览卡 + 吸顶 tab + 列表整页滚；横屏 = 左栏（概览行 + 竖排导航）+ 右侧列表自滚。
 * 概览与导航因此在 DOM 里各有两份（按朝向 hidden 互斥），hidden 不进读屏树，无重复播报。
 */
export default function StatsPage() {
  const { t } = useTranslation()
  const { matches, status, load } = useArchiveStore()
  const roster = usePlayersStore((s) => s.players)
  const [view, setView] = useState<View>('players')
  const [openMatchId, setOpenMatchId] = useState<string | null>(null)

  // 这一页的全部内容都来自存档，所以进页面就读盘（别的工具是打开浮层才读）
  useEffect(() => {
    void load()
  }, [load])

  const rows = useMemo(() => statsSource(matches), [matches])
  const sum = useMemo(() => overview(matches, roster), [matches, roster])
  const players = useMemo(() => playerRows(rows, roster), [rows, roster])
  const games = useMemo(() => gameRows(rows, roster), [rows, roster])

  const openMatch = openMatchId === null ? undefined : matches.find((m) => m.id === openMatchId)

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto wide:grid wide:grid-cols-[15rem_minmax(0,1fr)] wide:gap-4 wide:overflow-hidden">
      {/* 竖屏：概览卡网格，随页面滚走 */}
      <div className="wide:hidden">
        <OverviewCards sum={sum} layout="cards" />
      </div>

      {/* 竖屏：吸顶 tab（直接子级，见 StatsNav 注释） */}
      <StatsNav view={view} onChange={setView} />

      {/* 横屏：左栏（概览行 + 竖排导航），内容过高时自己滚 */}
      <aside className="hidden min-h-0 flex-col gap-4 overflow-y-auto wide:flex">
        <OverviewCards sum={sum} layout="rows" />
        <StatsNav view={view} onChange={setView} vertical />
      </aside>

      {/* 竖屏不许有 min-h-0：那会丢掉「不小于内容高」的默认下限，
          整页滚动的 flex 列里列表会被压缩而不是把页面撑出滚动 */}
      <section className="flex flex-col gap-1.5 wide:min-h-0 wide:overflow-y-auto">
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

        {view === 'players' && <PlayerList rows={players} />}
        {view === 'games' && <GameList rows={games} />}
        {view === 'time' && <TimeList matches={matches} onOpen={setOpenMatchId} />}
      </section>

      {openMatch && (
        <MatchDetail key={openMatch.id} match={openMatch} onClose={() => setOpenMatchId(null)} />
      )}
    </div>
  )
}
