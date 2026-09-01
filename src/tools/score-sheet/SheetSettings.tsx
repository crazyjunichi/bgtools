import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Overlay } from '../../shared/components/Overlay'
import { SUPPORTED } from '../../shared/i18n'
import {
  IconClose,
  IconCsv,
  IconHistory,
  IconImage,
  IconRepeat,
  IconSearch,
  IconSelected,
} from '../../shared/icons'
import { FIELD } from './fieldStyle'
import { BLANK_ID, findTemplate, TEMPLATES, type SheetTemplate } from './templates'

type Props = {
  templateId: string
  /** 通用空白模板的条目数在 store 里（用户自己加的），模板常量里是空数组 */
  customCount: number
  /** 当前局有没有填过东西。空局导出只会得到一张全是 `·` 的图，两个导出按钮直接禁用 */
  canExport: boolean
  onPickTemplate: (templateId: string) => void
  onExportImage: () => void
  onExportCsv: () => void
  onOpenHistory: () => void
  onNewGame: () => void
  onClose: () => void
}

/** 三个出口按钮共用一档：次要操作，比 newGame 的实心档轻 */
const EXIT_BTN = 'btn-base gap-2 border border-line bg-surface-2 text-base short:!min-h-11'

/**
 * 模板选择 + 新一局。新一局收在浮层里而不直插键盘的动作行：
 * 那一行两格各约 120px，放不下 [ConfirmButton] 武装后的确认文案，
 * 而清空整局分数正是最不能省二次确认的操作。
 *
 * 模板过十个之后平铺按钮就不够看了，所以这里是「搜索框 + 框内纵滚的列表」：
 * 列表自己滚，浮层整体仍不滚（滚整个浮层会把新一局按钮推出视野）。
 */
export function SheetSettings({
  templateId,
  customCount,
  canExport,
  onPickTemplate,
  onExportImage,
  onExportCsv,
  onOpenHistory,
  onNewGame,
  onClose,
}: Props) {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState('')
  // 封面 404 时退回 emoji，同 [Home](../../pages/Home.tsx)：存 id 而不是改 src，改 src 会死循环
  const [broken, setBroken] = useState<ReadonlySet<string>>(new Set())

  const rows = useMemo(() => {
    const all = TEMPLATES.map((tpl) => ({
      tpl,
      name: t(tpl.nameKey),
      /**
       * 比对串 = **两个语言**的名字 + 别名。中文界面下打 `catan` / `azul` 也要命中，
       * 反过来也一样；别名补的是桌上的口头叫法（农家乐、翼展、车票之旅）
       */
      text: SUPPORTED.map((s) => {
        const fixed = i18n.getFixedT(s.lng)
        return `${fixed(tpl.nameKey)} ${tpl.aliasKey ? fixed(tpl.aliasKey) : ''}`
      })
        .join(' ')
        .toLowerCase(),
    }))

    // 通用空白钉在首位，其余按当前语言的名字排 —— 中文下是拼音序，比声明序好扫
    all.sort((a, b) =>
      a.tpl.id === BLANK_ID || b.tpl.id === BLANK_ID
        ? a.tpl.id === BLANK_ID
          ? -1
          : 1
        : a.name.localeCompare(b.name, i18n.language),
    )

    // 空白切分：多个词要**全部命中**（「七大 奇迹」「ticket ride」都算一次筛选）
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    return tokens.length > 0 ? all.filter((r) => tokens.every((k) => r.text.includes(k))) : all
  }, [t, i18n, query])

  const countOf = (tpl: SheetTemplate) => (tpl.editable ? customCount : tpl.entries.length)

  return (
    <Overlay
      title={<span className="text-lg font-bold">{t('tools.scoreSheet.settings.title')}</span>}
      onClose={onClose}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="section-label">{t('tools.scoreSheet.settings.template')}</span>
          {/* 搜到的结果里可能没有选中项，当前模板得有个常驻锚点 */}
          <span className="min-w-0 truncate text-xs text-text-dim">
            {t('tools.scoreSheet.settings.current', {
              name: t(findTemplate(templateId).nameKey),
            })}
          </span>
        </div>

        <div className="relative">
          <IconSearch
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-text-dim"
            aria-hidden
          />
          {/*
           * **不 autoFocus**：平板上软键盘一弹起就盖掉整张列表，而多数情况是直接点已有模板。
           * 想搜的人自己点一下输入框，代价只有一次点击
           */}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('tools.scoreSheet.settings.search')}
            aria-label={t('tools.scoreSheet.settings.search')}
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

        {/* 用 max-h 而非定高：只搜到两条时不该留一大块空白。约束的是高度，所以是 vh 不是 vmin */}
        <div className="flex max-h-[36vh] flex-col gap-2 overflow-y-auto short:max-h-[26vh]">
          {rows.map(({ tpl, name }) => {
            const on = tpl.id === templateId
            const cover = tpl.cover && !broken.has(tpl.id) ? tpl.cover : null
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  onPickTemplate(tpl.id)
                  onClose()
                }}
                // 选中态除了 sky 底色还带一个箭头：颜色不许是唯一编码
                className={`btn-base shrink-0 justify-between gap-3 border px-3 text-base short:!min-h-11 ${
                  on ? 'border-sky-500/60 bg-sky-500/15 text-sky-200' : 'border-line bg-surface-2'
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  {/* 盒图与 emoji 共用同一个方槽，换哪种都不影响行高 */}
                  <span className="flex size-10 shrink-0 items-center justify-center short:size-9">
                    {cover ? (
                      <img
                        // base 为相对路径，绝对的 /covers/... 在子目录部署下会 404
                        src={`${import.meta.env.BASE_URL}${cover}`}
                        alt=""
                        loading="lazy"
                        className="size-full rounded-lg object-contain"
                        onError={() => setBroken((s) => new Set(s).add(tpl.id))}
                      />
                    ) : (
                      <span className="text-2xl short:text-xl">{tpl.icon}</span>
                    )}
                  </span>
                  <span className="truncate">{name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {/* 条目数 = 这张表有多长，选之前就知道要填几行 */}
                  <span className="text-xs tabular-nums text-text-dim">
                    {t('tools.scoreSheet.settings.entryCount', { n: countOf(tpl) })}
                  </span>
                  {on && <IconSelected className="size-5" aria-hidden />}
                </span>
              </button>
            )
          })}
          {rows.length === 0 && (
            <span className="px-1 py-2 text-sm leading-relaxed text-text-muted">
              {t('tools.scoreSheet.settings.noMatch')}
            </span>
          )}
        </div>

        <p className="text-xs leading-relaxed text-text-dim">
          {t('tools.scoreSheet.settings.keepHint')}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="section-label">{t('tools.scoreSheet.settings.export')}</span>
        <div className="grid grid-cols-2 gap-2">
          {/*
           * 导出图片**不关这个浮层** —— 图片层是 z-30 的独立 lightbox，
           * 看完关掉自然回到这里。CSV 是即刻下载，留在原地也不打断什么
           */}
          <button
            type="button"
            onClick={onExportImage}
            disabled={!canExport}
            className={EXIT_BTN}
          >
            <IconImage className="size-6 short:size-5" aria-hidden />
            {t('tools.scoreSheet.settings.exportImage')}
          </button>
          <button type="button" onClick={onExportCsv} disabled={!canExport} className={EXIT_BTN}>
            <IconCsv className="size-6 short:size-5" aria-hidden />
            {t('tools.scoreSheet.settings.exportCsv')}
          </button>
        </div>

        {/* 历史是另一个浮层，沿用「同一时刻只开一个」：先关自己再开它 */}
        <button
          type="button"
          onClick={() => {
            onClose()
            onOpenHistory()
          }}
          className={EXIT_BTN}
        >
          <IconHistory className="size-6 short:size-5" aria-hidden />
          {t('tools.scoreSheet.settings.history')}
        </button>

        <p className="text-xs leading-relaxed text-text-dim">
          {t('tools.scoreSheet.settings.archiveHint')}
        </p>
      </div>

      <ConfirmButton
        onConfirm={() => {
          onNewGame()
          onClose()
        }}
        confirmText={t('tools.scoreSheet.settings.confirmNewGame')}
        className="short:!min-h-11"
      >
        <IconRepeat className="size-6 short:size-5" aria-hidden />
        {t('tools.scoreSheet.settings.newGame')}
      </ConfirmButton>
    </Overlay>
  )
}
