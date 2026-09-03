import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { type QuickAccent, quickTools } from '../quick/registry'
import { useQuickUI } from '../quick/store'
import { FIELD } from '../shared/components/fieldStyle'
import type { GameHue } from '../shared/games/types'
import { searchText, tokenize } from '../shared/i18n/search'
import { IconClose, IconSearch } from '../shared/icons'
import { tools } from '../tools/registry'
import { scoreSheetMeta } from '../tools/score-sheet/meta'
import { BLANK_ID, TEMPLATES, templateIdentity } from '../tools/score-sheet/templates'
import type { ToolMeta } from '../tools/types'

/** 注册表是静态的，分区在模块顶层切一次 —— 每次渲染重算会让下面的 useMemo 依赖白给 */
const QUICK = quickTools.filter((tool) => tool.onHome)
const GENERAL = tools.filter((tool) => tool.category === 'general')
const GAME = tools.filter((tool) => tool.category === 'game')

/**
 * 显式映射而非拼接类名：Tailwind 编译期扫描静态字符串，动态拼接会被漏掉。
 *
 * 身份色只出现在两处：卡片底部那条规则线、quick 卡的字形。卡片既没有描边也没有
 * 底色，所以**这条线是卡片唯一的身份编码**，别降细也别改成半透明 ——
 * 同一区里几张卡会当场糊成一片。
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
  fuchsia: { under: 'border-fuchsia-400', glyph: 'text-fuchsia-300' },
  neutral: { under: 'border-line', glyph: 'text-text-muted' },
}

/**
 * 计分纸模板卡的规则线色，来自各自的盒图主体色（[GameHue](../shared/games/types.ts)）。
 * 这一区十几张卡本来全是计分纸的 violet，那条线等于没编码。
 *
 * 与 ACCENT 分成两张表：档数是它的两倍多，而模板卡没有字形，合表得给每档补一个用不到的
 * `glyph`。**一律 -400 档**，跟工具身份色同亮度 —— 混着 -300/-500 会让某几张卡显得更重要。
 */
const HUE: Record<GameHue, string> = {
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
 * 图槽底。三个区都不带底色了，**槽底比页底亮一档且三区同值** —— 卡片本身也没有底色，
 * 图槽是唯一能把卡内容从页底里拎出来的实体块，三区给成不同亮度会看着像随机层级。
 */
const SLOT = 'bg-surface'

/**
 * **三个区只有一档卡**：尺寸、内距、图槽、字号全一样，区与区之间只靠间距与规则线分段。
 * 桌上是斜视扫的，同一屏里出现三种卡片尺寸等于要重新对焦三次。
 * 代价是高度（取值与预算见 DESIGN.md §5），不要为了压高度再把某一区单独调小。
 *
 * 卡是「无框条目」而非卡片：不要再加回描边、圆角底色或渐变，那三样正是要去掉的东西。
 */
const CARD =
  'flex items-center gap-3 border-b-2 p-3 text-left transition-transform duration-75 active:scale-95 short:gap-2 short:p-2'

/**
 * 卡片同款，列数也就没有理由不同。
 *
 * `max-[520px]` 是全项目唯一一处宽度断点，**它判的不是朝向而是「名字放不放得下」**：
 * 手机竖屏两列时，每张卡扣掉盒图槽与内距后留给名字的宽度装不下英文长名（连 desc 一起
 * 截成省略号），而这跟横屏竖屏无关，纯粹是可用宽度不够。阈值依据见 DESIGN.md §5。
 *
 * 写成 `max-*` 而不是 `grid-cols-1 min-[520px]:grid-cols-2`：后者与 `wide:` 在平板横屏上
 * **必然同时命中**，谁赢取决于 Tailwind 生成的规则顺序；`grid-cols-2` 作为无 variant 的
 * base 一定输给两个 variant，只剩「横屏且窄于 520px」这个现实中不存在的组合会撞。
 *
 * 不要因为「手机上首页变长了」把它改回去 —— 截断的名字在桌上是认不出哪款游戏的。
 */
const GRID = 'grid grid-cols-2 gap-3 max-[520px]:grid-cols-1 wide:grid-cols-3 short:gap-2'

/**
 * 一个区。横向内距由这里给，[App](../App.tsx) 在首页刻意不给（`PAD_X_HOME`）——
 * **不要改回负 mx 抵内距**：外层那个滚动容器会把负 mx 的溢出算成横向可滚区，
 * 窄屏下多一条横向滚动条。区与区的纵向间隔走外层的 gap，别在这里加回 py（会叠加）。
 *
 * 标题两侧的规则线是分区的唯一编码，所以**标题行独占一行、三个区完全同构**：
 * 往这行里塞控件会把居中的标题挤偏，那条对称的规则线就不成立了。
 * 游戏区的筛选框因此走 children 的第一块。
 */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 px-4 short:gap-2">
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
 */
function Cover({ cover, icon }: { cover?: string; icon: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className={`flex size-12 shrink-0 items-center justify-center short:size-10 ${SLOT}`}>
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
 *
 * 游戏专用区里混着「工具页」与「计分纸模板」两种目的地，区分**只靠 desc 那行文案**
 * （模板卡写的是「计分纸 · N 项条目」）。原来右侧还挂一个计分纸 emoji 角标，已删 ——
 * 它连 gap 一起吃掉一段宽度，而手机竖屏两列时名字本来就快放不下了；文字编码已经在，
 * 角标是第三重冗余。**不要再加回任何右侧角标**，要加编码就加在 desc 里。
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
}

function ToolCard({ to, cover, icon, name, desc, under, ariaLabel }: ToolCardProps) {
  return (
    <Link to={to} aria-label={ariaLabel} className={`${CARD} ${under}`}>
      <Cover cover={cover} icon={icon} />
      <CardText name={name} desc={desc} />
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
 * 三个区共用同一档卡与同一套列数，见 `CARD` / `GRID`；三区都不带底色，分区只靠
 * 区间距与标题两侧的规则线 —— 不要再给某一区加回色带底。
 *
 * 两处不要改回去：
 * - **不做垂直居中**（原来的 `content-center` + `min-h-full`）：三区块本来就填满可用高，
 *   而 `content-center` 在内容溢出时会把第一区推到滚动区外且滚不回来
 * - **不许用宽度断点判朝向**：会把安卓平板横屏误判成竖屏，整批退成单列。列数的
 *   横竖屏差异只由 `wide:` 给；`GRID` 里那个 `max-[520px]` 判的是别的事，见它自己的说明
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
      .map((tpl) => {
        // 名字与盒图都属于那盒游戏，模板只存 gameId 指过去
        const game = templateIdentity(tpl)
        return {
          text: searchText(i18n, [game.nameKey, game.aliasKey]),
          card: {
            // 目标模板带在 URL 上，由 ScoreSheetPage 落地时消费掉
            to: `/${scoreSheetMeta.id}?tpl=${tpl.id}`,
            cover: game.cover,
            icon: game.icon,
            name: t(game.nameKey),
            // 描述行说清这张点进去是计分纸，条目数顺带告诉桌上这表有多长
            desc: t('home.sheetDesc', { n: tpl.entries.length }),
            // 这一区唯一不走 meta.accent 的地方：线色跟着盒图，不跟着「计分纸」这个工具
            under: HUE[game.hue],
            // 卡面只有游戏名，读屏得说清点进去是哪个工具
            ariaLabel: t('home.sheetOf', { name: t(game.nameKey) }),
          } satisfies ToolCardProps,
        }
      })
      .sort((a, b) => a.card.name.localeCompare(b.card.name, i18n.language))

    return [...toolRows, ...sheetRows]
  }, [t, i18n])

  const tokens = tokenize(query)
  const shown =
    tokens.length > 0 ? games.filter((row) => tokens.every((k) => row.text.includes(k))) : games

  return (
    <div className="h-full overflow-y-auto">
      {/* 区间距全在这一处的 gap 上，Section 自己不带 py —— 两处都给会叠加 */}
      <div className="mx-auto flex max-w-5xl flex-col gap-10 pb-4 short:gap-4 short:pb-2">
        <Section title={t('home.quick')}>
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
                  className={`flex size-12 shrink-0 items-center justify-center short:size-10 ${SLOT}`}
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

        <Section title={t('home.general')}>
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
              />
            ))}
          </div>
        </Section>

        <Section title={t('home.game')}>
          {/* 与下面的网格同宽自成一行：印刷版式里它是网格的控制条，不是标题的附件 */}
          <div className="relative">
            <IconSearch
              className="pointer-events-none absolute left-0 top-1/2 size-5 -translate-y-1/2 text-text-dim"
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
              className={`${FIELD} pl-8 pr-14`}
            />
            {query !== '' && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t('common.clear')}
                className="btn-base absolute right-0 top-1/2 size-12 -translate-y-1/2 !min-h-0 text-text-muted short:size-10"
              >
                <IconClose className="size-5" aria-hidden />
              </button>
            )}
          </div>
          <div className={GRID}>
            {shown.map((row) => (
              <ToolCard key={row.card.to} {...row.card} />
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
