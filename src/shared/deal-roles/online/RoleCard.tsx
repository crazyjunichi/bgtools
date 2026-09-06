import { useTranslation } from 'react-i18next'
import { ACCENT_BAR, ACCENT_FRAME, ACCENT_TEXT, type DealAccent } from '../accent'
import { roleNameOf, type Role } from '../types'

type Props = {
  role: Role
  /** 内容型游戏那一句（关键词之类），来自数据库的内容池；没有就不出这一行 */
  content?: string
  accent: DealAccent
  /** 盲发局（[RoleSet.blind](../types.ts)）：身份三行不渲染，牌面只剩内容 */
  blind?: boolean
}

/**
 * 揭示态的那张牌。形制沿用 [DealRunner](../DealRunner.tsx)（emoji + 身份名 + 阵营文字），
 * 但**不是按钮**：扫码这条路上牌只揭示一次，没有"点一下盖上"这个动作。
 */
export function RoleCard({ role, content, accent, blind }: Props) {
  const { t } = useTranslation()

  return (
    <div className="flex w-[min(26rem,68vmin)] min-h-[min(30rem,72vmin)] shrink-0 flex-col rounded-lg border border-line bg-surface-2 p-2 short:p-1.5">
      <div
        className={`relative flex w-full flex-1 flex-col items-center justify-center gap-3 rounded border px-4 py-6 text-center short:gap-2 short:py-4 ${ACCENT_FRAME[accent]}`}
      >
        <span
          className={`absolute inset-x-3 top-2 h-0.5 rounded-full ${ACCENT_BAR[accent]}`}
          aria-hidden
        />
        <span
          className={`absolute inset-x-3 bottom-2 h-0.5 rounded-full ${ACCENT_BAR[accent]}`}
          aria-hidden
        />
        {/* 字面量身份（自定义发身份）没有图标与阵营：名字即主体 */}
        {!blind && role.icon && (
          <span className="text-6xl leading-none short:text-4xl" aria-hidden>
            {role.icon}
          </span>
        )}
        {!blind && (
          <span className="text-data-md font-bold leading-none text-text">{roleNameOf(role, t)}</span>
        )}
        {/* 阵营用文字给，不靠颜色：颜色不许是唯一识别编码 */}
        {!blind && role.teamKey && (
          <span className={`text-base font-semibold ${ACCENT_TEXT[accent]}`}>
            {t(role.teamKey)}
          </span>
        )}
        {/* 关键词类游戏里这句才是真正要记住的东西，跟身份名同一档 */}
        {content && <span className="text-data-sm font-bold leading-tight text-text">{content}</span>}
        <span className="mt-2 text-sm leading-relaxed text-text-muted short:mt-0">
          {t('dealRoles.online.keepSecret')}
        </span>
      </div>
    </div>
  )
}
