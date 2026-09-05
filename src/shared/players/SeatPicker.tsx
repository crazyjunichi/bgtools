import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuickUI } from '../../quick/store'
import { ConfirmButton } from '../components/ConfirmButton'
import { Overlay } from '../components/Overlay'
import { buzz } from '../haptics'
import { IconCheck, IconDelete, IconEdit, IconPlayers } from '../icons'
import { PLAYER_LINE } from './colors'
import type { SeatView } from './seats'
import { MAX_NAME_LEN, usePlayersStore, type Player } from './store'

type Props = {
  seat: SeatView
  players: Player[]
  /** 已被别的席位占用的 playerId：一个人不该同时占两列 */
  taken: Set<string>
  onPick: (player: Player | null) => void
  /**
   * 只用于**临时席位**改名（改这一列的快照）。绑定了名单玩家时本组件直接改名单 ——
   * 名单是真源，那条逻辑属于这一层，不该在每个工具里各写一遍。
   */
  onRenameSeat: (name: string) => void
  onRemove: () => void
  /** 删除的文案由工具给：一边连历史轮次一起删，一边连各项分数 */
  removeText: string
  confirmRemoveText: string
  onClose: () => void
}

/**
 * 席位面板：改名 · 换人 · 移除，一屏做完。多轮计分从调分浮层
 * （[SeatSheet](../../tools/score/SeatSheet.tsx)）进来，计分纸直接点列头进来 ——
 * 两边需要的是同一件事，所以放在 shared/players 而非任一工具里。
 *
 * 三件事挤在一屏是有意的：桌上「这一列是谁」的修正往往连着来（先改名发现认错人，
 * 再换成名单里的另一个），多一层浮层就多一次开关。防误触靠**空间隔离**而不是分屏 ——
 * 删除是左上角一个图标位且必须点两次，人名格子在下方另一块区域里。
 *
 * 改名/换色的完整编辑仍在顶栏 👥，列表末尾留一格跳过去。
 * 关闭一律直接回主区：遮罩点击期望的是全关而非退一层。
 */
export function SeatPicker({
  seat,
  players,
  taken,
  onPick,
  onRenameSeat,
  onRemove,
  removeText,
  confirmRemoveText,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const openTool = useQuickUI((s) => s.openTool)
  const renamePlayer = usePlayersStore((s) => s.rename)
  // null = 没在编辑，显示 store 里的名字；非 null 时输入框自己说话（半成品也要留得住）
  const [draft, setDraft] = useState<string | null>(null)

  const commitName = () => {
    const name = draft?.trim()
    // 空名不落库（名字的不变式是非空）；同名不写，免得白记一笔
    if (name && name !== seat.name) {
      // 判据用 linked 而非 playerId：那个人被删掉后 id 还挂着，得按临时席位改快照
      if (seat.linked && seat.playerId) renamePlayer(seat.playerId, name)
      else onRenameSeat(name)
      buzz()
    }
    setDraft(null)
  }

  return (
    <Overlay
      onClose={onClose}
      title={
        <div className="flex min-w-0 items-center gap-2">
          {/* 移除会连分数一起删，所以只给一个图标位、必须点两次；武装后自己撑开文字，名字让位 */}
          <ConfirmButton
            onConfirm={() => {
              onRemove()
              onClose()
            }}
            confirmText={confirmRemoveText}
            className="shrink-0 !min-h-12 !px-3 !text-sm short:!min-h-11"
          >
            <IconDelete className="size-5" aria-hidden />
            <span className="sr-only">{removeText}</span>
          </ConfirmButton>
          {/*
           * 名字条带底部玩家色粗边：这一屏底下满是人名按钮，得先说清"正在改的是哪一列"。
           * 它本身就是输入框 —— 要改的正是这个名字，指到它比另起一行「重命名」更直接；
           * 左对齐 + 尾部笔形图标是唯一的"可编辑"暗示，居中会看着像个标题。
           */}
          <label
            className={`flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-xl border-b-4 px-3 short:min-h-11 ${
              PLAYER_LINE[seat.color]
            }`}
          >
            <input
              value={draft ?? seat.name}
              maxLength={MAX_NAME_LEN}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={(e) => {
                setDraft(seat.name)
                // 改名基本都是重打一遍，不必先删掉旧的
                e.target.select()
              }}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
              }}
              enterKeyHint="done"
              aria-label={t('players.seat.nameInput')}
              className="min-w-0 flex-1 bg-transparent text-lg font-bold caret-current outline-none"
            />
            <IconEdit className="size-4 shrink-0 opacity-70" aria-hidden />
          </label>
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        <span className="section-label">{t('players.seat.roster')}</span>
        {/*
         * 固定三列而非按内容伸缩：名单顺序即座位顺序，格子位置不随入座进度漂移，
         * 一晚上换几个游戏都点同一个地方。名字长了 truncate，读屏仍念全名。
         */}
        <div className="grid grid-cols-3 gap-2">
          {players.length === 0 && (
            <span className="col-span-full rounded-xl border border-line bg-surface-2 p-3 text-sm leading-relaxed text-text-muted">
              {t('players.seat.emptyRoster')}
            </span>
          )}
          {players.map((p) => {
            const current = p.id === seat.playerId
            /*
             * 已在别的列入座：留在原位压暗，不从列表里抽走（抽走会让后面所有格子跳位）。
             * disabled 自带 opacity-40，再加删除线 —— 透明度在桌面强光下读不出来。
             */
            const seated = !current && taken.has(p.id)
            return (
              <button
                key={p.id}
                type="button"
                disabled={seated}
                onClick={() => {
                  onPick(p)
                  buzz()
                  onClose()
                }}
                aria-label={
                  current
                    ? t('players.seat.current', { name: p.name })
                    : seated
                      ? t('players.seat.seated', { name: p.name })
                      : p.name
                }
                className={`btn-base min-w-0 gap-1 border-b-4 px-2 text-base short:!min-h-11 short:text-sm ${
                  PLAYER_LINE[p.color]
                } ${seated ? 'line-through' : ''} ${
                  // 当前这一列的人：描边 + ✓ 两重编码（底线色已被"是谁"占用，颜色说不了"选中"）
                  current ? 'outline-2 outline-offset-2 outline-white' : ''
                }`}
              >
                {current && <IconCheck className="size-4 shrink-0" aria-hidden />}
                <span className="truncate">{p.name}</span>
              </button>
            )
          })}
          {/* 管理入口当列表的最后一格：加人/换色就在名单末尾往下接着做，视线不用回到别处 */}
          <button
            type="button"
            onClick={() => {
              openTool('players')
              onClose()
            }}
            className="btn-quiet min-w-0 gap-1 px-2 text-base short:!min-h-11 short:text-sm"
          >
            <IconPlayers className="size-5 shrink-0" aria-hidden />
            <span className="truncate">{t('players.seat.manage')}</span>
          </button>
        </div>
      </div>

      {/* 没绑名单玩家时说一句：这一列进不了个人战绩 —— 上面的名单就是补救入口 */}
      {!seat.linked && (
        <p className="text-xs leading-relaxed text-text-dim">{t('players.seat.tempHint')}</p>
      )}

      {/* 解除关联不丢分数，所以不必二次确认 */}
      {seat.linked && (
        <button
          type="button"
          onClick={() => {
            onPick(null)
            onClose()
          }}
          className="btn-quiet px-4 text-base short:!min-h-11"
        >
          {t('players.seat.unlink')}
        </button>
      )}
    </Overlay>
  )
}
