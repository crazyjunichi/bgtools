import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { quickTools, type QuickAccent } from '../quick/registry'
import {
  IconFullscreen,
  IconLogo,
  IconPlayers,
  IconSettings,
  type LucideIcon,
} from '../shared/icons'
import { tools } from '../tools/registry'
import { scoreSheetMeta } from '../tools/score-sheet/meta'
import { BLANK_ID, TEMPLATES, templateIdentity } from '../tools/score-sheet/templates'
import type { ToolMeta } from '../tools/types'

/*
 * ⚠️ 临时风格样板间，**选定方案后连同 main.tsx 里那行路由一起删**。
 * 同一批真实数据 + 同一套标本（首页宫格 + 部件样本区），只换视觉皮肤。
 * 刻意不接 i18n：皮肤名、标本文案都是临时硬编码，不往 locale 真源里塞临时 key。
 * 皮肤 = 一张 Skin 配置表，渲染器只有一套，新增方向只加表不改渲染器。
 */

type Accent = ToolMeta['accent'] | QuickAccent

type Row = {
  key: string
  name: string
  desc: string
  accent: Accent
  /** 内容标识兜底 emoji */
  icon: string
  /** quick 工具用 lucide 字形，与工具卡的盒图槽同尺寸 */
  Glyph?: LucideIcon
  cover?: string
  /** 计分纸模板入口的第二编码 */
  badge?: string
}

const QUICK = quickTools.filter((tool) => tool.onHome)
const GENERAL = tools.filter((tool) => tool.category === 'general')
const GAME = tools.filter((tool) => tool.category === 'game')
/** 样板间只要够铺满两行就够判断，不必把全部模板画一遍 */
const SHEETS = TEMPLATES.filter((tpl) => tpl.id !== BLANK_ID).slice(0, 6)

function useRows() {
  const { t } = useTranslation()
  const quick: Row[] = QUICK.map((tool) => ({
    key: `q-${tool.id}`,
    name: t(tool.nameKey),
    desc: t(tool.descKey),
    accent: tool.accent,
    icon: '·',
    Glyph: tool.icon,
  }))
  const general: Row[] = GENERAL.map((tool) => ({
    key: `g-${tool.id}`,
    name: t(tool.nameKey),
    desc: t(tool.descKey),
    accent: tool.accent,
    icon: tool.icon,
    cover: tool.cover,
  }))
  const game: Row[] = [
    ...GAME.map((tool) => ({
      key: `t-${tool.id}`,
      name: t(tool.nameKey),
      desc: t(tool.descKey),
      accent: tool.accent,
      icon: tool.icon,
      cover: tool.cover,
    })),
    ...SHEETS.map((tpl) => {
      const game = templateIdentity(tpl)
      return {
        key: `s-${tpl.id}`,
        name: t(game.nameKey),
        desc: t('home.sheetDesc', { n: tpl.entries.length }),
        accent: scoreSheetMeta.accent,
        icon: game.icon,
        cover: game.cover,
        badge: scoreSheetMeta.icon,
      }
    }),
  ]
  return { quick, general, game }
}

/** 图/字形槽。槽自身的形状由皮肤给，内容三态（字形 / 盒图 / emoji）统一 */
function Slot({ row, className }: { row: Row; className: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className={`flex size-12 shrink-0 items-center justify-center ${className}`}>
      {row.Glyph ? (
        <row.Glyph className="size-7" aria-hidden />
      ) : row.cover && !failed ? (
        <img
          src={`${import.meta.env.BASE_URL}${row.cover}`}
          alt=""
          loading="lazy"
          className="size-10 rounded-md object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-3xl">{row.icon}</span>
      )}
    </span>
  )
}

const GRID = 'grid grid-cols-2 gap-3 wide:grid-cols-3'

/* ══════════════ 共用 accent 映射 ══════════════ */

const SOLID: Record<Accent, string> = {
  amber: 'bg-amber-400 text-ink',
  emerald: 'bg-emerald-400 text-ink',
  sky: 'bg-sky-400 text-ink',
  violet: 'bg-violet-400 text-ink',
  rose: 'bg-rose-400 text-ink',
  teal: 'bg-teal-400 text-ink',
  fuchsia: 'bg-fuchsia-400 text-ink',
  indigo: 'bg-indigo-400 text-ink',
  cyan: 'bg-cyan-400 text-ink',
  neutral: 'bg-surface-3 text-text',
}

const BAR: Record<Accent, string> = {
  amber: 'bg-amber-400',
  emerald: 'bg-emerald-400',
  sky: 'bg-sky-400',
  violet: 'bg-violet-400',
  rose: 'bg-rose-400',
  teal: 'bg-teal-400',
  fuchsia: 'bg-fuchsia-400',
  indigo: 'bg-indigo-400',
  cyan: 'bg-cyan-400',
  neutral: 'bg-surface-3',
}

const HARD: Record<Accent, { edge: string; block: string; shadow: string; press: string }> = {
  amber: {
    edge: 'border-amber-400',
    block: 'bg-amber-400 text-ink',
    shadow: 'shadow-[5px_5px_0_0_var(--color-amber-500,#f59e0b)]',
    press: 'active:shadow-[2px_2px_0_0_var(--color-amber-500,#f59e0b)]',
  },
  emerald: {
    edge: 'border-emerald-400',
    block: 'bg-emerald-400 text-ink',
    shadow: 'shadow-[5px_5px_0_0_var(--color-emerald-500,#10b981)]',
    press: 'active:shadow-[2px_2px_0_0_var(--color-emerald-500,#10b981)]',
  },
  sky: {
    edge: 'border-sky-400',
    block: 'bg-sky-400 text-ink',
    shadow: 'shadow-[5px_5px_0_0_var(--color-sky-500,#0ea5e9)]',
    press: 'active:shadow-[2px_2px_0_0_var(--color-sky-500,#0ea5e9)]',
  },
  violet: {
    edge: 'border-violet-400',
    block: 'bg-violet-400 text-ink',
    shadow: 'shadow-[5px_5px_0_0_var(--color-violet-500,#8b5cf6)]',
    press: 'active:shadow-[2px_2px_0_0_var(--color-violet-500,#8b5cf6)]',
  },
  rose: {
    edge: 'border-rose-400',
    block: 'bg-rose-400 text-ink',
    shadow: 'shadow-[5px_5px_0_0_var(--color-rose-500,#f43f5e)]',
    press: 'active:shadow-[2px_2px_0_0_var(--color-rose-500,#f43f5e)]',
  },
  teal: {
    edge: 'border-teal-400',
    block: 'bg-teal-400 text-ink',
    shadow: 'shadow-[5px_5px_0_0_var(--color-teal-500,#14b8a6)]',
    press: 'active:shadow-[2px_2px_0_0_var(--color-teal-500,#14b8a6)]',
  },
  fuchsia: {
    edge: 'border-fuchsia-400',
    block: 'bg-fuchsia-400 text-ink',
    shadow: 'shadow-[5px_5px_0_0_var(--color-fuchsia-500,#d946ef)]',
    press: 'active:shadow-[2px_2px_0_0_var(--color-fuchsia-500,#d946ef)]',
  },
  indigo: {
    edge: 'border-indigo-400',
    block: 'bg-indigo-400 text-ink',
    shadow: 'shadow-[5px_5px_0_0_var(--color-indigo-500,#6366f1)]',
    press: 'active:shadow-[2px_2px_0_0_var(--color-indigo-500,#6366f1)]',
  },
  cyan: {
    edge: 'border-cyan-400',
    block: 'bg-cyan-400 text-ink',
    shadow: 'shadow-[5px_5px_0_0_var(--color-cyan-500,#06b6d4)]',
    press: 'active:shadow-[2px_2px_0_0_var(--color-cyan-500,#06b6d4)]',
  },
  neutral: {
    edge: 'border-line',
    block: 'bg-surface-3 text-text',
    shadow: 'shadow-[5px_5px_0_0_var(--color-line,#454a4f)]',
    press: 'active:shadow-[2px_2px_0_0_var(--color-line,#454a4f)]',
  },
}

const UNDER: Record<Accent, string> = {
  amber: 'border-amber-400',
  emerald: 'border-emerald-400',
  sky: 'border-sky-400',
  violet: 'border-violet-400',
  rose: 'border-rose-400',
  teal: 'border-teal-400',
  fuchsia: 'border-fuchsia-400',
  indigo: 'border-indigo-400',
  cyan: 'border-cyan-400',
  neutral: 'border-line',
}

/* ══════════════ Skin 配置类型 ══════════════ */

type Skin = {
  id: string
  label: string
  /** 外层容器追加类与变量覆盖 */
  wrap?: string
  wrapStyle?: CSSProperties
  header: string
  logo: string
  title: string
  titleStyle?: CSSProperties
  chip: string
  /** 分区外壳（PRINT 的分区色带用），index 是分区序号 */
  secWrap?: (index: number) => string
  secTitle: (title: string, index: number) => ReactNode
  card: (a: Accent) => string
  slot: (a: Accent) => string
  name: string
  nameStyle?: CSSProperties
  desc: string
  /** 卡内装饰层：内框 / 色条，留空即不出 */
  frame?: string
  bar?: (a: Accent) => string
  /** 数据面板（合计 + 步进） */
  panel: string
  panelFrame?: string
  panelBar?: string
  num: string
  numStyle?: CSSProperties
  /** 步进钮（只要颜色/形状，尺寸由渲染器给） */
  step: string
  primary: string
  quiet: string
  danger: string
  row: string
  rowHi?: string
  seg: string
  segOn: string
  field: string
}

/* ══════════════ 十个皮肤 ══════════════ */

const CENTER_RULE = (cls: string) =>
  function CenteredTitle(title: string) {
    return (
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-line" aria-hidden />
        <h2 className={cls}>{title}</h2>
        <span className="h-px flex-1 bg-line" aria-hidden />
      </div>
    )
  }

const BTN_ROW = 'btn-base gap-2 px-5 text-base'
const STEP_BASE = 'btn-base size-14 text-2xl'

const SKINS: Skin[] = [
  /* ── A 实心色块墙 ── */
  {
    id: 'solid',
    label: 'A · SOLID',
    header: 'flex h-14 items-center gap-3',
    logo: 'flex size-10 items-center justify-center rounded-xl bg-text text-ink',
    title: 'flex-1 text-xl font-black tracking-wide',
    chip: 'flex size-11 items-center justify-center rounded-xl bg-surface-2 text-text',
    secTitle: (title) => (
      <div className="flex items-center gap-3">
        <span className="h-7 w-2 rounded-full bg-text" aria-hidden />
        <h2 className="text-lg font-black tracking-wide text-text">{title}</h2>
      </div>
    ),
    card: (a) => `rounded-2xl active:scale-95 ${SOLID[a]}`,
    slot: () => 'rounded-xl bg-canvas/15',
    name: 'truncate text-base font-bold',
    desc: 'truncate text-xs opacity-70',
    panel: 'flex flex-col items-center gap-3 rounded-2xl bg-surface-3 py-6',
    num: 'text-data font-bold leading-none',
    step: 'rounded-2xl bg-canvas/30 text-text',
    primary: `rounded-2xl ${SOLID.sky}`,
    quiet: 'rounded-2xl bg-surface-2 text-text',
    danger: 'rounded-2xl bg-rose-600 font-bold text-white',
    row: 'flex items-center gap-3 rounded-2xl bg-surface px-3 py-2.5',
    rowHi: 'bg-surface-2',
    seg: 'rounded-2xl bg-surface-2 text-text-muted',
    segOn: SOLID.sky,
    field:
      'w-full border-b-2 border-line bg-transparent py-2 text-base text-text outline-none',
  },

  /* ── B 卡牌桌 ── */
  {
    id: 'deck',
    label: 'B · DECK',
    wrap: '-mx-4 -my-3 px-4 py-3',
    wrapStyle: {
      backgroundImage:
        'repeating-linear-gradient(45deg, rgba(255,255,255,.022) 0 3px, transparent 3px 6px)',
    },
    header: '-mx-4 flex h-14 items-center gap-3 border-b border-line bg-surface px-4',
    logo: 'flex items-center justify-center text-text',
    title: 'flex-1 text-base font-semibold uppercase tracking-[0.2em]',
    chip: 'flex size-11 items-center justify-center text-text-muted',
    secTitle: (title) => (
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
          {title}
        </h2>
        <span className="h-px flex-1 bg-line" aria-hidden />
      </div>
    ),
    card: () =>
      'overflow-hidden rounded-xl border border-line bg-surface pl-5 active:scale-95',
    slot: () => 'rounded-lg bg-surface-2',
    name: 'truncate text-base font-semibold text-text',
    desc: 'truncate text-xs text-text-muted',
    bar: (a) => `absolute inset-y-0 left-0 w-2 ${BAR[a]}`,
    panel:
      'relative overflow-hidden flex flex-col items-center gap-3 rounded-xl border border-line bg-surface py-6',
    panelBar: `absolute inset-y-0 left-0 w-2 ${BAR.sky}`,
    num: 'text-data font-bold leading-none text-text',
    step: 'rounded-xl bg-surface-2 text-text',
    primary: 'bg-sky-400 text-ink',
    quiet: 'bg-surface-2 text-text',
    danger: 'bg-rose-600 font-bold text-white',
    row: 'flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5',
    rowHi: 'bg-surface-2',
    seg: 'rounded-xl bg-surface-2 text-text-muted',
    segOn: 'rounded-xl bg-sky-400 text-ink',
    field: 'w-full border-b-2 border-line bg-transparent py-2 text-base text-text outline-none',
  },

  /* ── C 粗野主义 ── */
  {
    id: 'brutal',
    label: 'C · BRUTAL',
    header: '-mx-4 flex h-14 items-center gap-3 border-b-2 border-line px-4',
    logo: 'flex size-10 items-center justify-center rounded-md border-2 border-text bg-text text-ink',
    title: 'flex-1 text-xl font-black uppercase tracking-tight',
    chip: 'flex size-11 items-center justify-center rounded-md border-2 border-line text-text',
    secTitle: (title) => (
      <div className="flex items-center gap-2">
        <span className="size-3 bg-text" aria-hidden />
        <h2 className="text-lg font-black uppercase tracking-tight text-text">{title}</h2>
      </div>
    ),
    // 按下时整卡贴向阴影：实体按键的位移感，比 scale 更像按下去
    card: (a) =>
      `rounded-lg border-2 bg-surface ${HARD[a].edge} ${HARD[a].shadow} ${HARD[a].press} active:translate-x-[3px] active:translate-y-[3px]`,
    slot: (a) => `rounded-md ${HARD[a].block}`,
    name: 'truncate text-base font-black text-text',
    desc: 'truncate text-xs text-text-muted',
    panel: `flex flex-col items-center gap-3 rounded-lg border-2 bg-surface py-6 ${HARD.sky.edge} ${HARD.sky.shadow}`,
    num: 'text-data font-black leading-none text-text',
    step: `rounded-md border-2 bg-surface ${HARD.neutral.edge} ${HARD.neutral.shadow} text-text`,
    primary: `rounded-md border-2 ${HARD.sky.edge} ${HARD.sky.block} ${HARD.sky.shadow} ${HARD.sky.press} active:translate-x-[2px] active:translate-y-[2px]`,
    quiet: `rounded-md border-2 border-line bg-surface text-text ${HARD.neutral.shadow}`,
    danger: `rounded-md border-2 border-rose-600 bg-rose-600 font-bold text-white ${HARD.rose.shadow}`,
    row: 'flex items-center gap-3 rounded-md border-2 border-line bg-surface px-3 py-2.5',
    rowHi: HARD.neutral.shadow,
    seg: `rounded-md border-2 border-line bg-surface text-text-muted`,
    segOn: `rounded-md border-2 ${HARD.sky.edge} ${HARD.sky.block}`,
    field:
      'w-full rounded-md border-2 border-line bg-surface px-3 py-2 text-base text-text outline-none',
  },

  /* ── D 复古印刷海报 ── */
  {
    id: 'print',
    label: 'D · PRINT',
    header: '-mx-4 mb-2 flex h-14 items-center gap-3 border-b-2 border-text px-4',
    logo: 'flex items-center justify-center text-text',
    title: 'flex-1 text-base font-bold tracking-[0.3em]',
    chip: 'flex size-11 items-center justify-center text-text-muted',
    /* 卡片没有描边，分界全靠区块底色 —— 区底与槽底必须差两档 */
    secWrap: (i) =>
      ['-mx-4 px-4 py-4 bg-surface-2', '-mx-4 px-4 py-4 bg-surface', '-mx-4 px-4 py-4'][i % 3] ??
      '',
    secTitle: CENTER_RULE('text-sm font-bold tracking-[0.35em] text-text'),
    card: (a) => `active:scale-95 border-b-2 ${UNDER[a]}`,
    slot: () => 'rounded-md bg-surface-2',
    name: 'truncate text-base font-bold tracking-wide text-text',
    desc: 'truncate text-xs text-text-muted',
    panel: 'flex flex-col items-center gap-3 border-y-2 border-text py-6',
    num: 'text-data font-bold leading-none text-text',
    step: 'rounded-none border-2 border-line text-text',
    primary: 'rounded-none bg-text font-bold tracking-widest text-ink',
    quiet: 'rounded-none border-2 border-line text-text',
    danger: 'rounded-none bg-rose-600 font-bold text-white',
    row: 'flex items-center gap-3 border-b border-line px-1 py-3',
    seg: 'rounded-none border border-line text-text-muted',
    segOn: 'rounded-none bg-text text-ink',
    field: 'w-full border-b-2 border-text bg-transparent py-2 text-base text-text outline-none',
  },

  /* ── E 字体性格：现状皮肤 + display 字体（拉丁/数字），中文仍系统字 ── */
  {
    id: 'type',
    label: 'E · TYPE',
    header: '-mx-4 flex h-14 items-center gap-3 border-b border-line px-4',
    logo: 'flex items-center justify-center text-text',
    title: 'flex-1 text-base font-bold uppercase tracking-[0.25em]',
    titleStyle: { fontFamily: "'Space Grotesk', system-ui, sans-serif" },
    chip: 'flex size-11 items-center justify-center text-text-muted',
    secTitle: CENTER_RULE('text-sm font-bold tracking-[0.25em] text-text-muted'),
    card: () => 'rounded-2xl border border-line bg-surface active:scale-95',
    slot: () => 'rounded-xl bg-surface-2',
    name: 'truncate text-base font-bold text-text',
    nameStyle: { fontFamily: "'Space Grotesk', system-ui, sans-serif" },
    desc: 'truncate text-xs text-text-muted',
    panel: 'flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface py-6',
    num: 'text-data font-bold leading-none text-text',
    numStyle: { fontFamily: "'Space Grotesk', system-ui, sans-serif" },
    step: 'rounded-xl bg-surface-2 text-text',
    primary: 'rounded-xl bg-sky-400 text-ink',
    quiet: 'rounded-xl bg-surface-2 text-text',
    danger: 'rounded-xl bg-rose-600 font-bold text-white',
    row: 'flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5',
    rowHi: 'bg-surface-2',
    seg: 'rounded-xl bg-surface-2 text-text-muted',
    segOn: 'rounded-xl bg-sky-400 text-ink',
    field: 'w-full border-b-2 border-line bg-transparent py-2 text-base text-text outline-none',
  },

  /* ── F 暖纸感：只动中性色阶梯（变量局部覆盖），形状字体同线上 ── */
  {
    id: 'paper',
    label: 'F · PAPER',
    wrap: '-mx-4 -my-3 px-4 py-3',
    wrapStyle: {
      '--color-canvas': '#16120b',
      '--color-surface': '#221c13',
      '--color-surface-2': '#2e271a',
      '--color-surface-3': '#3b3222',
      '--color-line': '#5a4d33',
      '--color-text': '#f5eedd',
      '--color-text-muted': '#c8bb9e',
      '--color-text-dim': '#9c9078',
    } as CSSProperties,
    header: '-mx-4 flex h-14 items-center gap-3 border-b border-line bg-surface px-4',
    logo: 'flex items-center justify-center text-text',
    title: 'flex-1 text-base font-semibold tracking-wide',
    chip: 'flex size-11 items-center justify-center text-text-muted',
    secTitle: CENTER_RULE('text-sm font-semibold tracking-wide text-text-muted'),
    card: () => 'rounded-2xl border border-line bg-surface active:scale-95',
    slot: () => 'rounded-xl bg-surface-2',
    name: 'truncate text-base font-semibold text-text',
    desc: 'truncate text-xs text-text-muted',
    panel: 'flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface py-6',
    num: 'text-data font-bold leading-none text-text',
    step: 'rounded-xl bg-surface-2 text-text',
    primary: 'rounded-xl bg-sky-400 text-ink',
    quiet: 'rounded-xl bg-surface-2 text-text',
    danger: 'rounded-xl bg-rose-600 font-bold text-white',
    row: 'flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5',
    rowHi: 'bg-surface-2',
    seg: 'rounded-xl bg-surface-2 text-text-muted',
    segOn: 'rounded-xl bg-sky-400 text-ink',
    field: 'w-full border-b-2 border-line bg-transparent py-2 text-base text-text outline-none',
  },

  /* ── G 双线框装帧：小圆角 + 2px 外框 + 内框细线 + 卡底 accent 色条 ── */
  {
    id: 'frame',
    label: 'G · FRAME',
    header: '-mx-4 flex h-14 items-center gap-3 border-b-2 border-line px-4',
    logo: 'flex size-10 items-center justify-center rounded border-2 border-line text-text',
    title: 'flex-1 text-base font-bold tracking-[0.3em]',
    chip: 'flex size-11 items-center justify-center rounded border-2 border-line text-text',
    secTitle: (title) => (
      <div className="flex items-center gap-4">
        <span className="h-0.5 flex-1 bg-line" aria-hidden />
        <h2 className="text-sm font-bold tracking-[0.3em] text-text">{title}</h2>
        <span className="h-0.5 flex-1 bg-line" aria-hidden />
      </div>
    ),
    card: () => 'rounded-lg border-2 border-line bg-surface active:scale-95',
    slot: () => 'rounded border border-line bg-transparent',
    name: 'truncate text-base font-semibold text-text',
    desc: 'truncate text-xs text-text-muted',
    frame: 'pointer-events-none absolute inset-1 rounded border border-line/60',
    bar: (a) => `absolute inset-x-3 bottom-1 h-0.5 rounded-full ${BAR[a]}`,
    panel: 'relative flex flex-col items-center gap-3 rounded-lg border-2 border-line bg-surface py-6',
    panelFrame: 'pointer-events-none absolute inset-1 rounded border border-line/60',
    panelBar: `absolute inset-x-3 bottom-1.5 h-0.5 rounded-full ${BAR.sky}`,
    num: 'text-data font-bold leading-none text-text',
    step: 'rounded-md border-2 border-line bg-surface-2 text-text',
    primary: 'rounded-md border-2 border-sky-400 bg-sky-400 text-ink',
    quiet: 'rounded-md border-2 border-line bg-surface-2 text-text',
    danger: 'rounded-md border-2 border-rose-600 bg-rose-600 font-bold text-white',
    row: 'relative flex items-center gap-3 rounded-md border-2 border-line bg-surface px-3 py-2.5',
    rowHi: 'bg-surface-2',
    seg: 'rounded-md border-2 border-line text-text-muted',
    segOn: 'rounded-md border-2 border-sky-400 bg-sky-400 text-ink',
    field:
      'w-full rounded-md border-2 border-line bg-surface px-3 py-2 text-base text-text outline-none',
  },

  /* ── H 街机夜光：更深近黑 + accent 辉光描边 + 数字发光 ── */
  {
    id: 'neon',
    label: 'H · NEON',
    wrapStyle: {
      '--color-canvas': '#05060a',
      '--color-surface': '#0c0e16',
      '--color-surface-2': '#141726',
      '--color-surface-3': '#1c2033',
      '--color-line': '#2a2f45',
      '--color-text': '#eef0ff',
      '--color-text-muted': '#9aa1c7',
      '--color-text-dim': '#666e94',
    } as CSSProperties,
    header: '-mx-4 flex h-14 items-center gap-3 border-b border-line px-4',
    logo: 'flex items-center justify-center text-sky-300',
    title: 'flex-1 text-base font-bold uppercase tracking-[0.3em] text-text',
    titleStyle: { fontFamily: "'Space Grotesk', system-ui, sans-serif" },
    chip: 'flex size-11 items-center justify-center text-text-muted',
    secTitle: CENTER_RULE('text-xs font-bold uppercase tracking-[0.4em] text-text-dim'),
    card: (a) => `rounded-xl border bg-surface active:scale-95 ${NEON[a]}`,
    slot: () => 'rounded-lg bg-surface-2',
    name: 'truncate text-base font-bold text-text',
    nameStyle: { fontFamily: "'Space Grotesk', system-ui, sans-serif" },
    desc: 'truncate text-xs text-text-muted',
    panel:
      'flex flex-col items-center gap-3 rounded-xl border border-sky-400/40 bg-surface py-6 shadow-[0_0_32px_-8px_#38bdf8]',
    num: 'text-data font-bold leading-none text-sky-200',
    numStyle: {
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      textShadow: '0 0 28px rgba(56,189,248,.9)',
    },
    step: 'rounded-xl border border-sky-400/40 bg-surface-2 text-sky-300',
    primary: 'rounded-xl bg-sky-400 text-ink shadow-[0_0_24px_-4px_#38bdf8]',
    quiet: 'rounded-xl border border-line bg-surface-2 text-text',
    danger: 'rounded-xl bg-rose-600 font-bold text-white shadow-[0_0_24px_-4px_#f43f5e]',
    row: 'flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5',
    rowHi: 'border-sky-400/40',
    seg: 'rounded-xl border border-line bg-surface-2 text-text-muted',
    segOn: 'rounded-xl bg-sky-400 text-ink shadow-[0_0_16px_-4px_#38bdf8]',
    field:
      'w-full border-b-2 border-sky-400/40 bg-transparent py-2 text-base text-text outline-none',
  },

  /* ── I 瑞士排版：零圆角，性格全靠字号阶梯、编号与规则线 ── */
  {
    id: 'swiss',
    label: 'I · SWISS',
    header: '-mx-4 flex h-16 items-center gap-3 border-b-2 border-text px-4',
    logo: 'flex size-10 items-center justify-center bg-text text-ink',
    title: 'flex-1 text-2xl font-black uppercase tracking-tight',
    chip: 'flex size-11 items-center justify-center border border-line text-text',
    secTitle: (title, i) => (
      <div className="flex items-end gap-3 border-b-2 border-text pb-1">
        <span className="font-mono text-xs tabular-nums text-text-dim">
          {String(i + 1).padStart(2, '0')}
        </span>
        <h2 className="text-xl font-black uppercase tracking-tight text-text">{title}</h2>
      </div>
    ),
    card: () => 'rounded-none border border-line bg-canvas active:scale-95',
    slot: () => 'rounded-none bg-transparent',
    name: 'truncate text-lg font-black tracking-tight text-text',
    desc: 'truncate text-xs uppercase tracking-widest text-text-dim',
    bar: (a) => `absolute right-2 top-2 size-2.5 ${BAR[a]}`,
    panel: 'flex flex-col items-center gap-3 border-y-2 border-text py-6',
    num: 'text-data font-black leading-none tracking-tighter text-text',
    step: 'rounded-none border border-text text-text',
    primary: 'rounded-none bg-text font-bold uppercase tracking-widest text-ink',
    quiet: 'rounded-none border border-text text-text',
    danger: 'rounded-none bg-rose-600 font-bold uppercase tracking-widest text-white',
    row: 'flex items-center gap-3 border-b border-line px-1 py-3',
    rowHi: 'bg-surface',
    seg: 'rounded-none border border-line text-text-muted',
    segOn: 'rounded-none bg-text text-ink',
    field: 'w-full border-b-2 border-text bg-transparent py-2 text-base text-text outline-none',
  },

  /* ── J 辉光玻璃：暗底 + 彩色光晕 + 毛玻璃卡，美感优先 ── */
  {
    id: 'aura',
    label: 'J · AURA',
    wrap: '-mx-4 -my-3 px-4 py-3',
    wrapStyle: {
      backgroundImage:
        'radial-gradient(60% 40% at 15% 0%, rgba(56,189,248,.14), transparent 60%),' +
        'radial-gradient(50% 35% at 85% 8%, rgba(167,139,250,.13), transparent 60%),' +
        'radial-gradient(45% 30% at 50% 100%, rgba(52,211,153,.08), transparent 60%)',
    },
    header: '-mx-4 flex h-14 items-center gap-3 px-4',
    logo: 'flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-text',
    title: 'flex-1 text-base font-semibold tracking-[0.2em]',
    chip: 'flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-text-muted',
    secTitle: CENTER_RULE('text-xs font-semibold uppercase tracking-[0.35em] text-text-dim'),
    card: () =>
      'rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm active:scale-95',
    slot: () => 'rounded-2xl bg-white/10',
    name: 'truncate text-base font-semibold text-text',
    desc: 'truncate text-xs text-text-muted',
    panel:
      'flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 py-6 backdrop-blur-sm',
    num: 'text-data font-bold leading-none text-text',
    step: 'rounded-2xl border border-white/10 bg-white/10 text-text',
    primary: 'rounded-2xl bg-gradient-to-br from-sky-300 to-sky-500 font-bold text-ink',
    quiet: 'rounded-2xl border border-white/10 bg-white/5 text-text',
    danger: 'rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 font-bold text-white',
    row: 'flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5',
    rowHi: 'bg-white/10',
    seg: 'rounded-2xl border border-white/10 bg-white/5 text-text-muted',
    segOn: 'rounded-2xl bg-gradient-to-br from-sky-300 to-sky-500 text-ink',
    field:
      'w-full border-b-2 border-white/20 bg-transparent py-2 text-base text-text outline-none',
  },
]

/* ── H 案的辉光描边（按 accent） ── */
const NEON: Record<Accent, string> = {
  amber: 'border-amber-400/40 shadow-[0_0_24px_-8px_#fbbf24]',
  emerald: 'border-emerald-400/40 shadow-[0_0_24px_-8px_#34d399]',
  sky: 'border-sky-400/40 shadow-[0_0_24px_-8px_#38bdf8]',
  violet: 'border-violet-400/40 shadow-[0_0_24px_-8px_#a78bfa]',
  rose: 'border-rose-400/40 shadow-[0_0_24px_-8px_#fb7185]',
  teal: 'border-teal-400/40 shadow-[0_0_24px_-8px_#2dd4bf]',
  fuchsia: 'border-fuchsia-400/40 shadow-[0_0_24px_-8px_#e879f9]',
  indigo: 'border-indigo-400/40 shadow-[0_0_24px_-8px_#818cf8]',
  cyan: 'border-cyan-400/40 shadow-[0_0_24px_-8px_#22d3ee]',
  neutral: 'border-line',
}

/* ══════════════ 渲染器（全部皮肤共用） ══════════════ */

const CARD_BASE =
  'relative flex min-h-[4.5rem] items-center gap-3 p-3 transition-transform duration-75'

function LabCard({ s, row }: { s: Skin; row: Row }) {
  return (
    <div className={`${CARD_BASE} ${s.card(row.accent)}`}>
      {s.frame && <span className={s.frame} aria-hidden />}
      <Slot row={row} className={s.slot(row.accent)} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={s.name} style={s.nameStyle}>
          {row.name}
        </span>
        <span className={s.desc}>{row.desc}</span>
      </span>
      {row.badge && (
        <span className="shrink-0 text-xs opacity-60" aria-hidden>
          {row.badge}
        </span>
      )}
      {s.bar && <span className={s.bar(row.accent)} aria-hidden />}
    </div>
  )
}

/** 部件样本：按钮/文本结合、数据 + 步进、列表、分段、输入 —— 首页宫格之外的典型排版 */
const SAMPLE_PLAYERS = [
  { hex: '#f87171', name: '阿黎', score: '+12' },
  { hex: '#38bdf8', name: '小王', score: '+8' },
  { hex: '#a78bfa', name: '老陈', score: '-3' },
]

function Parts({ s, index }: { s: Skin; index: number }) {
  return (
    <section className={`flex flex-col gap-4 ${s.secWrap?.(index) ?? ''}`}>
      {s.secTitle('PARTS', index)}
      {/* 数据 + 步进：数字工具的主界面形态 */}
      <div className={s.panel}>
        {s.panelFrame && <span className={s.panelFrame} aria-hidden />}
        {s.panelBar && <span className={s.panelBar} aria-hidden />}
        <span className="text-sm text-text-muted">合计</span>
        <div className="flex items-center gap-4">
          <button type="button" className={`${STEP_BASE} ${s.step}`}>
            −
          </button>
          <span className={s.num} style={s.numStyle}>
            128
          </span>
          <button type="button" className={`${STEP_BASE} ${s.step}`}>
            +
          </button>
        </div>
      </div>
      {/* 按钮排：主 / 次 / 危险三态 */}
      <div className="flex flex-wrap gap-3">
        <button type="button" className={`${BTN_ROW} ${s.primary}`}>
          结束并归档
        </button>
        <button type="button" className={`${BTN_ROW} ${s.quiet}`}>
          历史记录
        </button>
        <button type="button" className={`${BTN_ROW} ${s.danger}`}>
          清零
        </button>
      </div>
      {/* 玩家列表行：身份色 + 名字 + 数值 */}
      <div className="flex flex-col gap-2">
        {SAMPLE_PLAYERS.map((p, i) => (
          <div key={p.name} className={`${s.row} ${i === 0 ? (s.rowHi ?? '') : ''}`}>
            <span
              className="w-1.5 self-stretch rounded-full"
              style={{ background: p.hex }}
              aria-hidden
            />
            <span className="flex-1 text-base text-text">{p.name}</span>
            <span className="font-mono text-base tabular-nums text-text-muted">{p.score}</span>
          </div>
        ))}
      </div>
      {/* 分段开关 + 输入框 */}
      <div className="flex gap-2">
        {['经典', '快速', '自定义'].map((label, i) => (
          <button
            key={label}
            type="button"
            className={`btn-base min-h-12 px-4 text-sm ${i === 1 ? s.segOn : s.seg}`}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-text-muted">牌局备注</span>
        <input className={s.field} defaultValue="周五桌游夜" readOnly />
      </label>
    </section>
  )
}

function SkinView({ s }: { s: Skin }) {
  const { quick, general, game } = useRows()
  const { t } = useTranslation()
  const sections: [string, Row[]][] = [
    [t('home.quick'), quick],
    [t('home.general'), general],
    [t('home.game'), game],
  ]
  return (
    <div className={`flex flex-col gap-4 ${s.wrap ?? ''}`} style={s.wrapStyle}>
      <div className={s.header}>
        <span className={s.logo}>
          <IconLogo className="size-6" aria-hidden />
        </span>
        <h1 className={s.title} style={s.titleStyle}>
          {t('app.title')}
        </h1>
        <span className={s.chip}>
          <IconPlayers className="size-6" aria-hidden />
        </span>
        <span className={s.chip}>
          <IconSettings className="size-6" aria-hidden />
        </span>
        <span className={s.chip}>
          <IconFullscreen className="size-5" aria-hidden />
        </span>
      </div>
      {sections.map(([title, rows], i) => (
        <section key={title} className={`flex flex-col gap-3 ${s.secWrap?.(i) ?? ''}`}>
          {s.secTitle(title, i)}
          <div className={GRID}>
            {rows.map((row) => (
              <LabCard key={row.key} s={s} row={row} />
            ))}
          </div>
        </section>
      ))}
      <Parts s={s} index={sections.length} />
    </div>
  )
}

/* ══════════════ 切换外壳 ══════════════ */

/** E / H 两案用的 display 字体。样板间联网拉，正式采用时才本地化子集 */
function useDisplayFont() {
  useEffect(() => {
    if (document.getElementById('stylelab-font')) return
    const link = document.createElement('link')
    link.id = 'stylelab-font'
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap'
    document.head.appendChild(link)
  }, [])
}

export default function StyleLab() {
  useDisplayFont()
  const [active, setActive] = useState<string>('solid')
  const current = SKINS.find((s) => s.id === active) ?? SKINS[0]
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="sticky top-0 z-10 -mx-4 flex gap-2 overflow-x-auto bg-canvas/95 px-4 py-2 backdrop-blur">
          {SKINS.map((skin) => (
            <button
              key={skin.id}
              type="button"
              onClick={() => setActive(skin.id)}
              className={`btn-base min-h-12 shrink-0 px-4 text-sm ${
                skin.id === active ? 'bg-text text-ink' : 'bg-surface-2 text-text-muted'
              }`}
            >
              {skin.label}
            </button>
          ))}
        </div>
        <SkinView s={current} />
        <div className="h-8" />
      </div>
    </div>
  )
}
