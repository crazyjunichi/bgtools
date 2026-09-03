import { useTranslation } from 'react-i18next'
import { ACCENT_SOFT, ACCENT_TEXT, type DealAccent } from '../accent'
import type { Role } from '../types'

type Props = {
  role: Role
  /** 内容型游戏那一句（关键词之类），来自数据库的内容池；没有就不出这一行 */
  content?: string
  accent: DealAccent
}

/**
 * 揭示态的那张牌。形制沿用 [DealRunner](../DealRunner.tsx)（emoji + 身份名 + 阵营文字），
 * 但**不是按钮**：扫码这条路上牌只揭示一次，没有"点一下盖上"这个动作。
 */
export function RoleCard({ role, content, accent }: Props) {
  const { t } = useTranslation()

  return (
    <div
      className={`flex w-[min(26rem,68vmin)] min-h-[min(30rem,72vmin)] shrink-0 flex-col items-center justify-center gap-3 rounded-3xl border-2 p-6 text-center short:gap-2 short:p-4 ${ACCENT_SOFT[accent]}`}
    >
      <span className="text-6xl leading-none short:text-4xl" aria-hidden>
        {role.icon}
      </span>
      <span className="text-data-md font-bold leading-none text-text">{t(role.nameKey)}</span>
      {/* 阵营用文字给，不靠颜色：颜色不许是唯一识别编码 */}
      <span className={`text-base font-semibold ${ACCENT_TEXT[accent]}`}>{t(role.teamKey)}</span>
      {/* 关键词类游戏里这句才是真正要记住的东西，跟身份名同一档 */}
      {content && <span className="text-data-sm font-bold leading-tight text-text">{content}</span>}
      <span className="mt-2 text-sm leading-relaxed text-text-muted short:mt-0">
        {t('dealRoles.online.keepSecret')}
      </span>
    </div>
  )
}
