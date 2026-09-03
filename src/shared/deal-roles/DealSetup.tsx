import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../components/ConfirmButton'
import { Overlay } from '../components/Overlay'
import { buzz } from '../haptics'
import { IconDeal, IconEraser, IconMinus } from '../icons'
import { ACCENT_SOFT, ACCENT_SOLID, ACCENT_TEXT, type DealAccent } from './accent'
import { matchesPreset, totalOf } from './deck'
import { useDealRolesStore } from './store'
import type { RoleCounts, RoleSet } from './types'

/** 少于两张就不是"发身份"了 */
const MIN_CARDS = 2

type Props = {
  set: RoleSet
  counts: RoleCounts
  accent: DealAccent
  onStart: () => void
  onClose: () => void
}

/**
 * 发身份前的配比面板。
 *
 * 配比不用一排 ± 步进器，而是**左边点着加、右边点着减**：这里真正要确认的东西是
 * "这一局到底几个人、都有谁"，一堆数字读不出这件事。
 *
 * 排布分两种，判据是**文本长度有没有封顶**，不是块的角色：
 * - 左边两列（常见板子 / 可选身份）走**竖列表**。引擎是给各款游戏复用的，板子名将来会是
 *   整句（"屠边板 12 人"这类），档数也由各游戏的数据决定 —— 网格必然截断或撑破，
 *   所以宁可让它在自己的框里滚
 * - 右列（身份池）走**网格**。每格只有"身份名 ×N"，长度封顶、格数不超过身份种数，
 *   横着排省下来的高度正好留给左边那两个列表
 */
export function DealSetup({ set, counts, accent, onStart, onClose }: Props) {
  const { t } = useTranslation()
  const { setCount, applyPreset, clear } = useDealRolesStore()
  const total = totalOf(counts)

  const add = (roleId: string) => {
    setCount(set.id, roleId, (counts[roleId] ?? 0) + 1)
    buzz()
  }

  const drop = (roleId: string) => {
    setCount(set.id, roleId, (counts[roleId] ?? 0) - 1)
    buzz()
  }

  return (
    <Overlay
      maxWidth="max-w-4xl"
      onClose={onClose}
      title={
        <span className="flex items-center gap-2 text-lg font-bold">
          <IconDeal className="size-5 shrink-0" aria-hidden />
          {t('dealRoles.title')}
        </span>
      }
    >
      {/*
       * 高度显式给：Overlay 的面板高度由内容决定，内层 flex-1 没有锚点会塌缩。
       * 只受高度约束，所以用 vh 而非 vmin（换 vmin 竖屏会取宽度、把面板压矮）。
       */}
      <div className="flex h-[min(48rem,76vh)] flex-col gap-3 wide:flex-row short:h-[min(48rem,72vh)] short:gap-2">
        {/*
         * 这两列**不分横竖屏都并排**：都是竖列表，并排后高度取较高者而不是相加，
         * 条目再多也不用滚；竖屏 820 宽也塞得下两个窄列。
         * 横屏下宽度是主轴，整组固定住才不会被右边的网格挤扁。
         */}
        <div className="flex min-h-0 flex-1 gap-3 wide:w-[26rem] wide:flex-none short:gap-2">
          <section className="flex min-h-0 flex-1 flex-col gap-1.5">
            <span className="section-label shrink-0">{t('dealRoles.preset')}</span>
            <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
              {set.presets.map((p) => {
                const on = matchesPreset(set, counts, p)
                return (
                  <button
                    key={p.n}
                    type="button"
                    onClick={() => {
                      applyPreset(set.id, { ...p.counts })
                      buzz(20)
                    }}
                    aria-pressed={on}
                    className={`btn-base !min-h-12 shrink-0 justify-start truncate px-3 text-base short:!min-h-11 short:text-sm ${
                      on ? ACCENT_SOLID[accent] : 'bg-surface-2 text-text-muted'
                    }`}
                  >
                    {t('dealRoles.presetN', { n: p.n })}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="flex min-h-0 flex-1 flex-col gap-1.5">
            <span className="section-label shrink-0">{t('dealRoles.pick')}</span>
            <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
              {set.roles.map((r) => {
                const n = counts[r.id] ?? 0
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => add(r.id)}
                    aria-label={t('dealRoles.addRole', { name: t(r.nameKey) })}
                    className={`btn-base !min-h-12 shrink-0 justify-start gap-2 border px-3 text-base short:!min-h-11 short:text-sm ${
                      n > 0 ? ACCENT_SOFT[accent] : 'border-line bg-surface-2 text-text-muted'
                    }`}
                  >
                    <span className="shrink-0 text-xl leading-none short:text-base" aria-hidden>
                      {r.icon}
                    </span>
                    {/* min-w-0 是 truncate 的前提：flex 子项默认不收缩到内容以下 */}
                    <span className="min-w-0 truncate">{t(r.nameKey)}</span>
                    {/* 数字是这里唯一的状态编码，淡底色只是陪衬 */}
                    {n > 0 && (
                      <span
                        className={`ml-auto shrink-0 font-mono text-sm tabular-nums ${ACCENT_TEXT[accent]}`}
                      >
                        ×{n}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        {/*
         * 竖屏下这一列**先按内容取高、不参与分配**（横屏才 flex-1 填满）：池子是这个面板的
         * 结论，要优先整块看完；余量归左边那两个列表，它们本来就带滚动。
         */}
        <div className="flex min-h-0 flex-none flex-col gap-1.5 wide:flex-1">
          {/* 三列的标题行都只放纯文字：这里塞进一个按钮就会把它撑高，右列的框跟左两列对不齐 */}
          <span className="section-label shrink-0 truncate">
            {t('dealRoles.pool')}{' '}
            {/* leading-none 是为了在放大字号的同时不撑高这一行 —— 撑了右列的框就跟左两列错位 */}
            <span
              className={`font-mono text-xl font-bold leading-none tabular-nums ${ACCENT_TEXT[accent]}`}
            >
              {t('dealRoles.total', { n: total })}
            </span>
          </span>

          {/*
           * auto-rows-min：行高交给内容，不然格子会被拉去填满整个滚动区。
           * 竖屏靠内容撑高（身份种类多到超过上限才在自己框里滚），横屏则铺满这一列。
           */}
          <div className="grid min-h-0 max-h-[40vh] auto-rows-min grid-cols-2 gap-2 overflow-y-auto rounded-2xl border border-line bg-surface-2 p-3 wide:max-h-none wide:flex-1 short:gap-1.5 short:p-2">
            {total === 0 ? (
              <span className="col-span-full text-sm leading-relaxed text-text-muted">
                {t('dealRoles.emptyPool')}
              </span>
            ) : (
              // 只出张数 > 0 的身份，按 set.roles 的顺序 —— 池子读的是"这局有谁"
              set.roles
                .filter((r) => (counts[r.id] ?? 0) > 0)
                .map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => drop(r.id)}
                    aria-label={t('dealRoles.removeRole', { name: t(r.nameKey) })}
                    className="btn-base !min-h-12 justify-start gap-2 bg-surface-3 px-3 text-sm text-text short:!min-h-11"
                  >
                    <span className="shrink-0 text-base leading-none" aria-hidden>
                      {r.icon}
                    </span>
                    {/* 名字吃掉弹性宽度，张数才会在所有格子里对齐成一列 */}
                    <span className="min-w-0 flex-1 truncate text-left">{t(r.nameKey)}</span>
                    {/* 张数是池子里唯一要读的数，压过身份名一档 */}
                    <span
                      className={`shrink-0 font-mono text-xl font-bold tabular-nums ${ACCENT_TEXT[accent]} short:text-lg`}
                    >
                      ×{counts[r.id]}
                    </span>
                    {/* 减号而非 ✕：✕ 会被读成"把这个身份整种去掉" */}
                    <IconMinus className="size-4 shrink-0 text-text-dim" aria-hidden />
                  </button>
                ))
            )}

            {/*
             * 清空跟在池子末尾，但**独占一整行**：与"减一张"的格子只差一格距离，
             * 而两者量级差着一个数量级 —— 靠形状分开，别让它长成第 N 个身份格。
             * 只加边框不换底色：ConfirmButton 武装后要靠自己的红底示警，
             * 这里覆盖 bg 会把那层示警一起盖掉。
             */}
            {total > 0 && (
              <ConfirmButton
                onConfirm={() => clear(set.id)}
                className="col-span-full !min-h-12 border border-line !text-sm short:!min-h-11"
              >
                <IconEraser className="size-4" aria-hidden />
                {t('common.clear')}
              </ConfirmButton>
            )}
          </div>

          {/*
           * 开始跟在池子下方而不是通栏：终结动作紧接着"这局有谁"这个结论最顺，
           * 也把整条通栏的高度让给左边那两个列表。
           * 张数不够时不另起一行提示，直接把原因写进禁用态的按钮文案。
           */}
          <button
            type="button"
            disabled={total < MIN_CARDS}
            onClick={() => {
              onStart()
              buzz(20)
            }}
            className={`btn-base min-h-16 shrink-0 gap-2 text-xl font-bold short:!min-h-12 short:text-base ${ACCENT_SOLID[accent]}`}
          >
            <IconDeal className="size-6 short:size-5" aria-hidden />
            {total < MIN_CARDS ? t('dealRoles.tooFew') : t('dealRoles.start', { n: total })}
          </button>
        </div>
      </div>
    </Overlay>
  )
}
