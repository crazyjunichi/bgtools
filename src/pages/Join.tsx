import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { ACCENT_SOLID, type DealAccent } from '../shared/deal-roles/accent'
import { faultCodeOf, type DealErrorCode } from '../shared/deal-roles/online/backend'
import { claimCard } from '../shared/deal-roles/online/claim'
import { errorKeyOf } from '../shared/deal-roles/online/messages'
import { decodePayload } from '../shared/deal-roles/online/payload'
import { pickCard, type PickedCard } from '../shared/deal-roles/online/pick'
import { backendFor } from '../shared/deal-roles/online/resolve'
import { RoleCard } from '../shared/deal-roles/online/RoleCard'
import { roleSetOf } from '../shared/deal-roles/registry'
import { htmlLangOf } from '../shared/i18n'

/**
 * 玩家侧没有宿主工具页，认色只能自己定一档。要让它跟着游戏变的话，
 * accent 得并进 [RoleSet](../shared/deal-roles/types.ts) —— 现在只有一款游戏用发身份，
 * 为此加一个字段不值得。
 */
const ACCENT: DealAccent = 'violet'

type View =
  | { k: 'loading' }
  | { k: 'card'; card: PickedCard; blind?: boolean }
  | { k: 'soldOut' }
  | { k: 'unknownSet' }
  | { k: 'error'; code: DealErrorCode }

/**
 * 扫码后的落地页。**挂在 `App` 之外**（与 `/` 平级）：玩家不是来用工具箱的，
 * 顶栏那些名单/设置按钮对他毫无意义，他一进来就该看到自己的牌。
 *
 * 进页面即自动领牌，**零点击**。身份是从二维码里的配比 + 种子 + 自己的排队序号
 * 当场算出来的，不落盘（[joinStore](../shared/deal-roles/online/joinStore.ts) 只记 rid）。
 */
export default function Join() {
  const { t, i18n } = useTranslation()
  const { search } = useLocation()
  /** 重试计数：换个值就让下面那个 effect 再跑一遍 */
  const [attempt, setAttempt] = useState(0)
  const [done, setDone] = useState<{ round: string; view: View } | null>(null)

  /*
   * 结果带上它属于哪一轮，loading 在渲染期推出来而不是在 effect 里同步置 ——
   * 这样重扫另一局（search 变了、组件没重挂）不会先闪一下上一局的牌。
   */
  const round = `${attempt}:${search}`
  const view: View = done?.round === round ? done.view : { k: 'loading' }

  // App 里那个 effect 管不到这条路由（这一页不在它下面），lang 得自己设
  useEffect(() => {
    document.documentElement.lang = htmlLangOf(i18n.language)
  }, [i18n.language])

  useEffect(() => {
    let alive = true
    const settle = (v: View) => {
      if (alive) setDone({ round, view: v })
    }
    const run = async () => {
      try {
        const p = decodePayload(search)
        const set = roleSetOf(p.setId)
        if (!set) {
          settle({ k: 'unknownSet' })
          return
        }
        const res = await claimCard(backendFor(p.target), p.gameId)
        const card = pickCard(set, p.counts, p.seed, res.rank, res.pool)
        settle(card ? { k: 'card', card, blind: p.blind } : { k: 'soldOut' })
      } catch (e) {
        settle({ k: 'error', code: faultCodeOf(e) })
      }
    }
    void run()
    return () => {
      alive = false
    }
  }, [round, search])

  return (
    <div className="safe-x safe-t safe-b flex h-full flex-col items-center justify-center gap-4 p-4 short:gap-2 short:p-2">
      {view.k === 'card' ? (
        <RoleCard role={view.card.role} content={view.card.content} accent={ACCENT} blind={view.blind} />
      ) : view.k === 'loading' ? (
        <span className="text-data-sm font-bold text-text">{t('dealRoles.online.joining')}</span>
      ) : view.k === 'soldOut' ? (
        <div className="card flex w-full max-w-lg flex-col gap-3">
          <span className="text-data-sm font-bold text-text">{t('dealRoles.online.soldOut')}</span>
          <p className="text-base leading-relaxed text-text-muted">
            {t('dealRoles.online.soldOutHint')}
          </p>
        </div>
      ) : (
        <div className="card flex w-full max-w-lg flex-col gap-4">
          <p className="text-base leading-relaxed text-amber-300">
            {t(view.k === 'unknownSet' ? 'dealRoles.online.unknownSet' : errorKeyOf(view.code))}
          </p>
          {/* 认不出游戏的话重试也没用，那只能等更新 —— 只有网络/配置类错误给重试 */}
          {view.k === 'error' && (
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className={`btn-base self-start px-5 text-base ${ACCENT_SOLID[ACCENT]}`}
            >
              {t('dealRoles.online.retry')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
