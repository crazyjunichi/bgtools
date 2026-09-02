import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { buzz } from '../../shared/haptics'
import { useWakeLock } from '../../shared/hooks/useWakeLock'
import { IconPlayerAdd } from '../../shared/icons'
import { SeatPicker } from '../../shared/players/SeatPicker'
import { resolveSeat, takenPlayerIds } from '../../shared/players/seats'
import { usePlayersStore } from '../../shared/players/store'
import { EntryPanel } from './EntryPanel'
import type { GameDraft } from './games'
import { saveText, stampName } from './save'
import { SheetGrid } from './SheetGrid'
import { SheetHistory } from './SheetHistory'
import { SheetImage } from './SheetImage'
import { SheetKeypad } from './SheetKeypad'
import { SheetMore } from './SheetMore'
import { renderSheetPng } from './sheetPng'
import { SheetSettings } from './SheetSettings'
import { buildSnapshot, toCsv } from './snapshot'
import { cellKey, entriesOf, hasRow, rawOf, useSheetStore } from './store'
import { findTemplate } from './templates'

/** 同一时刻只开一个浮层：席位（改名 / 换人 / 移除）、条目编辑、模板、更多操作、历史 */
type Panel =
  | { kind: 'seat'; seatId: string }
  | { kind: 'entry'; entryId: string }
  | { kind: 'template' }
  | { kind: 'more' }
  | { kind: 'history' }

export default function ScoreSheetPage() {
  // 结算要一项项对着实物数，全程摊在桌上给全员看，不能息屏
  useWakeLock()
  const { t } = useTranslation()

  const {
    templateId,
    customEntries,
    overrides,
    seats,
    cells,
    startedAt,
    pick,
    setTemplate,
    addSeat,
    removeSeat,
    bindPlayer,
    renameSeat,
    setPick,
    setCell,
    setScoring,
    setPer,
    addEntry,
    renameEntry,
    removeEntry,
    newGame,
    loadGame,
  } = useSheetStore()
  const players = usePlayersStore((s) => s.players)

  /*
   * 首页的模板入口把目标模板带在 URL 上（见 [Home](../../pages/Home.tsx)）。
   * **落地即把参数消费掉**：留着它，页面内换过模板之后刷新会被打回 URL 里那个。
   * setTemplate 不清分数，所以带参进来不会毁掉桌上正在填的表；
   * 模板 id 失效由 findTemplate 兜回通用空白。
   */
  const [params, setParams] = useSearchParams()
  const wanted = params.get('tpl')
  useEffect(() => {
    if (wanted === null) return
    setTemplate(wanted)
    setParams({}, { replace: true })
  }, [wanted, setTemplate, setParams])

  const [panel, setPanel] = useState<Panel | null>(null)
  /**
   * 导出好的 PNG。**不算 Panel** —— 它是 z-30 的独立 lightbox，
   * 从设置或历史浮层里打开、关掉后要回到底下那一层，两者能同时在屏上。
   * objectURL 与 blob 一起进 state：建在子组件的 effect 里会被 StrictMode 的
   * 「setup → cleanup → setup」撤掉（cleanup 一 revoke 就没了）
   */
  const [image, setImage] = useState<{ blob: Blob; url: string; filename: string } | null>(null)

  /*
   * 回收 objectURL。写成 effect 而不是塞进关闭回调：路由切走（浏览器返回）时
   * 这一层会直接卸载，那条路径上没有「关闭」这个动作。
   * 换成另一张图时 cleanup 也会先跑，撤掉的正是上一张，不会漏。
   */
  useEffect(() => {
    const url = image?.url
    return url ? () => URL.revokeObjectURL(url) : undefined
  }, [image])
  /**
   * 每次点格子都递增，只为参与键盘的 `key`：**再点一次同一个格子也要把输入缓冲清掉**
   * （报错了想重打一遍，最顺手的动作就是再点它一下）。光靠 pick 做 key 认不出这种重复选中。
   */
  const [seq, setSeq] = useState(0)

  const entries = useMemo(
    () => entriesOf(templateId, customEntries, overrides),
    [templateId, customEntries, overrides],
  )
  const editable = findTemplate(templateId).editable === true
  const views = seats.map((s) => resolveSeat(s, players))
  const taken = takenPlayerIds(seats)

  // 席位/条目被删后浮层自然消失，不必用 effect 回写 panel
  const activeSeat =
    panel?.kind === 'seat' ? views.find((v) => v.id === panel.seatId) : undefined
  const activeEntry = panel?.kind === 'entry' ? entries.find((e) => e.id === panel.entryId) : undefined
  // 只有自定义条目能改名/删除，模板条目在浮层里只能改输入方式
  const activeCustom = activeEntry && customEntries.find((e) => e.id === activeEntry.id)

  const pickedSeat = pick ? views.find((v) => v.id === pick.seatId) : undefined
  const pickedEntry = pick ? entries.find((e) => e.id === pick.entryId) : undefined
  // 换格时让键盘的输入缓冲自然重置（不写 effect）
  const pickKey = pick ? `${cellKey(pick.seatId, pick.entryId)}#${seq}` : 'idle'

  /**
   * 打字机顺序：先填完一个人的所有条目，再跳到下一列的第一条。
   * 桌上结算就是一人一人过，而且永远往前走 —— 到最后一格停住，不绕回开头。
   */
  const pickCell = (seatId: string, entryId: string) => {
    setPick({ seatId, entryId })
    setSeq((n) => n + 1)
  }

  /** 当前局的可导出形态，与归档进 IDB 的是同一个形状 —— 导出路径因此不分「当前局 / 历史局」 */
  const current: GameDraft = { templateId, customEntries, overrides, seats, cells, startedAt }

  const exportImage = (game: GameDraft, at: number) => {
    const snapshot = buildSnapshot(game, at, t)
    renderSheetPng(snapshot, t('tools.scoreSheet.image.brand'))
      .then((blob) =>
        setImage({ blob, url: URL.createObjectURL(blob), filename: stampName(at, 'png') }),
      )
      // 画布失败（极老 Safari、内存不足）不该连页面一起带走，桌上分数还在表里
      .catch((e) => console.warn('[score-sheet] render failed', e))
  }

  const exportCsv = (game: GameDraft, at: number) => {
    const csv = toCsv(buildSnapshot(game, at, t))
    saveText(csv, stampName(at, 'csv'), 'text/csv;charset=utf-8')
  }

  const next = () => {
    if (!pick) return
    const ei = entries.findIndex((e) => e.id === pick.entryId)
    if (ei < entries.length - 1) {
      pickCell(pick.seatId, entries[ei + 1].id)
      return
    }
    const si = views.findIndex((v) => v.id === pick.seatId)
    if (si < views.length - 1 && entries.length > 0) {
      pickCell(views[si + 1].id, entries[0].id)
    }
  }

  return (
    /*
     * **故意不套 [ToolLayout]**：它是「控制栏在左 + 主显示在右」，而这里要求键盘在右手边
     * （右手输数、左眼看矩阵，视线不跨过手）。朝向判据仍只用 wide，
     * 竖屏靠 DOM 顺序天然变成「矩阵在上 + 键盘贴底」，拇指够得到，不需要 order-*。
     */
    <div className="flex h-full min-h-0 flex-col gap-3 wide:flex-row short:gap-2">
      {views.length === 0 ? (
        /* 没人时矩阵不渲染，列头那个 ＋ 也就不存在 —— 空态自己得带一个加人入口 */
        <div className="card flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center wide:min-w-0">
          <span className="text-5xl" aria-hidden>
            📝
          </span>
          <span className="max-w-md text-base leading-relaxed text-text-muted">
            {t('tools.scoreSheet.empty')}
          </span>
          <button
            type="button"
            onClick={() => {
              addSeat()
              buzz(20)
            }}
            className="btn-base gap-2 border border-line bg-surface-2 px-5 text-base"
          >
            <IconPlayerAdd className="size-6" aria-hidden />
            {t('tools.scoreSheet.addSeat')}
          </button>
        </div>
      ) : (
        <SheetGrid
          seats={views}
          entries={entries}
          cells={cells}
          title={t(findTemplate(templateId).nameKey)}
          startedAt={startedAt}
          pick={pick}
          editable={editable}
          onPickCell={pickCell}
          onEditSeat={(seatId) => setPanel({ kind: 'seat', seatId })}
          onEditEntry={(entryId) => setPanel({ kind: 'entry', entryId })}
          onAddEntry={() => {
            addEntry()
            buzz(20)
          }}
          onAddSeat={() => {
            addSeat()
            buzz(20)
          }}
        />
      )}

      <SheetKeypad
        key={pickKey}
        seat={pickedSeat}
        entry={pickedEntry}
        raw={pick ? rawOf(cells, pick.seatId, pick.entryId) : undefined}
        onInput={(raw) => {
          if (pick) setCell(pick.seatId, pick.entryId, raw)
        }}
        onNext={next}
        onOpenTemplate={() => setPanel({ kind: 'template' })}
        onOpenMore={() => setPanel({ kind: 'more' })}
      />

      {panel?.kind === 'template' && (
        <SheetSettings
          templateId={templateId}
          customCount={customEntries.length}
          onPickTemplate={setTemplate}
          onClose={() => setPanel(null)}
        />
      )}

      {panel?.kind === 'more' && (
        <SheetMore
          canExport={Object.keys(cells).length > 0}
          onExportImage={() => exportImage(current, Date.now())}
          onExportCsv={() => exportCsv(current, Date.now())}
          onOpenHistory={() => setPanel({ kind: 'history' })}
          onNewGame={newGame}
          onClose={() => setPanel(null)}
        />
      )}

      {panel?.kind === 'history' && (
        <SheetHistory
          onLoad={loadGame}
          onExportImage={exportImage}
          onExportCsv={exportCsv}
          onClose={() => setPanel(null)}
        />
      )}

      {image && (
        <SheetImage
          blob={image.blob}
          url={image.url}
          filename={image.filename}
          onClose={() => setImage(null)}
        />
      )}

      {activeSeat && (
        <SeatPicker
          seat={activeSeat}
          players={players}
          taken={taken}
          onPick={(player) => bindPlayer(activeSeat.id, player)}
          onRenameSeat={(name) => renameSeat(activeSeat.id, name)}
          onRemove={() => removeSeat(activeSeat.id)}
          removeText={t('tools.scoreSheet.seat.remove')}
          confirmRemoveText={t('tools.scoreSheet.seat.confirmRemove')}
          onClose={() => setPanel(null)}
        />
      )}

      {activeEntry && (
        <EntryPanel
          entry={activeEntry}
          custom={activeCustom}
          filled={hasRow(cells, activeEntry.id)}
          onSetScoring={(scoring) => setScoring(activeEntry.id, scoring)}
          onSetPer={(per) => setPer(activeEntry.id, per)}
          onRename={(label) => renameEntry(activeEntry.id, label)}
          onRemove={() => removeEntry(activeEntry.id)}
          onClose={() => setPanel(null)}
        />
      )}
    </div>
  )
}
