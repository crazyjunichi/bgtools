import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Overlay } from '../../shared/components/Overlay'
import { IconBack, IconCrown, IconCsv, IconDelete, IconImage } from '../../shared/icons'
import { useArchiveStore } from '../../shared/match/archive'
import { durationText } from '../../shared/match/format'
import { MatchNote } from '../../shared/match/MatchNote'
import { PLAYER_SOLID } from '../../shared/players/colors'
import { scoreSheetMeta } from './meta'
import { readSheetPayload, type SheetPayload } from './payload'
import { SheetGrid } from './SheetGrid'
import { buildSnapshot } from './snapshot'
import { entriesOf, fmtScore } from './store'

type Props = {
  onLoad: (payload: SheetPayload, endAt: number) => void
  onExportImage: (payload: SheetPayload, at: number) => void
  onExportCsv: (payload: SheetPayload, at: number) => void
  onClose: () => void
}

/**
 * 一次最多渲染多少条。IDB 全读几百条也不到 50ms，卡的是 DOM ——
 * 攒了一年之后列表得能滚得动，所以默认只出最近这批，更早的按需展开。
 */
const PAGE = 50

/** 只读矩阵的框高：受约束的是高度，所以是 vh 不是 vmin（见 CLAUDE.md 的判据 C） */
const GRID_BOX = 'flex h-[min(26rem,48vh)] flex-col short:h-[min(14rem,42vh)]'

/**
 * 历史记录：列表 + 单局详情**两层视图共用一个浮层**，不叠第二层
 * （叠浮层在平板上会让人不知道点哪个遮罩能退回去）。
 *
 * 记录来自共享存档（[archive](../../shared/match/archive.ts)），由结算面板写入，
 * 这里只读、改备注、删、导出。**计分纸 v1 的旧局也在里面**（读时适配、标了 legacy），
 * 它们没有分数与备注，所以详情里少一块。
 */
export function SheetHistory({ onLoad, onExportImage, onExportCsv, onClose }: Props) {
  const { t } = useTranslation()
  const { matches, status, load, remove, clear } = useArchiveStore()
  const [openId, setOpenId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  // 惰性读盘：工具页启动时不碰 IDB，只有真的打开这个浮层才读
  useEffect(() => {
    void load()
  }, [load])

  /*
   * 单表混着所有工具的记录，这里只要计分纸的；payload 反解不出来的直接跳过
   * （别的版本写下的东西，与其显示半条不如不显示）。
   * 列表行要的「谁多少分」和导出用的是同一个 buildSnapshot ——
   * 行里显示的合计与导出图上的合计不可能对不上
   */
  const games = useMemo(
    () =>
      matches
        .filter((m) => m.toolId === scoreSheetMeta.id)
        .flatMap((m) => {
          const payload = readSheetPayload(m.payload)
          return payload ? [{ match: m, payload }] : []
        }),
    [matches],
  )

  const rows = useMemo(
    () =>
      (showAll ? games : games.slice(0, PAGE)).map((g) => ({
        ...g,
        snap: buildSnapshot(g.payload, g.match.endAt, t),
      })),
    [games, showAll, t],
  )

  const open = openId ? games.find((g) => g.match.id === openId) : undefined

  if (open) {
    const { match, payload } = open
    const entries = entriesOf(payload.templateId, payload.customEntries, payload.overrides)
    const snap = buildSnapshot(payload, match.endAt, t)
    const spent = match.endAt - match.startedAt
    return (
      <Overlay
        maxWidth="max-w-3xl"
        title={
          <span className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setOpenId(null)}
              aria-label={t('tools.scoreSheet.history.back')}
              className="btn-quiet !min-h-12 w-12 shrink-0 short:!min-h-11 short:w-11"
            >
              <IconBack className="size-5" aria-hidden />
            </button>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-base font-bold">{snap.title}</span>
              <span className="truncate text-xs tabular-nums text-text-dim">
                {snap.dateText}
                {/* 旧局没记开局时刻，时长会是 0，那就不显示这一段 */}
                {spent > 0 && ` · ${durationText(t, spent)}`}
              </span>
            </span>
          </span>
        }
        onClose={onClose}
      >
        {/* 只读态的矩阵与当前局长得一模一样，桌上不用重新认一套界面 */}
        <div className={GRID_BOX}>
          <SheetGrid
            readOnly
            seats={payload.seats.map((s) => ({ ...s, linked: false }))}
            entries={entries}
            cells={payload.cells}
          />
        </div>

        {/* 备注是记录里唯一能事后改的字段 */}
        <MatchNote key={match.id} match={match} />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onExportImage(payload, match.endAt)}
            className="btn-base gap-2 border border-line bg-surface-2 text-base short:!min-h-11"
          >
            <IconImage className="size-6 short:size-5" aria-hidden />
            {t('tools.scoreSheet.more.exportImage')}
          </button>
          <button
            type="button"
            onClick={() => onExportCsv(payload, match.endAt)}
            className="btn-base gap-2 border border-line bg-surface-2 text-base short:!min-h-11"
          >
            <IconCsv className="size-6 short:size-5" aria-hidden />
            {t('tools.scoreSheet.more.exportCsv')}
          </button>
          {/* 读取会覆盖当前局，必须二次确认 */}
          <ConfirmButton
            onConfirm={() => {
              onLoad(payload, match.endAt)
              onClose()
            }}
            confirmText={t('tools.scoreSheet.history.confirmLoad')}
          >
            {t('tools.scoreSheet.history.load')}
          </ConfirmButton>
          <ConfirmButton
            onConfirm={() => {
              void remove(match.id)
              setOpenId(null)
            }}
            confirmText={t('tools.scoreSheet.history.confirmRemove')}
          >
            <IconDelete className="size-6 short:size-5" aria-hidden />
            {t('tools.scoreSheet.history.remove')}
          </ConfirmButton>
        </div>
      </Overlay>
    )
  }

  return (
    <Overlay
      maxWidth="max-w-3xl"
      title={<span className="text-lg font-bold">{t('tools.scoreSheet.history.title')}</span>}
      onClose={onClose}
    >
      {status === 'loading' && (
        <span className="px-1 py-2 text-sm text-text-muted">{t('common.loading')}</span>
      )}

      {/* IndexedDB 被禁只关掉这一块，其余功能照用 —— 不是崩点 */}
      {status === 'unavailable' && (
        <span className="px-1 py-2 text-sm leading-relaxed text-amber-300">
          {t('tools.scoreSheet.history.unavailable')}
        </span>
      )}

      {status === 'ready' && games.length === 0 && (
        <span className="px-1 py-2 text-sm leading-relaxed text-text-muted">
          {t('tools.scoreSheet.history.empty')}
        </span>
      )}

      {rows.length > 0 && (
        // 列表自己滚，浮层整体仍不滚（滚整个浮层会把「清空历史」推出视野）
        <div className="flex max-h-[52vh] flex-col gap-2 overflow-y-auto short:max-h-[40vh]">
          {rows.map(({ match, snap }) => (
            <button
              key={match.id}
              type="button"
              onClick={() => setOpenId(match.id)}
              aria-label={t('tools.scoreSheet.history.open', {
                date: snap.dateText,
                name: snap.title,
              })}
              className="btn-base shrink-0 flex-col !items-stretch gap-2 border border-line bg-surface-2 px-3 py-2 short:!min-h-11"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-base font-semibold">{snap.title}</span>
                <span className="shrink-0 text-xs tabular-nums text-text-dim">{snap.dateText}</span>
              </span>
              {/* 名字与分数同框：玩家色允许被两人共用，色块不能是唯一识别 */}
              <span className="flex flex-wrap gap-1">
                {snap.seats.map((seat, i) => (
                  <span
                    key={i}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${
                      PLAYER_SOLID[seat.color]
                    }`}
                  >
                    {snap.bestTotal !== null && snap.totals[i] === snap.bestTotal && (
                      <IconCrown className="size-3.5 shrink-0" aria-hidden />
                    )}
                    <span className="max-w-24 truncate">{seat.name}</span>
                    <span className="font-mono tabular-nums">{fmtScore(snap.totals[i])}</span>
                  </span>
                ))}
              </span>
              {match.note !== undefined && (
                <span className="truncate text-left text-xs text-text-muted">{match.note}</span>
              )}
            </button>
          ))}

          {!showAll && games.length > PAGE && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="btn-quiet shrink-0 text-sm short:!min-h-11"
            >
              {t('tools.scoreSheet.history.more')}
            </button>
          )}
        </div>
      )}

      {/* 没有条数上限，所以必须给一个出口；逐条删也留着，误触代价太大的是这个 */}
      {games.length > 0 && (
        <ConfirmButton
          onConfirm={() => {
            // 只清计分纸自己的：单表里还躺着别的工具的局
            void clear(scoreSheetMeta.id)
            setShowAll(false)
          }}
          confirmText={t('tools.scoreSheet.history.confirmClear')}
        >
          <IconDelete className="size-6 short:size-5" aria-hidden />
          {t('tools.scoreSheet.history.clear')}
        </ConfirmButton>
      )}
    </Overlay>
  )
}
