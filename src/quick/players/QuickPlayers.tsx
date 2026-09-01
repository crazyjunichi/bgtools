import { useState } from 'react'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { buzz } from '../../shared/haptics'
import {
  IconCheck,
  IconDelete,
  IconMoveDown,
  IconMoveUp,
  IconPlayerAdd,
  IconPlayers,
  IconReset,
  IconSelected,
} from '../../shared/icons'
import { PLAYER_COLORS, PLAYER_DOT, PLAYER_SOFT, PLAYER_SOLID } from '../../shared/players/colors'
import { MAX_NAME_LEN, MAX_PLAYERS, usePlayersStore } from '../../shared/players/store'

/**
 * 全局玩家名单的编辑面板。数据在 [shared/players/store]，这里只有 UI ——
 * 与其他 quick 工具不同，名单是**跨工具共享**的，不走"与工具页状态独立"那条惯例。
 *
 * 布局的三条依据：
 * - **名单是主角**：列表不设 max-h，跟着面板高撑满（横屏 820 高的屏上 8 人全见）。
 *   增删改的按钮一律不占左栏，否则每个按钮就吃掉名单一行
 * - **操作按玩家/名单两级分组**：针对选中玩家的（换位、删除）与「添加」同排收在右侧顶部，
 *   名单级的「重置」缩到 label 行右侧
 * - **右侧余量给色板**：编辑区内容天然少，与其留白不如让色块撑满 —— 点击目标和颜色面积都受益
 *
 * 身份色用 teal：避开四个语义色，也不与调色板里的青重合。
 */
export function QuickPlayers() {
  const { players, add, remove, rename, setColor, move, reset } = usePlayersStore()
  // 选中哪个玩家是瞬时状态，不进 store
  const [editingId, setEditingId] = useState<string | null>(() => players[0]?.id ?? null)
  // 名字用草稿而非直接写 store：store 会把空名回填成「玩家N」，边打边存会把清空的输入框填回来
  const [draft, setDraft] = useState(() => players[0]?.name ?? '')

  const index = players.findIndex((p) => p.id === editingId)
  const editing = index >= 0 ? players[index] : undefined

  /** add / reset 之后本轮渲染的 players 还是旧的，名字得从最新 state 回读 */
  const selectPlayer = (id: string | null) => {
    setEditingId(id)
    setDraft(id ? (usePlayersStore.getState().players.find((p) => p.id === id)?.name ?? '') : '')
  }

  const handleAdd = () => {
    const id = add()
    if (!id) return
    buzz(20)
    selectPlayer(id)
  }

  const commitName = () => {
    if (!editing) return
    rename(editing.id, draft)
    // 回读一次：空名被回填成默认名后，输入框要跟上
    selectPlayer(editing.id)
  }

  const handleRemove = () => {
    if (!editing) return
    remove(editing.id)
    selectPlayer(null)
    buzz([10, 40, 10])
  }

  const handleReset = () => {
    reset()
    selectPlayer(usePlayersStore.getState().players[0]?.id ?? null)
  }

  const stepBtn = 'btn-quiet size-14 shrink-0 short:!min-h-11 short:size-11'
  const stepIcon = 'size-6 short:size-5'

  return (
    /*
     * 高度必须显式给：QuickDialog 的高度由内容决定，内层再写 h-full 就没有锚点、会塌缩。
     * 竖屏（含手机竖屏）改上下堆叠 —— 224px 的左栏在 390px 宽的屏上会挤爆编辑区。
     */
    <div className="flex h-[min(40rem,64vh)] flex-col gap-4 wide:h-[min(36rem,72vh)] wide:flex-row short:gap-2">
      <div className="flex min-h-0 flex-1 flex-col gap-2 wide:w-56 wide:flex-none">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <span className="section-label">
            座位顺序{' '}
            <span className="font-mono tabular-nums text-text-dim">
              {players.length}/{MAX_PLAYERS}
            </span>
          </span>
          {/* 名单级操作，低频：压到次要按钮下限 48px，省下的高度全给列表 */}
          <ConfirmButton
            onConfirm={handleReset}
            confirmText="确认"
            className="!min-h-12 shrink-0 !gap-1.5 !px-3 !text-sm"
          >
            <IconReset className="size-4" aria-hidden />
            重置
          </ConfirmButton>
        </div>

        {/* 名单是主体，撑满剩余高度；超出只在自己框里滚，页面级不滚这条底线没破 */}
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 short:gap-1.5">
          {players.length === 0 ? (
            <span className="rounded-xl border border-line bg-surface-2 p-3 text-sm leading-relaxed text-text-muted">
              名单是空的，点右侧「添加玩家」。
            </span>
          ) : (
            players.map((p, i) => {
              const on = p.id === editingId
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPlayer(p.id)}
                  aria-pressed={on}
                  // 选中态不能用玩家色（那是身份色）：用表面阶梯 + IconSelected 两重编码
                  className={`btn-base w-full shrink-0 justify-start gap-2 px-3 text-base short:!min-h-11 short:text-sm ${
                    on ? 'bg-surface-3 text-text' : 'bg-surface-2 text-text-muted'
                  }`}
                >
                  <span className="w-3 shrink-0 font-mono text-sm tabular-nums text-text-dim">
                    {i + 1}
                  </span>
                  <span
                    className={`size-3.5 shrink-0 rounded-full ${PLAYER_DOT[p.color]}`}
                    aria-hidden
                  />
                  <span className="truncate">{p.name}</span>
                  {on && <IconSelected className="ml-auto size-5 shrink-0" aria-hidden />}
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 rounded-2xl border border-line bg-surface-2 p-4 wide:min-h-0 wide:flex-1 short:gap-2 short:p-3">
        {/* 操作条：左边是名单级的「添加」，竖线右边全是针对选中玩家的 */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={players.length >= MAX_PLAYERS}
            className="btn-base gap-2 bg-teal-400 px-4 text-base font-bold text-ink short:!min-h-11 short:text-sm"
          >
            <IconPlayerAdd className="size-5 short:size-4" aria-hidden />
            添加玩家
          </button>
          <span className="ml-auto h-8 w-px shrink-0 bg-line" aria-hidden />
          <button
            type="button"
            onClick={() => {
              if (!editing) return
              move(editing.id, -1)
              buzz()
            }}
            disabled={!editing || index === 0}
            aria-label="上移座位"
            className={stepBtn}
          >
            <IconMoveUp className={stepIcon} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!editing) return
              move(editing.id, 1)
              buzz()
            }}
            disabled={!editing || index === players.length - 1}
            aria-label="下移座位"
            className={stepBtn}
          >
            <IconMoveDown className={stepIcon} aria-hidden />
          </button>
          <ConfirmButton
            onConfirm={handleRemove}
            confirmText="确认删除"
            disabled={!editing}
            className="shrink-0 !px-3"
          >
            <IconDelete className="size-5" aria-hidden />
            删除
          </ConfirmButton>
        </div>

        {editing ? (
          <>
            <div className="flex shrink-0 flex-col gap-1.5">
              <span className="section-label">名字</span>
              <input
                value={draft}
                maxLength={MAX_NAME_LEN}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                }}
                aria-label="玩家名字"
                className="min-h-14 rounded-xl border border-line bg-surface px-4 text-lg text-text outline-none focus:border-teal-400 short:min-h-11 short:text-base"
              />
            </div>

            <div className="flex flex-col gap-1.5 wide:min-h-0 wide:flex-1">
              <span className="section-label">偏好颜色</span>
              {/* 同色允许重复，只标出还有谁在用、不禁用 —— 所以格子里必须带中文色名，
                  选中态再叠一个 IconCheck：颜色不能是唯一编码。
                  横屏下吃掉编辑区的剩余高度，色块越大越好点、颜色也越好认 */}
              <div className="grid grid-cols-4 gap-2 wide:min-h-0 wide:flex-1 wide:grid-rows-2 short:gap-1.5">
                {PLAYER_COLORS.map((c) => {
                  const on = c.id === editing.color
                  const others = players.filter((p) => p.id !== editing.id && p.color === c.id)
                  const taken =
                    others.length > 1 ? `${others[0].name} +${others.length - 1}` : others[0]?.name
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setColor(editing.id, c.id)
                        buzz()
                      }}
                      aria-pressed={on}
                      aria-label={taken ? `${c.label}，${taken} 也在用` : c.label}
                      className={`btn-base flex-col gap-0 px-1 short:!min-h-11 ${
                        on ? `${PLAYER_SOLID[c.id]} font-bold` : `border ${PLAYER_SOFT[c.id]}`
                      }`}
                    >
                      <span className="flex items-center gap-1 text-lg short:text-base">
                        {on && <IconCheck className="size-4 shrink-0" aria-hidden />}
                        {c.label}
                      </span>
                      {taken && (
                        <span className="w-full truncate px-1 text-xs opacity-80">{taken}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center wide:min-h-0 wide:flex-1">
            <IconPlayers className="size-10 text-text-dim" aria-hidden />
            <span className="text-sm leading-relaxed text-text-muted">
              {players.length === 0 ? '添加玩家后在这里改名、选颜色' : '点左侧玩家开始编辑'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
