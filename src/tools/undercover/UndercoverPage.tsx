import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ToolLayout } from '../../shared/components/ToolLayout'
import { DealRoles } from '../../shared/deal-roles/DealRoles'
import type { DealPool } from '../../shared/deal-roles/online/backend'
import type { RoleSet } from '../../shared/deal-roles/types'
import { buzz } from '../../shared/haptics'
import { IconCheck, IconDeal } from '../../shared/icons'
import { rollDie } from '../../shared/random'
import { PAIRS, type WordPair } from './pairs'
import { UNDERCOVER_ROLES } from './roles'
import { useUndercoverStore } from './store'

const ACCENT = 'amber' as const

/** 一次发牌的全部输入：点发牌那一刻冻结（同 deal-custom 的约定） */
type DealInput = { set: RoleSet; pool: DealPool }

/**
 * 谁是卧底的发牌机器。页面本身只是启动台：规则一眼看完，点发身份抽一对词、
 * 进配比面板，之后轮传/扫码那两条路与其它游戏完全共用。
 *
 * 词对只活在 deal state 里，不落盘 —— 词落盘等于把答案留在本机上。
 */
export default function UndercoverPage() {
  const { t } = useTranslation()
  const blind = useUndercoverStore((s) => s.blind)
  const setBlind = useUndercoverStore((s) => s.setBlind)
  const [deal, setDeal] = useState<DealInput | null>(null)
  // 连着两局同一对词太扫兴：撞了重抽一次，再撞认命（同 fake-artist 的策略）
  const lastPair = useRef<WordPair | null>(null)

  const openDeal = () => {
    let pair = PAIRS[rollDie(PAIRS.length) - 1]
    if (pair === lastPair.current) pair = PAIRS[rollDie(PAIRS.length) - 1]
    lastPair.current = pair
    // 哪边当平民词也随机：固定 [0] 给平民的话，词对的导出顺序会漏"谁是卧底词"
    const [civilian, undercover] = rollDie(2) === 1 ? pair : [pair[1], pair[0]]
    // 盲发局不给白板写提示语：他的牌就该是空的，提示语一出等于亮身份
    setDeal({
      set: { ...UNDERCOVER_ROLES, blind },
      pool: blind
        ? { civilian, undercover }
        : { civilian, undercover, blank: t('tools.undercover.blankHint') },
    })
    buzz(20)
  }

  return (
    <>
      <ToolLayout
        panelWidth="narrow"
        panel={
          <>
            <div className="flex shrink-0 flex-col gap-1.5">
              <span className="section-label">{t('tools.undercover.blindLabel')}</span>
              {/*
               * aria-pressed 开关同 QuickSettings 的写法：选中态不只靠颜色，
               * 另有一枚 ✓（多态控件至少两种编码）
               */}
              <button
                type="button"
                aria-pressed={blind}
                onClick={() => {
                  setBlind(!blind)
                  buzz()
                }}
                className={`btn-base w-full gap-2 short:!min-h-11 ${
                  blind
                    ? 'border border-amber-500/60 bg-amber-500/15 text-amber-300'
                    : 'bg-surface-2 text-text-muted'
                }`}
              >
                {blind && <IconCheck className="size-5 short:size-4" aria-hidden />}
                {t('tools.undercover.blind')}
              </button>
              <p className="text-xs leading-relaxed text-text-dim">
                {t('tools.undercover.blindHint')}
              </p>
            </div>
            <button
              type="button"
              onClick={openDeal}
              className="btn-base min-h-16 shrink-0 gap-2 bg-amber-400 text-xl font-bold text-ink eink-solid short:!min-h-12 short:text-base"
            >
              <IconDeal className="size-6 short:size-5" aria-hidden />
              {t('dealRoles.open')}
            </button>
          </>
        }
      >
        <div className="card flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <span className="text-6xl leading-none" aria-hidden>
            🕵️
          </span>
          <p className="max-w-md text-base leading-relaxed text-text-muted">
            {t('tools.undercover.intro')}
          </p>
          <span className="font-mono text-sm tabular-nums text-text-dim">
            {t('tools.undercover.pairs', { n: PAIRS.length })}
          </span>
        </div>
      </ToolLayout>
      {deal && (
        <DealRoles set={deal.set} accent={ACCENT} pool={deal.pool} onClose={() => setDeal(null)} />
      )}
    </>
  )
}
