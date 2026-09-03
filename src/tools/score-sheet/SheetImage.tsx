import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { IconCheck, IconClose, IconNext, IconPrev, IconSave, IconShare } from '../../shared/icons'
import { canShareBlob, saveBlob, shareBlob } from '../../shared/match/share/save'
import { findSkin, SHARE_SKINS, type ShareSkinId } from '../../shared/match/share/skins'
import { findForm, SHEET_FORMS, type SheetFormId } from './png/layouts'

type Props = {
  /**
   * 画好的图。`null` = 第一张还在画。
   *
   * `url` 是 `blob` 的 objectURL，**由 [ScoreSheetPage](ScoreSheetPage.tsx) 建、也由它回收** ——
   * 建在这里就得靠 effect 的 cleanup 回收，而 StrictMode 会「setup → cleanup → setup」
   * 跑一遍挂载 effect，第一次 cleanup 就把 URL 撤了，图直接空白
   */
  image: { blob: Blob; url: string; filename: string } | null
  skin: ShareSkinId
  form: SheetFormId
  onSkin: (id: ShareSkinId) => void
  onForm: (id: SheetFormId) => void
  onClose: () => void
}

/**
 * 全屏看一张导出的 PNG，并当场换排版。**不是 [Overlay](../../shared/components/Overlay.tsx)** ——
 * 它是从设置浮层里打开的，得叠在那层（z-20）之上，所以走 `z-30` 自己一层；
 * 关掉后自然回到底下的浮层，不打断「同一时刻只开一个浮层」的约定。
 *
 * 主路径是**系统原生行为**：桌面右键「图片另存为」、平板长按出分享菜单。
 * 底下那两个按钮只是兜底（PWA standalone 里长按菜单有时被吞）。
 *
 * 布局上只有图是弹性块，标题行 / 切换区 / 按钮行都是刚性的（见 CLAUDE.md 的 quick 布局判据，
 * 这里同一套：切换区压不得，压了就点不到）。
 */
export function SheetImage({ image, skin, form, onSkin, onForm, onClose }: Props) {
  const { t } = useTranslation()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const shareable = useMemo(
    () => (image ? canShareBlob(image.blob, image.filename) : false),
    [image],
  )

  /*
   * 都过一遍 findSkin / findForm 而不是直接拿参数比：持久化下来的 id 可能是失效的旧值
   * （localStorage 里的东西不受类型约束），渲染器那边会兜回首项，
   * 这里不跟着兜就会出现「按钮一个都没亮，图却已经是第一种」。
   */
  const si = SHARE_SKINS.indexOf(findSkin(skin))
  const activeForm = findForm(form).id
  // 外观数量以后还会加，所以循环切而不是到头禁用 —— 两个箭头永远都能按
  const stepSkin = (d: number) =>
    onSkin(SHARE_SKINS[(si + d + SHARE_SKINS.length) % SHARE_SKINS.length].id)

  return (
    <div className="safe-b safe-t fixed inset-0 z-30 flex flex-col gap-2 bg-ink/95 p-3 backdrop-blur-sm">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <span className="section-label">{t('tools.scoreSheet.image.title')}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="btn-quiet !min-h-12 w-12 shrink-0 short:!min-h-11 short:w-11"
        >
          <IconClose className="size-5" aria-hidden />
        </button>
      </div>

      <div className="flex shrink-0 flex-col gap-2 wide:flex-row wide:items-center">
        {/*
          外观：只换配色，候选少而且以后还会加，用箭头翻不占版面。
          容器底色压到 surface —— 箭头是 btn-quiet（surface-2），同底色会让它俩糊成一片
        */}
        <div
          role="group"
          aria-label={t('tools.scoreSheet.image.skin')}
          className="flex items-center gap-1 rounded-xl border border-line bg-surface px-1 wide:w-56 wide:shrink-0"
        >
          <button
            type="button"
            onClick={() => stepSkin(-1)}
            aria-label={t('tools.scoreSheet.image.prevSkin')}
            className="btn-quiet !min-h-12 w-12 shrink-0 short:!min-h-11 short:w-11"
          >
            <IconPrev className="size-5" aria-hidden />
          </button>
          <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
            <span className="truncate text-sm text-text">{t(SHARE_SKINS[si].nameKey)}</span>
            {/* 有几种、现在是第几种：只给一个名字看不出还能不能再按 */}
            <span className="shrink-0 font-mono text-xs tabular-nums text-text-dim">
              {si + 1}/{SHARE_SKINS.length}
            </span>
          </span>
          <button
            type="button"
            onClick={() => stepSkin(1)}
            aria-label={t('tools.scoreSheet.image.nextSkin')}
            className="btn-quiet !min-h-12 w-12 shrink-0 short:!min-h-11 short:w-11"
          >
            <IconNext className="size-5" aria-hidden />
          </button>
        </div>

        {/* 内容形式：换的是画哪些数，属于并列的几种选择，只能单选平铺 */}
        <div
          role="group"
          aria-label={t('tools.scoreSheet.image.form')}
          className="grid grid-cols-3 gap-2 wide:min-w-0 wide:flex-1"
        >
          {SHEET_FORMS.map((f) => {
            const on = f.id === activeForm
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={on}
                onClick={() => onForm(f.id)}
                className={`btn-base min-w-0 gap-1.5 px-2 text-sm short:!min-h-11 ${
                  on
                    ? 'bg-sky-400 font-bold text-ink'
                    : 'border border-line bg-surface-2 text-text'
                }`}
              >
                {/* 选中态不只靠颜色：桌上斜视时实心底与淡底的差别不够稳 */}
                {on && <IconCheck className="size-5 shrink-0 short:size-4" aria-hidden />}
                <span className="truncate">{t(f.nameKey)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 图片周围的留白也能点关：一张全屏图上最自然的退出动作就是点旁边 */}
      <div
        className="flex min-h-0 flex-1 items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {image ? (
          /*
           * **必须 select-text**：`body` 上有 `user-select: none`，
           * iOS 会连带把长按图片的系统菜单一起抑制掉 —— 而那正是这个页面的主路径
           */
          <img
            src={image.url}
            alt={t('tools.scoreSheet.image.title')}
            className="max-h-full max-w-full select-text object-contain"
          />
        ) : (
          <span className="text-sm text-text-dim">{t('tools.scoreSheet.image.rendering')}</span>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2">
        <span className="text-xs leading-relaxed text-text-dim">
          {t('tools.scoreSheet.image.hint')}
        </span>
        <div className="flex w-full max-w-md gap-2">
          <button
            type="button"
            disabled={!image}
            onClick={() => {
              if (image) saveBlob(image.blob, image.filename)
            }}
            className="btn-base flex-1 gap-2 border border-line bg-surface-2 text-base short:!min-h-11"
          >
            <IconSave className="size-6 short:size-5" aria-hidden />
            {t('tools.scoreSheet.image.save')}
          </button>
          {/* 只有真能分享文件时才出这个按钮：桌面 Chrome 有 share 却不收文件，点了必然失败 */}
          {shareable && image && (
            <button
              type="button"
              onClick={() =>
                void shareBlob(image.blob, image.filename, t('tools.scoreSheet.image.title'))
              }
              className="btn-base flex-1 gap-2 border border-line bg-surface-2 text-base short:!min-h-11"
            >
              <IconShare className="size-6 short:size-5" aria-hidden />
              {t('tools.scoreSheet.image.share')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
