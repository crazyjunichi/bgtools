import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { type QuickAccent, quickTools } from '../quick/registry'
import { useQuickUI } from '../quick/store'
import { FIELD } from '../shared/components/fieldStyle'
import { searchText, tokenize } from '../shared/i18n/search'
import { IconClose, IconSearch } from '../shared/icons'
import { tools } from '../tools/registry'
import { scoreSheetMeta } from '../tools/score-sheet/meta'
import { BLANK_ID, type SheetHue, TEMPLATES } from '../tools/score-sheet/templates'
import type { ToolMeta } from '../tools/types'

/** 注册表是静态的，分区在模块顶层切一次 —— 每次渲染重算会让下面的 useMemo 依赖白给 */
const QUICK = quickTools.filter((tool) => tool.onHome)
const GENERAL = tools.filter((tool) => tool.category === 'general')
const GAME = tools.filter((tool) => tool.category === 'game')

/**
 * 显式映射而非拼接类名：Tailwind 编译期扫描静态字符串，动态拼接会被漏掉。
 *
 * 身份色只出现在两处：卡片底部那条规则线、quick 卡的字形。卡片既没有描边也没有
 * 底色（分界全靠区块色带），所以**这条线是卡片唯一的身份编码**，别降细也别改成
 * 半透明 —— 同一条色带里几张卡会当场糊成一片。
 *
 * 一张表同时喂工具身份色与 quick 身份色，两个 union 合起来共七档 ——
 * 分成两张表只会让同一个 amber 在首页有两种写法。
 */
const ACCENT: Record<ToolMeta['accent'] | QuickAccent, { under: string; glyph: string }> = {
  amber: { under: 'border-amber-400', glyph: 'text-amber-300' },
  emerald: { under: 'border-emerald-400', glyph: 'text-emerald-300' },
  sky: { under: 'border-sky-400', glyph: 'text-sky-300' },
  violet: { under: 'border-violet-400', glyph: 'text-violet-300' },
  rose: { under: 'border-rose-400', glyph: 'text-rose-300' },
  teal: { under: 'border-teal-400', glyph: 'text-teal-300' },
  neutral: { under: 'border-line', glyph: 'text-text-muted' },
}

/**
 * 计分纸模板卡的规则线色，来自各自的盒图主体色（[SheetHue](../tools/score-sheet/templates.ts)）。
 * 这一区十几张卡本来全是计分纸的 violet，那条线等于没编码。
 *
 * 与 ACCENT 分成两张表：档数是它的两倍多，而模板卡没有字形，合表得给每档补一个用不到的
 * `glyph`。**一律 -400 档**，跟工具身份色同亮度 —— 混着 -300/-500 会让某几张卡显得更重要。
 */
const HUE: Record<SheetHue, string> = {
  red: 'border-red-400',
  orange: 'border-orange-400',
  amber: 'border-amber-400',
  yellow: 'border-yellow-400',
  lime: 'border-lime-400',
  green: 'border-green-400',
  emerald: 'border-emerald-400',
  teal: 'border-teal-400',
  cyan: 'border-cyan-400',
  sky: 'border-sky-400',
  blue: 'border-blue-400',
  indigo: 'border-indigo-400',
  violet: 'border-violet-400',
  purple: 'border-purple-400',
  fuchsia: 'border-fuchsia-400',
  pink: 'border-pink-400',
  stone: 'border-stone-400',
  brown: 'border-brown-400',
}

/**
 * 三段的色带与图槽底。**槽底始终比所在色带亮一档**：卡片本身没有底色，
 * 图槽是唯一能把卡内容从色带里拎出来的实体块，两个值必须成对改。
 */
const BAND = {
  quick: { band: 'bg-surface-2', slot: 'bg-surface-3' },
  general: { band: 'bg-surface', slot: 'bg-surface-2' },
  game: { band: '', slot: 'bg-surface' },
} as const

/**
 * **三个区只有一档卡**：尺寸、内距、图槽、字号全一样，区与区之间只靠色带分段。
 * 桌上是斜视扫的，同一屏里出现三种卡片尺寸等于要重新对焦三次。
 * 代价是高度（取值与预算见 DESIGN.md §5），不要为了压高度再把某一区单独调小。
 *
 * 卡是「无框条目」而非卡片：不要再加回描边、圆角底色或渐变，那三样正是要去掉的东西。
 */
const CARD =
  'flex items-center gap-3 border-b-2 p-3 text-left transition-transform duration-75 active:scale-95 short:gap-2 short:p-2'

/** 卡片同款，列数也就没有理由不同 */
const GRID = 'grid grid-cols-2 gap-3 wide:grid-cols-3 short:gap-2'

/**
 * 一段色带。`-mx-4` 抵掉 App 外壳的横向内距让色带出血到边，
 * safe-x 留在外层不被抵消 —— 色带不铺进刘海区是有意的。
 *
 * 标题两侧的规则线是分区的主编码（游戏区没有色带，只剩这条线），
 * 所以**标题行独占一行、三个区完全同构**：往这行里塞控件会把居中的标题挤偏，
 * 那条对称的规则线就不成立了。游戏区的筛选框因此走 children 的第一块。
 */
function Section({
  title,
  band,
  children,
}: {
  title: string
  band: string
  children: ReactNode
}) {
  return (
    <section className={`-mx-4 flex flex-col gap-3 px-4 py-4 short:gap-2 short:py-2 ${band}`}>
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" aria-hidden />
        {/* 负 me 吃掉末字后面那份字距，否则标题看着偏左 */}
        <h2 className="-me-[0.3em] text-sm font-bold tracking-[0.3em] text-text">{title}</h2>
        <span className="h-px flex-1 bg-line" aria-hidden />
      </div>
      {children}
    </section>
  )
}

/**
 * 盒图槽位。加载失败（离线、图没抓到）退回 emoji —— 卡片不能空一块，
 * 而且那个 emoji 本身就是能认出是哪款游戏的兜底。
 * 失败状态存在自己身上而不是改 `src`：改 src 会触发新一轮 onError 死循环。
 *
 * 槽与图都刻意保持直角：印刷版式里图是贴上去的方块，圆角会把它拉回卡片语汇。
 * `slot` 由所在色带给（见 `BAND`）。
 */
function Cover({ cover, icon, slot }: { cover?: string; icon: string; slot: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className={`flex size-12 shrink-0 items-center justify-center short:size-10 ${slot}`}>
      {cover && !failed ? (
        <img
          // base 为相对路径，绝对的 /covers/... 在子目录部署下会 404
          src={`${import.meta.env.BASE_URL}${cover}`}
          alt=""
          loading="lazy"
          className="size-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-3xl short:text-2xl">{icon}</span>
      )}
    </span>
  )
}

/** 卡面文字。两行都 `truncate`：换行会让同一排的卡高矮不齐 */
function CardText({ name, desc }: { name: string; desc: string }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-base font-bold tracking-wide text-text">{name}</span>
      <span className="truncate text-xs text-text-muted">{desc}</span>
    </span>
  )
}

/**
 * 跳工具页的那张卡（通用区与游戏专用区共用）。
 * `badge` 是给计分纸模板入口的第二编码：游戏专用区里混着两种目的地，颜色靠不住。
 *
 * `under` 收的是**已解析好的类名**而不是色档名：这张卡的两类调用方查的是两张不同的表
 * （工具查 ACCENT、模板查 HUE），把 union 塞进 props 会让卡片自己也得知道有两种色源。
 */
type ToolCardProps = {
  to: string
  cover?: string
  icon: string
  name: string
  desc: string
  under: string
  ariaLabel?: string
  badge?: string
}

function ToolCard({
  to,
  cover,
  icon,
  name,
  desc,
  under,
  ariaLabel,
  badge,
  slot,
}: ToolCardProps & { slot: string }) {
  return (
    <Link to={to} aria-label={ariaLabel} className={`${CARD} ${under}`}>
      <Cover cover={cover} icon={icon} slot={slot} />
      <CardText name={name} desc={desc} />
      {badge && (
        <span className="shrink-0 text-xs" aria-hidden>
          {badge}
        </span>
      )}
    </Link>
  )
}

/**
 * 首页 = 三段式导航，权重与卡片密度一路递减：
 *
 * 1. **快捷工具**：quick 注册表里 `onHome` 的那批。点开只弹 dialog、**不跳路由** ——
 *    浮层由 App 层常驻的 [QuickLayer](../quick/QuickLayer.tsx) 渲染，这里只 dispatch
 * 2. **通用工具**：`category: 'general'`，任何游戏都用得上
 * 3. **游戏专用工具**：`category: 'game'` 的工具 + 计分纸每个模板一个虚拟入口，
 *    带 `?tpl=` 直接落到那张表。项数多，标题下方带一条筛选框（只筛这一区）
 *
 * 三个区共用同一档卡与同一套列数，见 `CARD` / `GRID`；分区靠色带与规则线，见 `BAND`。
 *
 * 两处不要改回去：
 * - **不做垂直居中**（原来的 `content-center` + `min-h-full`）：三区块本来就填满可用高，
 *   而 `content-center` 在内容溢出时会把第一区推到滚动区外且滚不回来
 * - 列数只用 `wide:` 判朝向 —— 宽度断点会把安卓平板横屏误判成竖屏，整批退成单列
 *
 * 首页是全站唯一允许纵向滚动的页面（取值与理由见 DESIGN.md §5）。
 */
export default function Home() {
  const { t, i18n } = useTranslation()
  const openTool = useQuickUI((s) => s.openTool)
  const [query, setQuery] = useState('')

  /**
   * 游戏专用区的两类入口摊平成一个列表：工具在前，模板按当前语言的名字排
   * （中文下是拼音序，比声明序好扫）。通用空白模板不在里面 —— 它不是一款游戏，
   * 入口就是通用区那张「计分纸」卡。
   *
   * `text` 只参与筛选、永不渲染，所以套在 `card` 外面而不是混进它的 props。
   */
  const games = useMemo(() => {
    const toolRows = GAME.map((tool) => ({
      text: searchText(i18n, [tool.nameKey, tool.descKey]),
      card: {
        to: `/${tool.id}`,
        cover: tool.cover,
        icon: tool.icon,
        name: t(tool.nameKey),
        desc: t(tool.descKey),
        under: ACCENT[tool.accent].under,
      } satisfies ToolCardProps,
    }))

    const sheetRows = TEMPLATES.filter((tpl) => tpl.id !== BLANK_ID)
      .map((tpl) => ({
        text: searchText(i18n, [tpl.nameKey, tpl.aliasKey]),
        card: {
          // 目标模板带在 URL 上，由 ScoreSheetPage 落地时消费掉
          to: `/${scoreSheetMeta.id}?tpl=${tpl.id}`,
          cover: tpl.cover,
          icon: tpl.icon,
          name: t(tpl.nameKey),
          // 描述行说清这张点进去是计分纸，条目数顺带告诉桌上这表有多长
          desc: t('home.sheetDesc', { n: tpl.entries.length }),
          // 这一区唯一不走 meta.accent 的地方：线色跟着盒图，不跟着「计分纸」这个工具
          under: HUE[tpl.hue],
          // 卡面只有游戏名，读屏得说清点进去是哪个工具
          ariaLabel: t('home.sheetOf', { name: t(tpl.nameKey) }),
          badge: scoreSheetMeta.icon,
        } satisfies ToolCardProps,
      }))
      .sort((a, b) => a.card.name.localeCompare(b.card.name, i18n.language))

    return [...toolRows, ...sheetRows]
  }, [t, i18n])

  const tokens = tokenize(query)
  const shown =
    tokens.length > 0 ? games.filter((row) => tokens.every((k) => row.text.includes(k))) : games

  return (
    <div className="h-full overflow-y-auto">
      {/* 色带自带上下内距，区块之间不再另给 gap —— 两者叠加会把三区推出一屏 */}
      <div className="mx-auto flex max-w-5xl flex-col">
        <Section title={t('home.quick')} band={BAND.quick.band}>
          <div className={GRID}>
            {QUICK.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => openTool(tool.id)}
                className={`${CARD} ${ACCENT[tool.accent].under}`}
              >
                {/* 槽位与另两个区的封面槽同尺寸；字形自己带身份色，盒图那边靠图本身 */}
                <span
                  className={`flex size-12 shrink-0 items-center justify-center short:size-10 ${BAND.quick.slot}`}
                >
                  <tool.icon
                    className={`size-7 short:size-6 ${ACCENT[tool.accent].glyph}`}
                    aria-hidden
                  />
                </span>
                <CardText name={t(tool.nameKey)} desc={t(tool.descKey)} />
              </button>
            ))}
          </div>
        </Section>

        <Section title={t('home.general')} band={BAND.general.band}>
          <div className={GRID}>
            {GENERAL.map((tool) => (
              <ToolCard
                key={tool.id}
                to={`/${tool.id}`}
                cover={tool.cover}
                icon={tool.icon}
                name={t(tool.nameKey)}
                desc={t(tool.descKey)}
                under={ACCENT[tool.accent].under}
                slot={BAND.general.slot}
              />
            ))}
          </div>
        </Section>

        <Section title={t('home.game')} band={BAND.game.band}>
          {/* 与下面的网格同宽自成一行：印刷版式里它是网格的控制条，不是标题的附件 */}
          <div className="relative">
            <IconSearch
              className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-text-dim"
              aria-hidden
            />
            {/*
             * **不 autoFocus**：平板上软键盘一弹起就盖掉半页入口，而绝大多数情况是
             * 直接点已经看见的那张卡。想筛的人自己点一下，代价只有一次点击
             */}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('home.filter')}
              aria-label={t('home.filter')}
              className={`${FIELD} pl-11 pr-14`}
            />
            {query !== '' && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t('common.clear')}
                className="btn-quiet absolute right-1 top-1/2 !min-h-12 w-12 -translate-y-1/2 short:!min-h-10 short:w-10"
              >
                <IconClose className="size-5" aria-hidden />
              </button>
            )}
          </div>
          <div className={GRID}>
            {shown.map((row) => (
              <ToolCard key={row.card.to} {...row.card} slot={BAND.game.slot} />
            ))}
            {shown.length === 0 && (
              <span className="col-span-full px-1 py-2 text-sm leading-relaxed text-text-muted">
                {t('home.noMatch')}
              </span>
            )}
          </div>
        </Section>
      </div>
    </div>
  )
}
