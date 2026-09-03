import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconCheck, IconClose, IconCopy, IconOrder, IconSave, IconShare } from '../icons'
import type { MatchExport } from './detail'
import { durationText } from './format'
import { gameLabel } from './label'
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
   * 形态选择只收**能预览的**（png）：它回答「这局摆成什么样给人看」。
   * CSV 这类文件形态回答的是「拿什么格式拿走」，归到操作区做直接下载按钮，
   * 不进预览也不占选择的位子
   */
  const visualForms = useMemo(() => forms.filter((f) => f.ext === 'png'), [forms])
  const fileForms = useMemo(() => forms.filter((f) => f.ext !== 'png'), [forms])
  /*
   * 都过一遍兜底而不是直接拿 store 里的值比：persist 下来的 id 可能失效
   * （换了工具、改过名的旧值），渲染那边兜回首项，这里不跟着兜就会出现
   * 「按钮一个都没亮，图却已经是第一种」
   */
  const form = visualForms.find((f) => f.id === formId) ?? visualForms[0]
  const currentSkin = findSkin(skin).id

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
    const parts = [form.id, skin]
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

  /*
   * 文件形态（CSV 等）点了直接存，不进预览、也不动正在看的那张图。
   * build 失败只 warn：反解不出的是旧版本写下的局面，预览那条主路径不受影响
   */
  const onSaveFile = (f: MatchExport) => {
    void f
      .build(match, findSkin(skin).palette, t)
      .then((blob) => saveBlob(blob, stampName(match.toolId, match.endAt, f.ext, f.id)))
      .catch((e) => console.warn('[share] file export failed', e))
  }

  const { name: gameName } = gameLabel(t, match.gameId)

  return (
    <div className="safe-b safe-t fixed inset-0 z-30 flex flex-col gap-3 bg-ink/95 p-3 backdrop-blur-sm wide:flex-row">
      {/* 左/上区：头部 + 预览。预览是全页唯一的弹性块，控制区全刚性 */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <header className="flex shrink-0 items-center gap-3 pt-2">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-lg font-bold">{t('match.share.title')}</span>
            {/* 让人确认「这是哪一局」：图会脱离应用流传，面板自己得带上下文 */}
            <span className="truncate text-sm text-text-muted">
              {gameName} · {durationText(t, Math.max(0, match.endAt - match.startedAt))}
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="btn-quiet !min-h-12 w-12 shrink-0 short:!min-h-11 short:w-11"
          >
            <IconClose className="size-5" aria-hidden />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {/* 点图外空白关闭：一张全屏图上最自然的退出动作就是点旁边 */}
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
            ) : (
              /*
               * **必须 select-text**：`body` 上有 `user-select: none`，
               * iOS 会连带把长按图片的系统菜单一起抑制掉 —— 而那正是这一层的主路径
               */
              <img
                src={done.url}
                alt={t('match.share.title')}
                className="max-h-full max-w-full select-text rounded-lg object-contain ring-1 ring-line"
              />
            )}
          </div>
          {/* 说的是图，就贴着图 */}
          {!failed && (
            <span className="shrink-0 text-center text-xs text-text-dim">
              {t('match.share.hint')}
            </span>
          )}
        </div>
      </div>

      {/* 右/下区：控制与操作，竖屏贴底、横屏成右栏 */}
      <div className="flex shrink-0 flex-col gap-2 wide:w-80 wide:justify-center">
        {/* 只有一种形态时整行不渲染：没注册明细导出的工具只剩战绩榜，单段控件是纯噪音 */}
        {visualForms.length > 1 && (
          <div
            role="group"
            aria-label={t('match.share.form')}
            className="flex gap-1 rounded-xl bg-surface-2 p-1"
          >
            {visualForms.map((f) => {
              const on = f.id === form.id
              const Icon = f.icon
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setForm(f.id)}
                  className={`btn-base !min-h-12 min-w-0 flex-1 gap-1.5 !rounded-lg px-2 text-sm short:!min-h-11 ${
                    on ? 'bg-sky-400 font-bold text-ink' : 'text-text-muted'
                  }`}
                >
                  {/* 选中态是实心块对纯文字，形态差已够强 —— 不再叠勾，把宽度让给名字 */}
                  <Icon className="size-5 shrink-0 short:size-4" aria-hidden />
                  <span className="truncate">{t(f.nameKey)}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* 外观直选：缩略块直接画出那档配色的长相，不再箭头盲翻 */}
        <div role="group" aria-label={t('match.share.skin')} className="flex gap-2">
          {SHARE_SKINS.map((s) => {
            const on = s.id === currentSkin
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                onClick={() => setSkin(s.id)}
                className={`btn-base !min-h-0 min-w-0 flex-1 flex-col gap-1.5 border px-2 py-2 ${
                  on ? 'border-sky-500/60 bg-sky-500/15' : 'border-line bg-surface-2'
                }`}
              >
                <span
                  aria-hidden
                  className="flex h-10 w-full flex-col justify-center gap-1 rounded-md px-2"
                  style={{ background: s.palette.bg }}
                >
                  <span
                    className="h-1 w-2/5 rounded-full"
                    style={{ background: s.palette.text }}
                  />
                  <span
                    className="h-0.5 w-3/5 rounded-full"
                    style={{ background: s.palette.muted }}
                  />
                  <span className="h-px w-full" style={{ background: s.palette.rule }} />
                </span>
                <span className="flex items-center gap-1 text-xs">
                  {on && <IconCheck className="size-3.5 shrink-0" aria-hidden />}
                  {t(s.nameKey)}
                </span>
              </button>
            )
          })}
        </div>

        {/*
          一主两次：主按钮是能直接把图发出去的那个动作。系统分享不可用的设备
          （桌面浏览器多半不收文件）上「保存」升主。复制文本不依赖画出来的图，画失败也能按
        */}
        <div className="flex gap-2">
          {shareable && done ? (
            <>
              <button
                type="button"
                onClick={() => void shareBlob(done.blob, done.filename, t('match.share.title'))}
                className="btn-base min-w-0 flex-1 gap-2 bg-sky-400 text-base font-bold text-ink short:!min-h-11"
              >
                <IconShare className="size-6 shrink-0 short:size-5" aria-hidden />
                <span className="truncate">{t('match.share.shareBtn')}</span>
              </button>
              <button
                type="button"
                onClick={() => saveBlob(done.blob, done.filename)}
                aria-label={t('match.share.save')}
                className="btn-quiet w-14 shrink-0 short:!min-h-11 short:w-11"
              >
                <IconSave className="size-6 short:size-5" aria-hidden />
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={done === null}
              onClick={() => {
                if (done) saveBlob(done.blob, done.filename)
              }}
              className="btn-base min-w-0 flex-1 gap-2 bg-sky-400 text-base font-bold text-ink short:!min-h-11"
            >
              <IconSave className="size-6 shrink-0 short:size-5" aria-hidden />
              <span className="truncate">{t('match.share.save')}</span>
            </button>
          )}
          {/* 文件形态（CSV 等）：不是「摆成什么样」，点了直接存 */}
          {fileForms.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-label={t(f.nameKey)}
              onClick={() => onSaveFile(f)}
              className="btn-quiet w-14 shrink-0 short:!min-h-11 short:w-11"
            >
              <f.icon className="size-6 short:size-5" aria-hidden />
            </button>
          ))}
          {canCopyText() && (
            <button
              type="button"
              onClick={onCopy}
              aria-label={t(copied ? 'match.share.copied' : 'match.share.copyText')}
              className="btn-quiet w-14 shrink-0 short:!min-h-11 short:w-11"
            >
              {copied ? (
                <IconCheck className="size-6 text-emerald-300 short:size-5" aria-hidden />
              ) : (
                <IconCopy className="size-6 short:size-5" aria-hidden />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
