import { useState } from 'react'
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
 * 只为在真机上对比四种首页风格：同一批真实数据、同一档卡片尺寸与触控目标，
 * 只换视觉皮肤。所以这里刻意不接 i18n 的风格名（不往 locale 真源里塞临时 key），
 * 切换按钮用英文短标签。
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
/** 样板间只要够铺满两行就够判断，不必把 11 张模板全画一遍 */
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

/* ══════════════ A 实心色块墙 ══════════════ */

const SOLID: Record<Accent, string> = {
  amber: 'bg-amber-400 text-ink',
  emerald: 'bg-emerald-400 text-ink',
  sky: 'bg-sky-400 text-ink',
  violet: 'bg-violet-400 text-ink',
  rose: 'bg-rose-400 text-ink',
  teal: 'bg-teal-400 text-ink',
  fuchsia: 'bg-fuchsia-400 text-ink',
  neutral: 'bg-surface-3 text-text',
}

function SolidCard({ row }: { row: Row }) {
  return (
    <div
      className={`flex min-h-[4.5rem] items-center gap-3 rounded-2xl p-3 ${SOLID[row.accent]} transition-transform duration-75 active:scale-95`}
    >
      <Slot row={row} className="rounded-xl bg-canvas/15" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-bold">{row.name}</span>
        {/* opacity 而不是具体文字色：neutral 卡是白字，写死 ink/70 会失效 */}
        <span className="truncate text-xs opacity-70">{row.desc}</span>
      </span>
      {row.badge && (
        <span className="shrink-0 text-xs opacity-60" aria-hidden>
          {row.badge}
        </span>
      )}
    </div>
  )
}

function SolidSkin() {
  const { quick, general, game } = useRows()
  const { t } = useTranslation()
  const section = (title: string, rows: Row[]) => (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="h-7 w-2 rounded-full bg-text" aria-hidden />
        <h2 className="text-lg font-black tracking-wide text-text">{title}</h2>
      </div>
      <div className={GRID}>
        {rows.map((row) => (
          <SolidCard key={row.key} row={row} />
        ))}
      </div>
    </section>
  )
  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-14 items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-text text-ink">
          <IconLogo className="size-6" aria-hidden />
        </span>
        <h1 className="flex-1 text-xl font-black tracking-wide">{t('app.title')}</h1>
        <span className="flex size-11 items-center justify-center rounded-xl bg-surface-2 text-text">
          <IconPlayers className="size-6" aria-hidden />
        </span>
        <span className="flex size-11 items-center justify-center rounded-xl bg-surface-2 text-text">
          <IconSettings className="size-6" aria-hidden />
        </span>
        <span className="flex size-11 items-center justify-center rounded-xl bg-surface-2 text-text">
          <IconFullscreen className="size-5" aria-hidden />
        </span>
      </div>
      {section(t('home.quick'), quick)}
      {section(t('home.general'), general)}
      {section(t('home.game'), game)}
    </div>
  )
}

/* ══════════════ B 卡牌桌 ══════════════ */

const BAR: Record<Accent, string> = {
  amber: 'bg-amber-400',
  emerald: 'bg-emerald-400',
  sky: 'bg-sky-400',
  violet: 'bg-violet-400',
  rose: 'bg-rose-400',
  teal: 'bg-teal-400',
  fuchsia: 'bg-fuchsia-400',
  neutral: 'bg-surface-3',
}

/** 桌面毛毡。极低对比的斜纹，只负责让底色不是一块死黑 */
const FELT = {
  backgroundImage:
    'repeating-linear-gradient(45deg, rgba(255,255,255,.022) 0 3px, transparent 3px 6px)',
}

function DeckCard({ row }: { row: Row }) {
  return (
    <div className="relative flex min-h-[4.5rem] items-center gap-3 overflow-hidden rounded-xl border border-line bg-surface p-3 pl-5 transition-transform duration-75 active:scale-95">
      <span className={`absolute inset-y-0 left-0 w-2 ${BAR[row.accent]}`} aria-hidden />
      <Slot row={row} className="rounded-lg bg-surface-2" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-semibold text-text">{row.name}</span>
        <span className="truncate text-xs text-text-muted">{row.desc}</span>
      </span>
      {row.badge && (
        <span className="absolute right-2 top-1.5 text-xs opacity-50" aria-hidden>
          {row.badge}
        </span>
      )}
    </div>
  )
}

function DeckSkin() {
  const { quick, general, game } = useRows()
  const { t } = useTranslation()
  const section = (title: string, rows: Row[]) => (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
          {title}
        </h2>
        <span className="h-px flex-1 bg-line" aria-hidden />
      </div>
      <div className={GRID}>
        {rows.map((row) => (
          <DeckCard key={row.key} row={row} />
        ))}
      </div>
    </section>
  )
  return (
    <div className="-mx-4 -my-3 flex flex-col gap-4 px-4 py-3" style={FELT}>
      <div className="-mx-4 flex h-14 items-center gap-3 border-b border-line bg-surface px-4">
        <IconLogo className="size-6 text-text" aria-hidden />
        <h1 className="flex-1 text-base font-semibold uppercase tracking-[0.2em]">
          {t('app.title')}
        </h1>
        <IconPlayers className="size-6 text-text-muted" aria-hidden />
        <IconSettings className="size-6 text-text-muted" aria-hidden />
        <IconFullscreen className="size-5 text-text-muted" aria-hidden />
      </div>
      {section(t('home.quick'), quick)}
      {section(t('home.general'), general)}
      {section(t('home.game'), game)}
    </div>
  )
}

/* ══════════════ C 粗野主义 ══════════════ */

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
  neutral: {
    edge: 'border-line',
    block: 'bg-surface-3 text-text',
    shadow: 'shadow-[5px_5px_0_0_var(--color-line,#454a4f)]',
    press: 'active:shadow-[2px_2px_0_0_var(--color-line,#454a4f)]',
  },
}

function BrutalCard({ row }: { row: Row }) {
  const s = HARD[row.accent]
  return (
    <div
      // 按下时整卡贴向阴影：实体按键的位移感，比 scale 更像按下去
      className={`flex min-h-[4.5rem] items-center gap-3 rounded-lg border-2 bg-surface p-3 ${s.edge} ${s.shadow} ${s.press} transition-transform duration-75 active:translate-x-[3px] active:translate-y-[3px]`}
    >
      <Slot row={row} className={`rounded-md ${s.block}`} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-black text-text">{row.name}</span>
        <span className="truncate text-xs text-text-muted">{row.desc}</span>
      </span>
      {row.badge && (
        <span className="shrink-0 text-xs opacity-60" aria-hidden>
          {row.badge}
        </span>
      )}
    </div>
  )
}

function BrutalSkin() {
  const { quick, general, game } = useRows()
  const { t } = useTranslation()
  const section = (title: string, rows: Row[]) => (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="size-3 bg-text" aria-hidden />
        <h2 className="text-lg font-black uppercase tracking-tight text-text">{title}</h2>
      </div>
      <div className={GRID}>
        {rows.map((row) => (
          <BrutalCard key={row.key} row={row} />
        ))}
      </div>
    </section>
  )
  return (
    <div className="flex flex-col gap-5">
      <div className="-mx-4 flex h-14 items-center gap-3 border-b-2 border-line px-4">
        <span className="flex size-10 items-center justify-center rounded-md border-2 border-text bg-text text-ink">
          <IconLogo className="size-6" aria-hidden />
        </span>
        <h1 className="flex-1 text-xl font-black uppercase tracking-tight">{t('app.title')}</h1>
        <span className="flex size-11 items-center justify-center rounded-md border-2 border-line text-text">
          <IconPlayers className="size-6" aria-hidden />
        </span>
        <span className="flex size-11 items-center justify-center rounded-md border-2 border-line text-text">
          <IconSettings className="size-6" aria-hidden />
        </span>
        <span className="flex size-11 items-center justify-center rounded-md border-2 border-line text-text">
          <IconFullscreen className="size-5" aria-hidden />
        </span>
      </div>
      {section(t('home.quick'), quick)}
      {section(t('home.general'), general)}
      {section(t('home.game'), game)}
    </div>
  )
}

/* ══════════════ D 复古印刷海报 ══════════════ */

const UNDER: Record<Accent, string> = {
  amber: 'border-amber-400',
  emerald: 'border-emerald-400',
  sky: 'border-sky-400',
  violet: 'border-violet-400',
  rose: 'border-rose-400',
  teal: 'border-teal-400',
  fuchsia: 'border-fuchsia-400',
  neutral: 'border-line',
}

function PrintCard({ row, slot }: { row: Row; slot: string }) {
  return (
    <div
      className={`flex min-h-[4.5rem] items-center gap-3 border-b-2 p-3 ${UNDER[row.accent]} transition-transform duration-75 active:scale-95`}
    >
      <Slot row={row} className={slot} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-bold tracking-wide text-text">{row.name}</span>
        <span className="truncate text-xs text-text-muted">{row.desc}</span>
      </span>
      {row.badge && (
        <span className="shrink-0 text-xs opacity-60" aria-hidden>
          {row.badge}
        </span>
      )}
    </div>
  )
}

function PrintSkin() {
  const { quick, general, game } = useRows()
  const { t } = useTranslation()
  /* 卡片没有描边，分界全靠区块底色 —— 区底与槽底必须差两档 */
  const section = (title: string, rows: Row[], band: string, slot: string) => (
    <section className={`-mx-4 flex flex-col gap-3 px-4 py-4 ${band}`}>
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-line" aria-hidden />
        <h2 className="text-sm font-bold tracking-[0.35em] text-text">{title}</h2>
        <span className="h-px flex-1 bg-line" aria-hidden />
      </div>
      <div className={GRID}>
        {rows.map((row) => (
          <PrintCard key={row.key} row={row} slot={slot} />
        ))}
      </div>
    </section>
  )
  return (
    <div className="flex flex-col">
      <div className="-mx-4 mb-2 flex h-14 items-center gap-3 border-b-2 border-text px-4">
        <IconLogo className="size-6 text-text" aria-hidden />
        <h1 className="flex-1 text-base font-bold tracking-[0.3em]">{t('app.title')}</h1>
        <IconPlayers className="size-6 text-text-muted" aria-hidden />
        <IconSettings className="size-6 text-text-muted" aria-hidden />
        <IconFullscreen className="size-5 text-text-muted" aria-hidden />
      </div>
      {section(t('home.quick'), quick, 'bg-surface-2', 'bg-canvas/40')}
      {section(t('home.general'), general, 'bg-surface', 'bg-surface-2')}
      {section(t('home.game'), game, '', 'bg-surface')}
    </div>
  )
}

/* ══════════════ 切换外壳 ══════════════ */

const SKINS = [
  { id: 'solid', label: 'A · SOLID', Skin: SolidSkin },
  { id: 'deck', label: 'B · DECK', Skin: DeckSkin },
  { id: 'brutal', label: 'C · BRUTAL', Skin: BrutalSkin },
  { id: 'print', label: 'D · PRINT', Skin: PrintSkin },
] as const

export default function StyleLab() {
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
        <current.Skin />
        <div className="h-8" />
      </div>
    </div>
  )
}
