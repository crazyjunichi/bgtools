import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Overlay } from '../../shared/components/Overlay'
import { IconDelete, IconShare } from '../../shared/icons'
import { useArchiveStore } from '../../shared/match/archive'
import type { MatchTool } from '../../shared/match/detail'
import { dateTimeText, durationText } from '../../shared/match/format'
import { gameLabel } from '../../shared/match/label'
import { MatchChips } from '../../shared/match/MatchChips'
import { MatchNote } from '../../shared/match/MatchNote'
import { MatchShare } from '../../shared/match/MatchShare'
import type { Match } from '../../shared/match/types'
import { tools } from '../registry'

type Props = { match: Match; onClose: () => void }

/**
 * 回看一局：名单 + **记它的那个工具自己画的细则** + 备注 + 分享 + 删除。
 *
 * 细则来自注册表（[MatchTool](../../shared/match/detail.ts)），整份懒加载 ——
 * 统计页首屏不该把各工具的模板常量与 canvas 渲染器一起打进来。
 * 没注册细则的工具、以及旧存档，只剩上面那份名单，其余照用。
 */
export function MatchDetail({ match, onClose }: Props) {
  const { t } = useTranslation()
  const remove = useArchiveStore((s) => s.remove)
  const [tool, setTool] = useState<MatchTool | null>(null)
  const [failed, setFailed] = useState(false)
  const [sharing, setSharing] = useState(false)

  /*
   * 旧存档不去加载细则视图：它那份 payload 是 v1 的形状，反解出来也是一张空表。
   * 在渲染期算而不是进 effect 判断 —— effect 里同步 setState 是被禁的
   */
  const loader = match.legacy ? undefined : tools.find((x) => x.id === match.toolId)?.match

  useEffect(() => {
    if (loader === undefined) return
    let alive = true
    loader()
      .then((m) => {
        if (alive) setTool(m)
      })
      // 拿不到通常是刚更新过、旧 chunk 已经没了，说一句就行，别把整个浮层带走
      .catch((e) => {
        console.warn('[match] detail load failed', e)
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [loader])

  const { name, icon } = gameLabel(t, match.gameId)
  const spent = match.endAt - match.startedAt
  const Detail = tool?.Detail

  // 有细则可看时 chips 纯属重复（表头有名字颜色、合计有 👑 分数）；细则看不了它就是唯一内容，兜底
  const showChips = loader === undefined || failed

  return (
    <Overlay
      maxWidth="max-w-3xl"
      title={
        <span className="flex min-w-0 flex-col">
          <span className="flex min-w-0 items-baseline gap-2">
            {icon !== null && <span aria-hidden>{icon}</span>}
            <span className="truncate text-base font-bold">{name}</span>
          </span>
          <span className="truncate text-xs tabular-nums text-text-dim">
            {dateTimeText(match.endAt)}
            {/* 旧局没记开局时刻，时长会是 0，那就不显示这一段 */}
            {spent > 0 && ` · ${durationText(t, spent)}`}
          </span>
        </span>
      }
      onClose={onClose}
    >
      {showChips && (
        <div className="flex flex-col gap-2">
          <span className="section-label">{t('match.players')}</span>
          <MatchChips players={match.players} />
        </div>
      )}

      {loader !== undefined && (
        <div className="flex min-h-0 flex-col gap-2">
          {Detail ? (
            <Detail match={match} />
          ) : failed ? (
            <span className="text-sm leading-relaxed text-amber-300">
              {t('match.detail.failed')}
            </span>
          ) : (
            <span className="text-sm text-text-muted">{t('common.loading')}</span>
          )}
        </div>
      )}

      {/* 备注是记录里唯一能事后改的字段；旧存档没有入口，这个组件自己返回 null */}
      <MatchNote key={match.id} match={match} />

      {/* 阅读页的操作就两个：分享是主路径，删除降级成小图标（仍走二次确认） */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSharing(true)}
          className="btn-base min-w-0 flex-1 gap-2 border border-line bg-surface-2 text-base short:!min-h-11"
        >
          <IconShare className="size-6 short:size-5" aria-hidden />
          {t('match.share.title')}
        </button>
        <ConfirmButton
          aria-label={t('common.delete')}
          confirmText={t('common.confirmDelete')}
          className="shrink-0 !px-4"
          onConfirm={() => {
            void remove(match.id)
            onClose()
          }}
        >
          <IconDelete className="size-6 short:size-5" aria-hidden />
        </ConfirmButton>
      </div>

      {/* 明细导出跟着细则一起来：还没加载完就只有通用战绩榜，那也出得来 */}
      {sharing && (
        <MatchShare match={match} exports={tool?.exports} onClose={() => setSharing(false)} />
      )}
    </Overlay>
  )
}
