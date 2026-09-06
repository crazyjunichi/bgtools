import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Overlay } from '../../shared/components/Overlay'
import { IconBack, IconDelete, IconShare } from '../../shared/icons'
import { useArchiveStore } from '../../shared/match/archive'
import { dateTimeText, durationText } from '../../shared/match/format'
import { gameLabel } from '../../shared/match/label'
import { MatchNote } from '../../shared/match/MatchNote'
import { MatchRow } from '../../shared/match/MatchRow'
import type { Match } from '../../shared/match/types'
import { scoreSheetMeta } from './meta'
import { readSheetPayload, type SheetPayload } from './payload'
import { SheetDetail } from './SheetDetail'
import { findTemplate, templateIdentity } from './templates'

type Props = {
  /** 把那条记录的 id 也带回去：读回来的表再结算是覆盖它，不是新记一局 */
  onLoad: (payload: SheetPayload, endAt: number, id: string) => void
  /** 交给分享面板的是**整条记录**：形态怎么画由面板里的注册项各自反解 */
  onShare: (match: Match) => void
  onClose: () => void
}

/**
 * 一次最多渲染多少条。IDB 全读几百条也不到 50ms，卡的是 DOM ——
 * 攒了一年之后列表得能滚得动，所以默认只出最近这批，更早的按需展开。
 */
const PAGE = 50

/**
 * 历史记录：列表 + 单局详情**两层视图共用一个浮层**，不叠第二层
 * （叠浮层在平板上会让人不知道点哪个遮罩能退回去）。
 *
 * 记录来自共享存档（[archive](../../shared/match/archive.ts)），由结算面板写入，
 * 这里只读、改备注、删、分享。**计分纸 v1 的旧局也在里面**（读时适配、标了 legacy），
 * 它们没有分数与备注，所以详情里少一块。
 */
export function SheetHistory({ onLoad, onShare, onClose }: Props) {
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
   *
   * 标题优先取结算时指定的游戏（含手填的名字）；没指定才回退到**模板**身份 ——
   * 「通用空白」那种局按游戏目录只会显示「不指定」，对不上桌上那张纸
   */
  const games = useMemo(
    () =>
      matches
        .filter((m) => m.toolId === scoreSheetMeta.id)
        .flatMap((m) => {
          const payload = readSheetPayload(m.payload)
          if (payload === null) return []
          const id = templateIdentity(findTemplate(payload.templateId))
          const identity =
            m.gameId !== null || m.gameName !== undefined
              ? gameLabel(t, m.gameId, m.gameName)
              : { name: t(id.nameKey), icon: id.icon }
          return [{ match: m, payload, identity }]
        }),
    [matches, t],
  )

  const rows = showAll ? games : games.slice(0, PAGE)

  const open = openId ? games.find((g) => g.match.id === openId) : undefined

  if (open) {
    const { match, payload, identity } = open
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
              <span className="truncate text-base font-bold">{identity.name}</span>
              <span className="truncate text-xs tabular-nums text-text-dim">
                {dateTimeText(match.endAt)}
                {/* 旧局没记开局时刻，时长会是 0，那就不显示这一段 */}
                {spent > 0 && ` · ${durationText(t, spent)}`}
              </span>
            </span>
          </span>
        }
        onClose={onClose}
      >
        {/* 与统计页回看用的是同一个细则视图 */}
        <SheetDetail match={match} />

        {/* 备注是记录里唯一能事后改的字段 */}
        <MatchNote key={match.id} match={match} />

        {/* 分享独占一行：另两个是 [ConfirmButton]，武装后的确认文案挤不进三分之一格 */}
        <button
          type="button"
          onClick={() => onShare(match)}
          className="btn-base gap-2 border border-line bg-surface-2 text-base short:!min-h-11"
        >
          <IconShare className="size-6 short:size-5" aria-hidden />
          {t('tools.scoreSheet.more.share')}
        </button>

        <div className="grid grid-cols-2 gap-2">
          {/* 读取会覆盖当前局，必须二次确认 */}
          <ConfirmButton
            onConfirm={() => {
              onLoad(payload, match.endAt, match.id)
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
          {/* 与统计页「按时间」共用一种行：分数与胜负都读归档好的那份，不再逐行复算局面 */}
          {rows.map(({ match, identity }) => (
            <MatchRow
              key={match.id}
              match={match}
              identity={identity}
              onOpen={() => setOpenId(match.id)}
            />
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
