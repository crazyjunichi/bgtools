import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../components/ConfirmButton'
import { buzz } from '../haptics'
import { useWakeLock } from '../hooks/useWakeLock'
import { IconCheck, IconClose, IconRepeat } from '../icons'
import { ACCENT_BAR, ACCENT_FRAME, ACCENT_SOLID, ACCENT_TEXT, type DealAccent } from './accent'
import { buildDeck } from './deck'
import type { DealPool } from './online/backend'
import type { RoleCounts, RoleSet } from './types'
import { roleNameOf } from './types'

/**
 * 翻开后这段时间内的点击一律不算。桌上传过来接过去时很容易连点两下，
 * 没有这道闸门第二下会直接把牌盖上换到下一位 —— 身份一闪而过，只能重发一整轮。
 */
const GUARD_MS = 500

/** 盖上后停在「交给下一位」的时长：要够两个人完成一次交接，短了这句等于没出现 */
const HANDOFF_MS = 2000

/**
 * `handoff` 是盖上牌到下一位待翻之间的**过场**，不接受点击 —— 没有它的话
 * 盖上瞬间就变成"第 N 位，点卡查看"，看牌的人往往直接又点了下去。
 */
type Phase = 'pass' | 'reveal' | 'handoff'

type Props = {
  set: RoleSet
  counts: RoleCounts
  accent: DealAccent
  /** 内容型游戏的每身份一句内容，揭示时多显示一行；没有内容的身份不出这行 */
  pool?: DealPool
  onClose: () => void
}

/**
 * 轮传现场：一台设备沿桌传，每人点卡看自己的身份、看完盖上传给下一位。
 *
 * **热区只有正中那张卡，不是整屏** —— 交接时手指必然落在屏幕边缘，整屏可点
 * 会一路翻到别人的身份。也因此这里没套 [Overlay](../components/Overlay.tsx)：
 * 那个点遮罩即关闭，而关掉就等于中断整轮发牌。
 *
 * 牌堆只活在这个组件的 state 里，卸载即消失 —— 不落盘是刻意的，
 * 存下来等于把"谁是狼"留在本机上。
 */
export function DealRunner({ set, counts, accent, pool, onClose }: Props) {
  const { t } = useTranslation()
  const [deck, setDeck] = useState(() => buildDeck(set, counts))
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('pass')
  const [revealAt, setRevealAt] = useState(0)

  // 传一圈要一两分钟，中途息屏会打断
  useWakeLock()

  const done = index >= deck.length
  const role = set.roles.find((r) => r.id === deck[index])
  const content = role ? pool?.[role.id] : undefined
  const last = index === deck.length - 1

  // 过场到时自己散场，不需要谁来点一下
  useEffect(() => {
    if (phase !== 'handoff') return
    const id = window.setTimeout(() => setPhase('pass'), HANDOFF_MS)
    return () => window.clearTimeout(id)
  }, [phase])

  const handleCard = () => {
    if (done || phase === 'handoff') return
    if (phase === 'pass') {
      setPhase('reveal')
      setRevealAt(Date.now())
      buzz(20)
      return
    }
    if (Date.now() - revealAt < GUARD_MS) return
    setIndex(index + 1)
    // 最后一位盖上就直接到"全部发完"，没有下一位可交接
    setPhase(last ? 'pass' : 'handoff')
    buzz(last ? [10, 40, 10] : 20)
  }

  const restart = () => {
    setDeck(buildDeck(set, counts))
    setIndex(0)
    setPhase('pass')
    buzz(20)
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-ink/95 p-4 backdrop-blur-sm short:gap-2 short:p-2">
      {/*
       * 卡是唯一热区。两个方向都受视口约束，所以尺寸只能用 vmin ——
       * 竖屏下 vh 取的是长边，卡会直接撑出屏幕。
       */}
      {/*
       * 牌面装帧：素外框 + accent 内框 + 上下色条，刻意不用大圆角和整块淡底 ——
       * 那两样是按钮的读法。色条只在揭示/发完时出现，未翻牌与过场是牌背。
       */}
      <button
        type="button"
        onClick={handleCard}
        disabled={done || phase === 'handoff'}
        className="flex w-[min(26rem,68vmin)] min-h-[min(30rem,72vmin)] shrink-0 flex-col rounded-lg border border-line bg-surface-2 p-2 transition-transform duration-75 active:scale-95 disabled:active:scale-100 short:p-1.5"
      >
        <div
          className={`relative flex w-full flex-1 flex-col items-center justify-center gap-3 rounded border px-4 py-6 text-center short:gap-2 short:py-4 ${
            phase === 'reveal' || done ? ACCENT_FRAME[accent] : 'border-line'
          }`}
        >
          {(phase === 'reveal' || done) && (
            <>
              <span
                className={`absolute inset-x-3 top-2 h-0.5 rounded-full ${ACCENT_BAR[accent]}`}
                aria-hidden
              />
              <span
                className={`absolute inset-x-3 bottom-2 h-0.5 rounded-full ${ACCENT_BAR[accent]}`}
                aria-hidden
              />
            </>
          )}
        {done ? (
          <>
            <IconCheck className={`size-16 short:size-10 ${ACCENT_TEXT[accent]}`} aria-hidden />
            <span className="text-data-sm font-bold text-text">{t('dealRoles.done')}</span>
          </>
        ) : phase === 'reveal' && role ? (
          <>
            {/* 字面量身份没有图标：名字即主体，用户可自行在文本里带 emoji */}
            {role.icon && (
              <span className="text-6xl leading-none short:text-4xl" aria-hidden>
                {role.icon}
              </span>
            )}
            <span className="text-data-md font-bold leading-none text-text">
              {roleNameOf(role, t)}
            </span>
            {/* 阵营用文字给，不靠颜色：颜色不许是唯一识别编码 */}
            {role.teamKey && (
              <span className={`text-base font-semibold ${ACCENT_TEXT[accent]}`}>
                {t(role.teamKey)}
              </span>
            )}
            {/* 内容型游戏里这行才是真正要记住的东西（词/主题），与身份名同一档；形制同 RoleCard */}
            {content && (
              <span className="text-data-sm font-bold leading-tight text-text">{content}</span>
            )}
            <span className="mt-2 text-sm leading-relaxed text-text-muted short:mt-0">
              {t(last ? 'dealRoles.tapToFinish' : 'dealRoles.tapToHide')}
            </span>
          </>
        ) : (
          <>
            {/*
             * 座位号只报到第几位，不报剩下都是些什么身份 —— 那等于让最后一位反推出自己的牌。
             * 它在这里是核对用的次要信息，真正要人照做的那句才是大字；
             * 过场里连它也不出 —— 那两秒只该看见"把设备递出去"这一件事。
             */}
            {phase === 'pass' && (
              <span className="font-mono text-lg tabular-nums text-text-muted short:text-base">
                {t('dealRoles.seat', { n: index + 1, total: deck.length })}
              </span>
            )}
            <span className="text-data-sm font-bold leading-tight text-text">
              {t(phase === 'handoff' ? 'dealRoles.handoff' : 'dealRoles.tapToReveal')}
            </span>
          </>
        )}
        </div>
      </button>

      {/* 出口都在卡外：与卡是兄弟节点，点它们不会顺手把牌翻了 */}
      {done ? (
        /*
         * 发完了，主按钮是「关闭」—— 身份已经发好，回到游戏才是常态路径。
         * 「重新洗牌」作废所有人刚看过的身份，等于整轮重发：降级成次要位 + 二次确认。
         */
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`btn-base gap-2 px-5 text-base short:!min-h-11 short:text-sm ${ACCENT_SOLID[accent]}`}
          >
            <IconCheck className="size-5 short:size-4" aria-hidden />
            {t('common.close')}
          </button>
          <ConfirmButton
            onConfirm={restart}
            confirmText={t('dealRoles.againConfirm')}
            className="short:!text-sm"
          >
            <IconRepeat className="size-5 short:size-4" aria-hidden />
            {t('dealRoles.again')}
          </ConfirmButton>
        </div>
      ) : (
        /*
         * 中途退出压到**右上角**、不进卡下方那一排：它在每一位手上都会露出一次，
         * 摆在正中会跟"点卡看身份"抢注意力；而底部两角正是递设备时托着的位置，
         * 放那儿必被误触。它一按就得从第一位重发，所以仍要二次确认。
         * 偏移叠 env() 是为了在有刘海的机器上再往里推。
         */
        <ConfirmButton
          onConfirm={onClose}
          confirmText={t('dealRoles.stopConfirm')}
          className="absolute top-[env(safe-area-inset-top)] right-[env(safe-area-inset-right)] !min-h-12 !px-4 !text-sm"
        >
          <IconClose className="size-4" aria-hidden />
          {t('dealRoles.stop')}
        </ConfirmButton>
      )}
    </div>
  )
}
