import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { buzz } from '../../shared/haptics'
import { useHeaderTitle } from '../../shared/headerTitle'
import { useWakeLock } from '../../shared/hooks/useWakeLock'
import { useActiveMatch } from '../../shared/match/active'
import { MatchFinish } from '../../shared/match/MatchFinish'
import { MatchShare } from '../../shared/match/MatchShare'
import type { MatchDraft } from '../../shared/match/types'
import { SeatPicker } from '../../shared/players/SeatPicker'
import { resolveSeat, takenPlayerIds } from '../../shared/players/seats'
import { SeatStart } from '../../shared/players/SeatStart'
import { usePlayersStore } from '../../shared/players/store'
import { EntryPanel } from './EntryPanel'
import { sheetExports } from './match'
import { scoreSheetMeta } from './meta'
import { SheetGrid } from './SheetGrid'
import { SheetHistory } from './SheetHistory'
import { SheetKeypad } from './SheetKeypad'
import { SheetMore } from './SheetMore'
import { SheetSettings } from './SheetSettings'
import {
  cellKey,
  entriesOf,
  hasRow,
  isComplete,
  rawOf,
  sheetMatchDraft,
  useSheetStore,
} from './store'
import { BLANK_ID, findTemplate, templateIdentity } from './templates'

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
    clearSeats,
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
    setMatchId,
  } = useSheetStore()
  const players = usePlayersStore((s) => s.players)

  /*
   * 首页的模板入口把目标模板带在 URL 上（见 [Home](../../pages/Home.tsx)）。
   * **落地即把参数消费掉**：留着它，页面内换过模板之后刷新会被打回 URL 里那个。
   * setTemplate 是换档（各模板各记一份局面），带参进来不会毁掉桌上正在填的表；
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
   * 「从某盒游戏点进来」只在落地首帧可判 —— tpl 参数随即被上面的 effect 消费掉。
   * 锁定的表没有换模板这一步：模板按钮收起（见 SheetKeypad），顶栏标题换成那盒游戏。
   */
  const [lockedTpl] = useState(() => wanted)
  const locked = lockedTpl !== null && findTemplate(lockedTpl).gameId !== null
  useEffect(() => {
    if (!locked || lockedTpl === null) return
    const identity = templateIdentity(findTemplate(lockedTpl))
    useHeaderTitle.getState().set({ icon: identity.icon, nameKey: identity.nameKey })
    return () => useHeaderTitle.getState().clear()
  }, [locked, lockedTpl])

  /*
   * 反过来，从首页通用卡进来（没带 tpl）而表里还停在某盒游戏上：退回通用空白那一档。
   * 游戏那一档留在 store 的 sheets 里 —— 再点那张游戏卡，原局面还在。
   * 只在落地时判一次：进来之后用模板钮手动切到游戏模板是合法操作，不拦。
   */
  useEffect(() => {
    if (lockedTpl !== null) return
    if (findTemplate(useSheetStore.getState().templateId).gameId !== null) setTemplate(BLANK_ID)
  }, [lockedTpl, setTemplate])

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
   * 要分享的那一局，**在点分享那一刻就快照下来**：面板里换形态重画的是同一份数据，
   * 桌上继续填分不该改变已经打开的那张图。**不算 Panel** —— 它是 z-30 的独立层，
   * 从「更多」或历史浮层里打开、关掉后要回到底下那一层，两者能同时在屏上
   */
  const [share, setShare] = useState<MatchDraft | null>(null)
  /**
   * 每次选中格子都递增，只为参与键盘的 `key`：竖屏收起键盘只是 CSS 藏掉、组件不卸载，
   * 输入缓冲留着 —— 再展开同一格时靠它把缓冲清掉。光靠 pick 做 key 认不出这种重复选中。
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
   *
   * 再点一次已选中的格子 = 取消选中：竖屏下键盘随之收起（矩阵回到一屏全览），
   * 横屏只是取消高亮，键盘常驻右栏不动。
   */
  const pickCell = (seatId: string, entryId: string) => {
    if (pick?.seatId === seatId && pick?.entryId === entryId) {
      setPick(null)
      return
    }
    setPick({ seatId, entryId })
    setSeq((n) => n + 1)
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
        /* 没人时矩阵不渲染 —— 空态自己得带落座入口；开局后的加人/清人收在「更多」里 */
        <SeatStart onSeat={seatPlayers} />
      ) : (
        <SheetGrid
          seats={views}
          entries={entries}
          cells={cells}
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
        />
      )}

      <SheetKeypad
        key={pickKey}
        seat={pickedSeat}
        entry={pickedEntry}
        collapsed={!pick}
        raw={pick ? rawOf(cells, pick.seatId, pick.entryId) : undefined}
        onInput={(raw) => {
          if (pick) setCell(pick.seatId, pick.entryId, raw)
        }}
        onNext={next}
        showTemplate={!locked}
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
          canShare={Object.keys(cells).length > 0}
          canFinish={isComplete(seats, cells)}
          onAddSeat={() => {
            addSeat()
            buzz(20)
          }}
          onClearSeats={clearSeats}
          onShare={() => setShare(sheetMatchDraft())}
          onOpenHistory={() => setPanel({ kind: 'history' })}
          onFinish={() => setFinish(sheetMatchDraft())}
          onNewGame={newGame}
          onClose={() => setPanel(null)}
        />
      )}

      {finish && (
        <MatchFinish
          draft={finish}
          // 计分纸是玩完才摊开记，测到的只是记账耗时，时长交给玩家用滑杆报
          editableDuration
          exports={sheetExports}
          onArchived={setMatchId}
          onDone={() => {
            newGame()
            setFinish(null)
          }}
          onClose={() => setFinish(null)}
        />
      )}

      {panel?.kind === 'history' && (
        <SheetHistory onLoad={loadGame} onShare={setShare} onClose={() => setPanel(null)} />
      )}

      {share && (
        <MatchShare match={share} exports={sheetExports} onClose={() => setShare(null)} />
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
