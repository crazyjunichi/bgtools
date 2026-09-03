import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconCheck, IconClose, IconCopy, IconNext, IconOrder, IconPrev, IconSave, IconShare } from '../icons'
import type { MatchExport } from './detail'
import { boardFromMatch } from './share/board'
import { renderRank } from './share/rank'
import { canShareBlob, saveBlob, shareBlob, stampName } from './share/save'
import { findSkin, SHARE_SKINS } from './share/skins'
import { canCopyText, copyText, matchSummary } from './share/summary'
import { useShareStore } from './shareStore'
import type { MatchDraft } from './types'

/**
 * 通用战绩榜：只要名次和总分，所以**任何工具的任何一局都出得来**。
 * 排在工具自己那些明细形态之后，也就成了没注册导出的工具的唯一形态。
 */
const RANK: MatchExport = {
  id: 'rank',
  nameKey: 'match.share.forms.rank',
  icon: IconOrder,
  ext: 'png',
  build: async (m, p, t) => renderRank(boardFromMatch(m, t), p, t('match.share.brand')),
}

type Props = {
  /** 要分享的那一局。**入参是快照**：面板开着的时候桌上继续填分不该改变已经画出来的图 */
  match: MatchDraft
  /** 这个工具自己的明细导出（见 [MatchExport](detail.ts)）。没有就只剩通用战绩榜 */
  exports?: readonly MatchExport[]
  onClose: () => void
}

/** 「已复制」这个反馈留多久：够看见，又不至于让人以为它是个状态 */
const COPIED_MS = 1600

/** 一次生成的结果。`key` = 形态 + 外观，认出它属于哪一次选择 */
type Out =
  | { key: string; kind: 'ok'; blob: Blob; url: string; filename: string }
  | { key: string; kind: 'fail' }

/**
 * 分享一局：换形态 / 换外观、看图、保存、走系统面板、复制文本摘要。
 *
 * **不是 [Overlay](../components/Overlay.tsx)** —— 它从别的浮层里打开（更多操作、历史、结算），
 * 得叠在那层之上，所以走 `z-30` 自己一层；关掉自然回到底下那一层。
 *
 * 图片的主路径是**系统原生行为**：桌面右键「图片另存为」、平板长按出分享菜单。
 * 底下那几个按钮是兜底（PWA standalone 里长按菜单有时被吞）。
 *
 * 布局上只有预览区是弹性块，标题行 / 切换区 / 按钮行都是刚性的（同 CLAUDE.md 的 quick 判据：
 * 切换区压不得，压了就点不到）。
 */
export function MatchShare({ match, exports, onClose }: Props) {
  const { t } = useTranslation()
  const { skin, form: formId, setSkin, setForm } = useShareStore()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const forms = useMemo(() => [...(exports ?? []), RANK], [exports])
  /*
   * 都过一遍兜底而不是直接拿 store 里的值比：persist 下来的 id 可能失效
   * （换了工具、改过名的旧值），渲染那边兜回首项，这里不跟着兜就会出现
   * 「按钮一个都没亮，图却已经是第一种」
   */
  const form = forms.find((f) => f.id === formId) ?? forms[0]
  const si = SHARE_SKINS.indexOf(findSkin(skin))
  // 外观数量以后还会加，所以循环切而不是到头禁用 —— 两个箭头永远都能按
  const stepSkin = (d: number) => setSkin(SHARE_SKINS[(si + d + SHARE_SKINS.length) % SHARE_SKINS.length].id)

  /**
   * 画好的东西，**成功与失败同一个 state**：出错要把上一张撤下来，两者互斥。
   * objectURL 与 blob 一起进 state 而不是各自一个 effect —— 建在另一个 effect 里
   * 会被 StrictMode 的「setup → cleanup → setup」撤掉。
   *
   * `key` 记的是它属于哪一次选择，用来在渲染期认出「这是上一次的结果」，
   * 于是切形态时不必再拿一个 state 去清失败标记。
   */
  const [out, setOut] = useState<Out | null>(null)
  const key = `${form.id}|${skin}`

  /*
   * 形态或外观一变就重画。**不先清 out**：让上一张留在屏上直到新的就绪，
   * 否则每次点箭头都闪一下空白（画一张只要几十毫秒，闪比等更难受）。
   *
   * alive 防的是后发先至：连点箭头时两次渲染并行，先完成的那次不一定是最后选的那种。
   */
  useEffect(() => {
    let alive = true
    // 外观只影响画出来的图，CSV 这类形态不该因为切了外观就换个文件名
    const parts = form.ext === 'png' ? [form.id, skin] : [form.id]
    form
      .build(match, findSkin(skin).palette, t)
      .then((blob) => {
        if (!alive) return
        setOut({
          key,
          kind: 'ok',
          blob,
          url: URL.createObjectURL(blob),
          filename: stampName(match.toolId, match.endAt, form.ext, ...parts),
        })
      })
      /*
       * 出不来是正常分支：payload 反解不出（别的版本写下的局面）、
       * 极老 Safari 拿不到 2d 上下文。桌上的分数还在表里，不该连页面一起带走
       */
      .catch((e) => {
        console.warn('[share] build failed', e)
        if (alive) setOut({ key, kind: 'fail' })
      })
    return () => {
      alive = false
    }
  }, [match, form, skin, key, t])

  /*
   * 回收 objectURL。写成 effect 而不是塞进关闭回调：路由切走（浏览器返回）时
   * 这一层会直接卸载，那条路径上没有「关闭」这个动作。
   * 换成另一张图时 cleanup 也会先跑，撤掉的正是上一张，不会漏。
   */
  useEffect(() => {
    const url = out?.kind === 'ok' ? out.url : undefined
    return url ? () => URL.revokeObjectURL(url) : undefined
  }, [out])

  // 上一次的失败不算这一次的：换了形态就退回「正在生成」，等新结果
  const failed = out?.kind === 'fail' && out.key === key
  const done = out?.kind === 'ok' ? out : null
  const shareable = useMemo(() => (done ? canShareBlob(done.blob, done.filename) : false), [done])

  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(copyTimer.current), [])

  const onCopy = () => {
    void copyText(matchSummary(match, t)).then((ok) => {
      if (!ok) return
      setCopied(true)
      copyTimer.current = window.setTimeout(() => setCopied(false), COPIED_MS)
    })
  }

  return (
    <div className="safe-b safe-t fixed inset-0 z-30 flex flex-col gap-2 bg-ink/95 p-3 backdrop-blur-sm">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <span className="section-label">{t('match.share.title')}</span>
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
          aria-label={t('match.share.skin')}
          className="flex items-center gap-1 rounded-xl border border-line bg-surface px-1 wide:w-56 wide:shrink-0"
        >
          <button
            type="button"
            onClick={() => stepSkin(-1)}
            aria-label={t('match.share.prevSkin')}
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
            aria-label={t('match.share.nextSkin')}
            className="btn-quiet !min-h-12 w-12 shrink-0 short:!min-h-11 short:w-11"
          >
            <IconNext className="size-5" aria-hidden />
          </button>
        </div>

        {/*
          形态：换的是导出什么，属于并列的几种选择，只能单选平铺。
          用 flex-wrap 而不是固定列数 —— 各工具注册的形态个数不一样，
          写死列数会在只有两种时留一半空白
        */}
        <div
          role="group"
          aria-label={t('match.share.form')}
          className="flex flex-wrap gap-2 wide:min-w-0 wide:flex-1"
        >
          {forms.map((f) => {
            const on = f.id === form.id
            const Icon = f.icon
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={on}
                onClick={() => setForm(f.id)}
                className={`btn-base min-w-0 flex-1 basis-28 gap-1.5 px-2 text-sm short:!min-h-11 ${
                  on ? 'bg-sky-400 font-bold text-ink' : 'border border-line bg-surface-2 text-text'
                }`}
              >
                {/* 选中态不只靠颜色：桌上斜视时实心底与淡底的差别不够稳 */}
                <Icon className="size-5 shrink-0 short:size-4" aria-hidden />
                <span className="truncate">{t(f.nameKey)}</span>
                {on && <IconCheck className="size-5 shrink-0 short:size-4" aria-hidden />}
              </button>
            )
          })}
        </div>
      </div>

      {/* 预览周围的留白也能点关：一张全屏图上最自然的退出动作就是点旁边 */}
      <div
        className="flex min-h-0 flex-1 items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {failed ? (
          <span className="max-w-sm text-center text-sm leading-relaxed text-amber-300">
            {t('match.share.failed')}
          </span>
        ) : done === null ? (
          <span className="text-sm text-text-dim">{t('match.share.rendering')}</span>
        ) : form.ext === 'png' ? (
          /*
           * **必须 select-text**：`body` 上有 `user-select: none`，
           * iOS 会连带把长按图片的系统菜单一起抑制掉 —— 而那正是这一层的主路径
           */
          <img
            src={done.url}
            alt={t('match.share.title')}
            className="max-h-full max-w-full select-text object-contain"
          />
        ) : (
          /* 表格类形态没法看图，给一块「已经生成好了、按下面的按钮拿走」的占位 */
          <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface px-6 py-5">
            <form.icon className="size-10 text-text-muted" aria-hidden />
            <span className="max-w-64 break-all text-center font-mono text-xs text-text-muted">
              {done.filename}
            </span>
            <span className="text-sm text-text-dim">{t('match.share.noPreview')}</span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2">
        {form.ext === 'png' && (
          <span className="text-xs leading-relaxed text-text-dim">{t('match.share.hint')}</span>
        )}
        <div className="flex w-full max-w-md gap-2">
          <button
            type="button"
            disabled={done === null}
            onClick={() => {
              if (done) saveBlob(done.blob, done.filename)
            }}
            className="btn-base min-w-0 flex-1 gap-2 border border-line bg-surface-2 text-base short:!min-h-11"
          >
            <IconSave className="size-6 shrink-0 short:size-5" aria-hidden />
            <span className="truncate">{t('match.share.save')}</span>
          </button>
          {/* 只有真能分享文件时才出这个按钮：桌面 Chrome 有 share 却不收文件，点了必然失败 */}
          {shareable && done && (
            <button
              type="button"
              onClick={() => void shareBlob(done.blob, done.filename, t('match.share.title'))}
              className="btn-base min-w-0 flex-1 gap-2 border border-line bg-surface-2 text-base short:!min-h-11"
            >
              <IconShare className="size-6 shrink-0 short:size-5" aria-hidden />
              <span className="truncate">{t('match.share.shareBtn')}</span>
            </button>
          )}
          {/*
            文本摘要与图并列而不是它的降级：很多群只看得到文字预览。
            这条路径不依赖上面画出来的东西，所以画失败了它照样能按
          */}
          {canCopyText() && (
            <button
              type="button"
              onClick={onCopy}
              className="btn-base min-w-0 flex-1 gap-2 border border-line bg-surface-2 text-base short:!min-h-11"
            >
              {copied ? (
                <IconCheck className="size-6 shrink-0 text-emerald-300 short:size-5" aria-hidden />
              ) : (
                <IconCopy className="size-6 shrink-0 short:size-5" aria-hidden />
              )}
              <span className="truncate">{t(copied ? 'match.share.copied' : 'match.share.copyText')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
