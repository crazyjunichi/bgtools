import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MAIN_PAD_TOOL } from '../../App'
import { ConfirmButton } from '../components/ConfirmButton'
import { FIELD } from '../components/fieldStyle'
import { buzz } from '../haptics'
import {
  IconArrowDown,
  IconArrowRight,
  IconCheck,
  IconDeal,
  IconDropdown,
  IconEraser,
  IconMinus,
  IconQr,
} from '../icons'
import { ACCENT_SOLID, ACCENT_TEXT, type DealAccent } from './accent'
import { matchesPreset, totalOf } from './deck'
import { useDealRolesStore } from './store'
import type { RoleCounts, RoleSet } from './types'

/** 少于两张就不是"发身份"了 */
const MIN_CARDS = 2

// 量名字用的共享画布：只调 measureText，从不上屏。100px 下量出的宽度除以 100 即 em 宽
let measureCtx: CanvasRenderingContext2D | null | undefined
function nameEm(text: string): number {
  if (measureCtx === undefined) {
    measureCtx = document.createElement('canvas').getContext('2d')
    if (measureCtx) measureCtx.font = `100px ${getComputedStyle(document.body).fontFamily}`
  }
  // 拿不到画布时按全 CJK 估，宁可缩过头不可截断；实量的乘一点安全边距（fallback 字体链有细微差异）
  return measureCtx ? (measureCtx.measureText(text).width / 100) * 1.05 : text.length
}

/*
 * 池子的行列模板，按"这局有几种身份"查表：行列都给死，grid 才能把卡双向拉伸填满池区，
 * 卡片尺寸完全跟着容器走（竖屏少列、横屏多列）。类名必须是全字面量，Tailwind 编译期扫不到拼接。
 * 超过 9 种的落到 9 那档，多出来的行按内容高自己滚 —— 现有身份集最多 9 种，够用。
 */
const POOL_GRID: Record<number, string> = {
  1: 'grid-cols-1 grid-rows-1 wide:grid-cols-1 wide:grid-rows-1',
  2: 'grid-cols-2 grid-rows-1 wide:grid-cols-2 wide:grid-rows-1',
  3: 'grid-cols-2 grid-rows-2 wide:grid-cols-3 wide:grid-rows-1',
  4: 'grid-cols-2 grid-rows-2 wide:grid-cols-4 wide:grid-rows-1',
  5: 'grid-cols-3 grid-rows-2 wide:grid-cols-4 wide:grid-rows-2',
  6: 'grid-cols-3 grid-rows-2 wide:grid-cols-4 wide:grid-rows-2',
  7: 'grid-cols-3 grid-rows-3 wide:grid-cols-4 wide:grid-rows-2',
  8: 'grid-cols-3 grid-rows-3 wide:grid-cols-4 wide:grid-rows-2',
  9: 'grid-cols-3 grid-rows-3 wide:grid-cols-4 wide:grid-rows-3',
}

type Props = {
  set: RoleSet
  counts: RoleCounts
  accent: DealAccent
  /** 轮传发牌：一台设备沿桌传 */
  onStart: () => void
  /** 扫码发牌：各人用自己手机扫码领牌 */
  onStartOnline: () => void
}

/**
 * 发身份前的配比面板：一侧选（预设下拉 + 可选身份），另一侧看这局有谁（页面主体）。
 *
 * 配比不用一排 ± 步进器，而是**左边点着加、右边点着减**：这里真正要确认的东西是
 * "这一局到底几个人、都有谁"，一堆数字读不出这件事。
 *
 * - 预设是一整组配比的替换（不是逐项开关），选中即整组套用，所以收到一个下拉里
 * - 可选身份卡不显示已加数量，只用箭头指「加进去的方向」—— 朝向跟着布局轴走：
 *   横屏池子在右箭头向右，竖屏池子在下箭头向下
 * - 「这局的身份」是页面主体，吃掉全部余量；人数与清空都收在它的标题行
 */
export function DealSetup({ set, counts, accent, onStart, onStartOnline }: Props) {
  const { t } = useTranslation()
  const { setCount, applyPreset, clear } = useDealRolesStore()
  const total = totalOf(counts)
  // 只出张数 > 0 的身份，按 set.roles 的顺序 —— 池子读的是"这局有谁"
  const shown = set.roles.filter((r) => (counts[r.id] ?? 0) > 0)

  // 本局最长名字的 em 宽：窄卡时名字字号上限按它反推。随渲染直算，量 ≤9 个短串开销可忽略
  const maxEm = Math.max(1, ...shown.map((r) => nameEm(t(r.nameKey))))

  // 当前配比命中的预设。手动加减过就可能谁都不匹配，下拉回落到「自定义」占位
  const matched = set.presets.findIndex((p) => matchesPreset(set, counts, p))
  const [open, setOpen] = useState(false)

  // 展开期间 Esc 收起，与遮罩点击同一条出口
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const apply = (i: number) => {
    applyPreset(set.id, { ...set.presets[i].counts })
    setOpen(false)
    buzz(20)
  }

  const add = (roleId: string) => {
    setCount(set.id, roleId, (counts[roleId] ?? 0) + 1)
    buzz()
  }

  const drop = (roleId: string) => {
    setCount(set.id, roleId, (counts[roleId] ?? 0) - 1)
    buzz()
  }

  // 铺满内容区的整页而非弹窗：信息量本来就是整页级的。退出走顶栏返回（DealRoles 注册的接管）
  return (
    <div
      className={`absolute inset-0 z-10 flex flex-col gap-3 bg-canvas wide:flex-row short:gap-2 ${MAIN_PAD_TOOL}`}
    >
      {/* 控制区：竖屏在上、横屏成左栏。横屏下宽度是主轴，定宽才不会被右边的池子挤变形 */}
      <div className="flex shrink-0 flex-col gap-2 wide:min-h-0 wide:w-72">
        <div className="flex shrink-0 flex-col gap-1.5">
          <span className="section-label">{t('dealRoles.preset')}</span>
          {/*
           * 自绘下拉而非原生 select：深色主题下原生展开层是系统渲染的白底浅字，不可控。
           * 遮罩关闭走 onClick（自消失元素不许用 onPointerDown，抬手补发的 click 会穿透）。
           */}
          <div className="relative">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label={t('dealRoles.preset')}
              onClick={() => {
                setOpen((v) => !v)
                buzz()
              }}
              className={`${FIELD} flex items-center justify-between gap-2 pr-2`}
            >
              <span className={matched < 0 ? 'text-text-dim' : undefined}>
                {matched < 0
                  ? t('dealRoles.custom')
                  : t('dealRoles.presetN', { n: set.presets[matched].n })}
              </span>
              <IconDropdown
                className={`size-5 shrink-0 text-text-dim transition-transform duration-75 ${open ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {open && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} aria-hidden />
                <ul
                  role="listbox"
                  aria-label={t('dealRoles.preset')}
                  className="absolute inset-x-0 top-full z-30 mt-1 max-h-[22rem] overflow-y-auto rounded-xl border border-line bg-surface-2 py-1"
                >
                  {set.presets.map((p, i) => {
                    const on = i === matched
                    return (
                      <li key={p.n} role="option" aria-selected={on}>
                        {/* 选中态不只靠颜色：另有一枚 ✓（多态控件至少两种编码） */}
                        <button
                          type="button"
                          onClick={() => apply(i)}
                          className={`flex min-h-12 w-full items-center justify-between gap-2 px-3 text-base short:min-h-11 short:text-sm ${
                            on ? ACCENT_TEXT[accent] : 'text-text'
                          }`}
                        >
                          {t('dealRoles.presetN', { n: p.n })}
                          {on && <IconCheck className="size-5 shrink-0" aria-hidden />}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>
        </div>

        <span className="section-label shrink-0">{t('dealRoles.pick')}</span>
        {/*
         * 竖屏两列横排：三列时按钮内名字会被 truncate（图标 + 箭头占掉一半宽）。
         * 横屏是左栏的竖列表，吃掉左栏余量、装不下自己滚。
         */}
        <div className="grid shrink-0 grid-cols-2 gap-2 wide:min-h-0 wide:flex-1 wide:grid-cols-1 wide:content-start wide:overflow-y-auto short:gap-1.5">
          {set.roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => add(r.id)}
              aria-label={t('dealRoles.addRole', { name: t(r.nameKey) })}
              className="btn-base !min-h-12 justify-start gap-2 border border-line bg-surface-2 px-3 text-base text-text-muted short:!min-h-11 short:text-sm"
            >
              <span className="shrink-0 text-xl leading-none short:text-base" aria-hidden>
                {r.icon}
              </span>
              {/* min-w-0 是 truncate 的前提：flex 子项默认不收缩到内容以下 */}
              <span className="min-w-0 truncate">{t(r.nameKey)}</span>
              {/* 箭头只指方向不带数量：已加几张去右边的池子看 */}
              <IconArrowDown
                className={`ml-auto size-5 shrink-0 wide:hidden ${ACCENT_TEXT[accent]}`}
                aria-hidden
              />
              <IconArrowRight
                className={`ml-auto hidden size-5 shrink-0 wide:block ${ACCENT_TEXT[accent]}`}
                aria-hidden
              />
            </button>
          ))}
        </div>
      </div>

      {/* 这局的身份：页面主体，吃掉全部余量 */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 wide:min-w-0">
        <div className="flex shrink-0 items-center gap-3">
          <span className="section-label">{t('dealRoles.pool')}</span>
          {/* leading-none 是为了在放大字号的同时不撑高这一行 */}
          <span
            className={`font-mono text-xl font-bold leading-none tabular-nums ${ACCENT_TEXT[accent]}`}
          >
            {t('dealRoles.total', { n: total })}
          </span>
          {/*
           * 清空收在标题行：池子是主体，底部不再为它单列一行。
           * 只加边框不换底色：ConfirmButton 武装后要靠自己的红底示警，覆盖 bg 会把示警盖掉。
           */}
          {total > 0 && (
            <ConfirmButton
              onConfirm={() => clear(set.id)}
              className="ml-auto !min-h-11 border border-line !px-3 !text-sm"
            >
              <IconEraser className="size-4" aria-hidden />
              {t('common.clear')}
            </ConfirmButton>
          )}
        </div>

        {/* 卡双向拉伸填满池区：不设定卡片自身的宽高，尺寸全由 POOL_GRID 的行列模板给 */}
        <div
          className={`grid min-h-0 flex-1 gap-3 overflow-y-auto short:gap-2 ${POOL_GRID[Math.max(1, Math.min(shown.length, 9))]}`}
        >
          {total === 0 ? (
            <span className="col-span-full text-center text-sm leading-relaxed text-text-muted">
              {t('dealRoles.emptyPool')}
            </span>
          ) : (
            // 只出张数 > 0 的身份，按 set.roles 的顺序 —— 池子读的是"这局有谁"
            shown.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => drop(r.id)}
                aria-label={t('dealRoles.removeRole', { name: t(r.nameKey) })}
                className="btn-base relative w-full flex-col gap-3 rounded-2xl bg-surface-3 p-3 text-text [container-type:size] short:gap-1.5 short:p-2"
              >
                {/* 减号压右上角（徽标位），而非 ✕：✕ 会被读成"把这个身份整种去掉" */}
                <IconMinus className="absolute top-2 right-2 size-5 text-text-dim" aria-hidden />
                {/*
                 * 三行内容的字号全部跟卡高走（cqh，容器查询单位）：卡高由行列模板定、
                 * 横屏矮卡里视口单位会把名字挤没，truncate 的 overflow:hidden 会让它缩成一条缝。
                 */}
                <span className="text-[26cqh] leading-none" aria-hidden>
                  {r.icon}
                </span>
                <span
                  className="max-w-full truncate leading-none"
                  style={{ fontSize: `min(16cqh, calc((100cqw - 24px) / ${maxEm.toFixed(2)}))` }}
                >
                  {t(r.nameKey)}
                </span>
                {/* 张数是池子里唯一要读的数，压过身份名一档 */}
                <span
                  className={`font-mono text-[22cqh] leading-none font-bold tabular-nums ${ACCENT_TEXT[accent]}`}
                >
                  ×{counts[r.id]}
                </span>
              </button>
            ))
          )}
        </div>

        {/*
         * 开始跟在池子下方而不是通栏：终结动作紧接着"这局有谁"这个结论最顺。
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

        {/*
         * 扫码另起一行、且明显次一档：轮传零配置、不用网络，仍是默认那条路。
         * 两个按钮横排会让主按钮被挤短，而它的文案带张数，压不得。
         */}
        <button
          type="button"
          disabled={total < MIN_CARDS}
          onClick={() => {
            onStartOnline()
            buzz(20)
          }}
          className="btn-quiet shrink-0 gap-2 !text-base short:!min-h-11 short:!text-sm"
        >
          <IconQr className="size-5 short:size-4" aria-hidden />
          {t('dealRoles.online.start')}
        </button>
      </div>
    </div>
  )
}
