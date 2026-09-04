import type { JsonValue } from '@trystero-p2p/mqtt'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { htmlLangOf } from '../shared/i18n'
import { joinSession, type ClientConn, type ClientDebug, type ClientSession } from '../shared/session/client'
import { decodePlayLink } from '../shared/session/payload'
import { PLAYER_VIEWS, type AnyPlayerView } from '../shared/session/registry'

type Round = {
  conn: ClientConn
  Comp: AnyPlayerView | null
}

/**
 * 联机会话的玩家落地页。**挂在 `App` 之外**（与 `/` 平级），同 [Join](Join.tsx) 的理由：
 * 扫码进来的人不是来用工具箱的，他一进来就该看到自己那份私有视图。
 *
 * 进页面即自动连主机，**零点击**。连接不上给一句人话 + 重试，
 * 绝不把异常堆栈摆到玩家面前。
 */
export default function Play() {
  const { t, i18n } = useTranslation()
  const { search } = useLocation()
  const [attempt, setAttempt] = useState(0)
  const [done, setDone] = useState<{ round: string; state: Round } | null>(null)
  const sendRef = useRef<(a: JsonValue) => void>(() => {})

  /*
   * 状态带上它属于哪一轮，在渲染期推导出当前值而不是在 effect 里同步置 ——
   * 重扫另一局（search 变了、组件没重挂）不会先闪一下上一局的画面。
   */
  const round = `${attempt}:${search}`
  const state: Round = done?.round === round ? done.state : { conn: { k: 'connecting' }, Comp: null }

  // decodePlayLink 每次渲染都返回新对象，直接当 effect 依赖会让它每次渲染重跑 ——
  // 会话被反复重建，20s 连接预算永远走不完（表现就是永远卡在 connecting）
  const target = useMemo(() => decodePlayLink(search), [search])
  const loader = target ? PLAYER_VIEWS[target.tool] : undefined
  const [dbg, setDbg] = useState<{ round: string; d: ClientDebug } | null>(null)

  // App 里那个 effect 管不到这条路由（这一页不在它下面），lang 得自己设
  useEffect(() => {
    document.documentElement.lang = htmlLangOf(i18n.language)
  }, [i18n.language])

  useEffect(() => {
    if (!target || !loader || !window.isSecureContext) return
    let alive = true
    let session: ClientSession | null = null
    const patch = (p: Partial<Round>) => {
      if (!alive) return
      setDone((prev) => {
        const base: Round =
          prev?.round === round ? prev.state : { conn: { k: 'connecting' }, Comp: null }
        return { round, state: { ...base, ...p } }
      })
    }

    void loader().then((m) => patch({ Comp: m.default }))
    void joinSession(
      target,
      (conn) => patch({ conn }),
      (d) => {
        if (alive) setDbg({ round, d })
      },
    ).then((s) => {
      if (alive) {
        session = s
        sendRef.current = s.send
      } else {
        s.close()
      }
    })
    return () => {
      alive = false
      sendRef.current = () => {}
      session?.close()
    }
  }, [round, target, loader])

  const debug = dbg?.round === round ? dbg.d : null
  // 原始计数翻成「进行到哪一步」的一句话，普通玩家看不懂 relay/握手这些词
  const debugLine = debug && (
    <p className="text-sm text-dim">
      {debug.relaysOpen === 0
        ? t('play.stageNet')
        : debug.peers === 0
          ? t('play.stageWaitHost')
          : t('play.stageSeating')}
    </p>
  )

  const body = (() => {
    if (!target || !loader) {
      return <p className="text-base text-amber-300">{t('play.badLink')}</p>
    }
    // trystero 的口令加密用 crypto.subtle，只在安全上下文存在 —— 明文 HTTP 的局域网地址走不通
    if (!window.isSecureContext) {
      return <p className="max-w-lg text-base leading-relaxed text-amber-300">{t('play.insecure')}</p>
    }
    const { conn, Comp } = state
    switch (conn.k) {
      case 'connecting':
        return (
          <div className="flex flex-col items-center gap-3">
            <span className="text-data-sm font-bold text-text">{t('play.connecting')}</span>
            {debugLine}
          </div>
        )
      case 'failed':
        return (
          <div className="card flex w-full max-w-lg flex-col gap-4">
            <p className="text-base leading-relaxed text-amber-300">{t('play.failed')}</p>
            <p className="text-sm leading-relaxed text-text-muted">{t('play.failedHint')}</p>
            {debugLine}
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="btn-base self-start bg-sky-400 px-5 text-base text-ink"
            >
              {t('play.retry')}
            </button>
          </div>
        )
      case 'rejected':
        return <p className="text-base text-amber-300">{t('play.rejected')}</p>
      case 'ready':
        return Comp ? (
          <Comp view={conn.view} send={(a) => sendRef.current(a)} />
        ) : (
          <span className="text-data-sm font-bold text-text">{t('play.connecting')}</span>
        )
    }
  })()

  return (
    <div className="safe-x safe-t safe-b flex h-full flex-col items-center justify-center gap-4 p-4 short:gap-2 short:p-2">
      {body}
    </div>
  )
}
