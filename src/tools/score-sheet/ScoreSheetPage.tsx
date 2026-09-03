import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { buzz } from '../../shared/haptics'
import { useWakeLock } from '../../shared/hooks/useWakeLock'
import { useActiveMatch } from '../../shared/match/active'
import { MatchFinish } from '../../shared/match/MatchFinish'
import type { MatchDraft } from '../../shared/match/types'
import { SeatPicker } from '../../shared/players/SeatPicker'
import { resolveSeat, takenPlayerIds } from '../../shared/players/seats'
import { SeatStart } from '../../shared/players/SeatStart'
import { usePlayersStore } from '../../shared/players/store'
import { EntryPanel } from './EntryPanel'
import { scoreSheetMeta } from './meta'
import type { SheetPayload } from './payload'
import { renderSheetImage } from './png/layouts'
import { saveText, stampName } from './save'
import { SheetGrid } from './SheetGrid'
import { SheetHistory } from './SheetHistory'
import { SheetImage } from './SheetImage'
import { SheetKeypad } from './SheetKeypad'
import { SheetMore } from './SheetMore'
import { SheetSettings } from './SheetSettings'
import { buildSnapshot, type SheetSnapshot, toCsv } from './snapshot'
import {
  cellKey,
  entriesOf,
  hasRow,
  isComplete,
  rawOf,
  sheetMatchDraft,
  useSheetStore,
} from './store'
import { findTemplate, templateNameKey } from './templates'

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
    seatPlayers,
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
    imageSkin,
    imageForm,
    setImageSkin,
    setImageForm,
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

  /*
   * 顶栏的 quick 小工具看不见工具页内部的席位，靠这层镜像拿到「这一局谁在打」
   * （见 [active](../../shared/match/active.ts)）。用 getState 而不是订阅 setter：
   * 依赖里只剩真正会变的东西，不会因为 store 引用变化而反复写
   */
  useEffect(() => {
    useActiveMatch.getState().set({
      toolId: scoreSheetMeta.id,
      gameId: findTemplate(templateId).gameId,
      seats,
    })
  }, [seats, templateId])
  useEffect(() => () => useActiveMatch.getState().clear(), [])

  const [panel, setPanel] = useState<Panel | null>(null)
  /**
   * 结算面板要处理的那一局。**不算 Panel** —— 它是「更多」浮层关掉之后才出现的下一步，
   * 而且开面板那一刻就得把局面快照下来（`endAt` 是最后填分的时刻，不是现在）
   */
  const [finish, setFinish] = useState<MatchDraft | null>(null)
  /**
   * 要出图的那一局，**在点导出那一刻就快照下来**：之后在 lightbox 里换排版重画的是同一份数据，
   * 桌上继续填分不该改变已经打开的那张图。历史局导出更是如此（那局早结束了）。
   *
   * 与 `image` 分成两段而不是一个 state：换排版时变的只有渲染参数，
   * 合成一个就得在每个切换回调里重新 buildSnapshot 一次
   */
  const [target, setTarget] = useState<{ snapshot: SheetSnapshot; at: number } | null>(null)
  /**
   * 画好的 PNG。**不算 Panel** —— 它是 z-30 的独立 lightbox，
   * 从设置或历史浮层里打开、关掉后要回到底下那一层，两者能同时在屏上。
   * objectURL 与 blob 一起进 state：建在子组件的 effect 里会被 StrictMode 的
   * 「setup → cleanup → setup」撤掉（cleanup 一 revoke 就没了）
   */
  const [image, setImage] = useState<{ blob: Blob; url: string; filename: string } | null>(null)

  /*
   * 排版一变就重画。**不先清 image**：让上一张留在屏上直到新的就绪，
   * 否则每次点箭头都闪一下空白（画一张只要几十毫秒，闪比等更难受）。
   *
   * alive 防的是后发先至：连点箭头时两次渲染并行，先完成的那次不一定是最后选的那种。
   */
  useEffect(() => {
    if (!target) return
    let alive = true
    renderSheetImage(target.snapshot, imageForm, imageSkin, t('tools.scoreSheet.image.brand'))
      .then((blob) => {
        if (!alive) return
        setImage({
          blob,
          url: URL.createObjectURL(blob),
          filename: stampName(target.at, 'png', imageForm, imageSkin),
        })
      })
      // 画布失败（极老 Safari、内存不足）不该连页面一起带走，桌上分数还在表里
      .catch((e) => console.warn('[score-sheet] render failed', e))
    return () => {
      alive = false
    }
  }, [target, imageForm, imageSkin, t])

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

  /** 当前局的可导出形态，与归档进存档的是同一个形状 —— 导出路径因此不分「当前局 / 历史局」 */
  const current: SheetPayload = { templateId, customEntries, overrides, seats, cells, startedAt }

  /** 只负责定下「画哪一局」，画哪种排版由上面那个 effect 跟着 store 里的选择走 */
  const exportImage = (game: SheetPayload, at: number) => {
    setTarget({ snapshot: buildSnapshot(game, at, t), at })
  }

  const exportCsv = (game: SheetPayload, at: number) => {
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
        /* 没人时矩阵不渲染，列头那个 ＋ 也就不存在 —— 空态自己得带落座入口 */
        <SeatStart
          icon={scoreSheetMeta.icon}
          hint={t('tools.scoreSheet.empty')}
          onSeat={seatPlayers}
          onAddTemp={addSeat}
        />
      ) : (
        <SheetGrid
          seats={views}
          entries={entries}
          cells={cells}
          title={t(templateNameKey(templateId))}
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
          canFinish={isComplete(seats, cells)}
          onExportImage={() => exportImage(current, Date.now())}
          onExportCsv={() => exportCsv(current, Date.now())}
          onOpenHistory={() => setPanel({ kind: 'history' })}
          onFinish={() => setFinish(sheetMatchDraft())}
          onNewGame={newGame}
          onClose={() => setPanel(null)}
        />
      )}

      {finish && (
        <MatchFinish
          draft={finish}
          onDone={() => {
            newGame()
            setFinish(null)
          }}
          onClose={() => setFinish(null)}
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

      {target && (
        <SheetImage
          image={image}
          skin={imageSkin}
          form={imageForm}
          onSkin={setImageSkin}
          onForm={setImageForm}
          onClose={() => {
            setTarget(null)
            setImage(null)
          }}
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
