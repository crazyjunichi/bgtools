import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { buzz } from '../../shared/haptics'
import {
  IconCheck,
  IconDelete,
  IconPlayerAdd,
  IconPlayers,
  IconSelected,
} from '../../shared/icons'
import { PLAYER_COLORS, PLAYER_DOT, PLAYER_SOLID } from '../../shared/players/colors'
import { MAX_NAME_LEN, usePlayersStore } from '../../shared/players/store'

/**
 * 全局玩家名单的编辑面板。数据在 [shared/players/store]，这里只有 UI ——
 * 与其他 quick 工具不同，名单是**跨工具共享**的，不走"与工具页状态独立"那条惯例。
 *
 * 布局的三条依据：
 * - **名单是主角**：列表不设 max-h，跟着面板高撑满（人数无上限，超出只在框内滚）
 * - **操作贴着它的作用对象**：名单级的「添加」压在列表标题行（不单占一行，省下的高度归列表），
 *   针对选中玩家的「删除」跟在名字输入框右边 —— 座位换位不给按钮，顺序按添加顺序
 * - **右侧余量给色板**：编辑区内容天然少，与其留白不如让 16 个色块撑满 —— 点击目标和颜色面积都受益
 *
 * 身份色用 teal：避开四个语义色，也不与调色板里的青重合。
 */
export function QuickPlayers() {
  const { t } = useTranslation()
  const { players, add, remove, rename, setColor } = usePlayersStore()
  // 选中哪个玩家是瞬时状态，不进 store
  const [editingId, setEditingId] = useState<string | null>(() => players[0]?.id ?? null)
  // 名字用草稿而非直接写 store：store 会把空名回填成默认名，边打边存会把清空的输入框填回来
  const [draft, setDraft] = useState(() => players[0]?.name ?? '')

  const editing = players.find((p) => p.id === editingId)

  /** add 之后本轮渲染的 players 还是旧的，名字得从最新 state 回读 */
  const selectPlayer = (id: string | null) => {
    setEditingId(id)
    setDraft(id ? (usePlayersStore.getState().players.find((p) => p.id === id)?.name ?? '') : '')
  }

  const handleAdd = () => {
    buzz(20)
    selectPlayer(add())
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

  return (
    /*
     * 高度必须显式给：QuickDialog 的高度由内容决定，内层再写 h-full 就没有锚点、会塌缩。
     * 竖屏（含手机竖屏）改上下堆叠 —— 编辑区是刚性的，并排就没名单的位置了。
     * **竖屏比横屏留得高**：堆叠时各块高度是相加而非取各块最大值，
     * 4×4 色板比横屏多吃掉两行，不加高名单就只剩两行可见。
     * 预算算法见 CLAUDE.md 的 quick 横竖屏布局一节。
     */
    <div className="flex h-[min(48rem,72vh)] flex-col gap-4 wide:h-[min(36rem,72vh)] wide:flex-row short:gap-2">
      {/* 横屏下名单是唯一的弹性块，余量全归它：编辑区内容是刚性的，宽了只会把色板拉散 */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 wide:min-w-0">
        {/* 标题行兼作操作行：添加按钮是次要档，再压就点不准，单独占一行又要吃掉列表的高度。
            只报当前人数、不报上限（人数没有上限） */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="section-label">
            {t('quick.players.roster')}{' '}
            <span className="font-mono tabular-nums text-text-dim">{players.length}</span>
          </span>
          <button
            type="button"
            onClick={handleAdd}
            className="btn-base ml-auto min-h-12 shrink-0 gap-2 bg-teal-400 px-3 text-sm font-bold text-ink eink-solid short:!min-h-11"
          >
            <IconPlayerAdd className="size-5 short:size-4" aria-hidden />
            {t('quick.players.add')}
          </button>
        </div>

        {/* 名单是主体，撑满剩余高度；超出只在自己框里滚，页面级不滚这条底线没破 */}
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 short:gap-1.5">
          {players.length === 0 ? (
            <span className="rounded-xl border border-line bg-surface-2 p-3 text-sm leading-relaxed text-text-muted">
              {t('quick.players.emptyList')}
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

      {/* 横屏宽度按色板算死：4 列 × 70px（最长色名 Magenta 的 text-base 宽度）+ gap + 内边距 = 336，
          再宽就是白占名单的地方 —— 编辑区内容全是刚性的，拉宽只会把色块摊散 */}
      <div className="flex shrink-0 flex-col gap-3 rounded-2xl border border-line bg-surface-2 p-4 wide:min-h-0 wide:w-84 wide:flex-none short:gap-2 short:p-3">
        {editing ? (
          <>
            {/* 输入框不配「名字」标签：它是这里唯一的文本框，内容自明，省下的 26px 归色板。
                删除跟着名字走 —— 作用对象就是框里这个人，不必回顶部找按钮；
                min-w 按「确认删除」的文案宽度锁住，武装态换文案时输入框不该跟着抖 */}
            <div className="flex shrink-0 items-center gap-2">
              <input
                value={draft}
                maxLength={MAX_NAME_LEN}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                }}
                aria-label={t('quick.players.nameInput')}
                className="min-h-14 min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 text-lg text-text outline-none focus:border-teal-400 short:min-h-11 short:text-base"
              />
              <ConfirmButton
                onConfirm={handleRemove}
                confirmText={t('common.confirmDelete')}
                className="min-w-28 shrink-0 !px-3"
              >
                <IconDelete className="size-5" aria-hidden />
                {t('common.delete')}
              </ConfirmButton>
            </div>

            <div className="flex min-h-0 flex-col gap-1.5 wide:flex-1">
              <span className="section-label shrink-0">{t('quick.players.colorLabel')}</span>
              {/* 色板一律实心：这里的格子就是"这个色长什么样"的样本，淡底档（-500/15）
                  在深底上偏色偏暗，选出来的色和棋子/胶囊对不上。
                  同色允许重复，只标出还有谁在用、不禁用 —— 所以格子里必须带色名，
                  选中态再叠 IconCheck + 加粗 + 外描边：颜色不能是唯一编码。
                  选中用 outline 而非 ring —— 个别实心色自带 ring-2 描边，
                  用 ring 会和它撞成"未选也有环"。
                  15 色排四列：行高下限锁 56px（矮屏 44），有余量就拉伸（横屏 820 高下一屏放完），
                  装不下时只在这个框里滚 —— 触控目标不许为了塞满而缩。
                  p-1 -m-1 是给选中格的 outline 留地方：overflow 沿 padding box 裁，
                  贴边那圈格子的描边会被切掉，负 margin 再把这 4px 抵回去，视觉位置不变 */}
              <div className="-m-1 grid auto-rows-[minmax(3.5rem,1fr)] grid-cols-4 gap-2 overflow-y-auto p-1 wide:min-h-0 wide:flex-1 short:auto-rows-[minmax(2.75rem,1fr)] short:gap-1.5">
                {PLAYER_COLORS.map((c) => {
                  const on = c.id === editing.color
                  const others = players.filter((p) => p.id !== editing.id && p.color === c.id)
                  const taken =
                    others.length > 1 ? `${others[0].name} +${others.length - 1}` : others[0]?.name
                  const label = t(c.labelKey)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setColor(editing.id, c.id)
                        buzz()
                      }}
                      aria-pressed={on}
                      aria-label={
                        taken ? t('quick.players.colorTaken', { color: label, who: taken }) : label
                      }
                      className={`btn-base flex-col gap-0 px-1 short:!min-h-11 ${PLAYER_SOLID[c.id]} ${
                        on ? 'font-bold outline-2 outline-offset-2 outline-text' : ''
                      }`}
                    >
                      <span className="flex items-center gap-1 text-base short:text-sm">
                        {on && <IconCheck className="size-4 shrink-0" aria-hidden />}
                        {label}
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
          <div className="flex min-h-32 flex-col items-center justify-center wide:min-h-0 wide:flex-1">
            <IconPlayers className="size-10 text-text-dim" aria-hidden />
          </div>
        )}
      </div>
    </div>
  )
}
