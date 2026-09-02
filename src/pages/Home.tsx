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
import { BLANK_ID, TEMPLATES } from '../tools/score-sheet/templates'
import type { ToolMeta } from '../tools/types'

/** 注册表是静态的，分区在模块顶层切一次 —— 每次渲染重算会让下面的 useMemo 依赖白给 */
const QUICK = quickTools.filter((tool) => tool.onHome)
const GENERAL = tools.filter((tool) => tool.category === 'general')
const GAME = tools.filter((tool) => tool.category === 'game')

/**
 * 显式映射而非拼接类名：Tailwind 编译期扫描静态字符串，动态拼接会被漏掉。
 * 描边也带身份色：纯 border-line 在斜视时几张卡片会糊成一片。
 *
 * 一张表同时喂工具身份色与 quick 身份色，两个 union 合起来共七档 ——
 * 分成两张表只会让同一个 amber 在首页有两种写法。
 */
const ACCENT: Record<ToolMeta['accent'] | QuickAccent, string> = {
  amber: 'from-amber-500/20 border-amber-500/30 text-amber-300',
  emerald: 'from-emerald-500/20 border-emerald-500/30 text-emerald-300',
  sky: 'from-sky-500/20 border-sky-500/30 text-sky-300',
  violet: 'from-violet-500/20 border-violet-500/30 text-violet-300',
  rose: 'from-rose-500/20 border-rose-500/30 text-rose-300',
  teal: 'from-teal-500/20 border-teal-500/30 text-teal-300',
  neutral: 'from-surface-2 border-line text-text-muted',
}

/**
 * **三个区只有一档卡**：尺寸、内距、图槽、字号全一样，区与区之间只靠标题分段。
 * 桌上是斜视扫的，同一屏里出现三种卡片尺寸等于要重新对焦三次。
 * 代价是高度（取值与预算见 DESIGN.md §5），不要为了压高度再把某一区单独调小。
 */
const CARD =
  'flex items-center gap-3 rounded-2xl border bg-gradient-to-br to-surface p-3 text-left transition-transform duration-75 active:scale-95 short:gap-2 short:p-2'

/** 卡片同款，列数也就没有理由不同 */
const GRID = 'grid grid-cols-2 gap-3 wide:grid-cols-3 short:gap-2'

/** `action` 与标题同排：筛选框放在这里而不是列表上方，省一行高度 */
function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2 short:gap-1">
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-label">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/**
 * 盒图槽位。加载失败（离线、图没抓到）退回 emoji —— 卡片不能空一块，
 * 而且那个 emoji 本身就是能认出是哪款游戏的兜底。
 * 失败状态存在自己身上而不是改 `src`：改 src 会触发新一轮 onError 死循环。
 */
function Cover({ cover, icon }: { cover?: string; icon: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className="flex size-12 shrink-0 items-center justify-center short:size-10">
      {cover && !failed ? (
        <img
          // base 为相对路径，绝对的 /covers/... 在子目录部署下会 404
          src={`${import.meta.env.BASE_URL}${cover}`}
          alt=""
          loading="lazy"
          className="size-full rounded-lg object-contain"
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
      <span className="truncate text-base font-semibold text-text">{name}</span>
      <span className="truncate text-xs text-text-muted">{desc}</span>
    </span>
  )
}

/**
 * 跳工具页的那张卡（通用区与游戏专用区共用）。
 * `badge` 是给计分纸模板入口的第二编码：游戏专用区里混着两种目的地，颜色靠不住。
 */
type ToolCardProps = {
  to: string
  cover?: string
  icon: string
  name: string
  desc: string
  accent: ToolMeta['accent']
  ariaLabel?: string
  badge?: string
}

function ToolCard({ to, cover, icon, name, desc, accent, ariaLabel, badge }: ToolCardProps) {
  return (
    <Link to={to} aria-label={ariaLabel} className={`${CARD} ${ACCENT[accent]}`}>
      <Cover cover={cover} icon={icon} />
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
 *    带 `?tpl=` 直接落到那张表。项数多，标题行带筛选框（只筛这一区）
 *
 * 三个区共用同一档卡与同一套列数，见 `CARD` / `GRID`。
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
        accent: tool.accent,
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
          accent: scoreSheetMeta.accent,
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
      <div className="mx-auto flex max-w-5xl flex-col gap-4 short:gap-2">
        <Section title={t('home.quick')}>
          <div className={GRID}>
            {QUICK.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => openTool(tool.id)}
                className={`${CARD} ${ACCENT[tool.accent]}`}
              >
                {/* 功能图标继承 accent 的 text-*，槽位与另两个区的封面槽同尺寸 */}
                <span className="flex size-12 shrink-0 items-center justify-center short:size-10">
                  <tool.icon className="size-7 short:size-6" aria-hidden />
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
                accent={tool.accent}
              />
            ))}
          </div>
        </Section>

        <Section
          title={t('home.game')}
          action={
            <div className="relative w-44 wide:w-64">
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
          }
        >
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
