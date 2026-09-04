import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Qr } from '../../shared/components/Qr'
import { ToolLayout } from '../../shared/components/ToolLayout'
import { useWakeLock } from '../../shared/hooks/useWakeLock'
import { IconEye, IconQr, IconReset, IconSkip } from '../../shared/icons'
import type { I18nKey } from '../../shared/i18n/types'
import { encodePlayLink } from '../../shared/session/payload'
import { remaining as remainingOf, type CellKind, type Team } from './game'
import { closeSession, ensureSession, useSessionPeers } from './session'
import { useCodenamesStore } from './store'

/** 队伍色是实物游戏的内容色（红蓝两队），不走语义色 */
const TEAM_SOLID: Record<Team, string> = {
  red: 'bg-red-600 text-white',
  blue: 'bg-blue-600 text-white',
}

const TEAM_TEXT: Record<Team, string> = {
  red: 'text-red-300',
  blue: 'text-blue-300',
}

const TEAM_NAME: Record<Team, I18nKey> = {
  red: 'tools.codenames.team.red',
  blue: 'tools.codenames.team.blue',
}

const REVEALED_CELL: Record<CellKind, string> = {
  red: 'bg-red-600 text-white',
  blue: 'bg-blue-600 text-white',
  neutral: 'bg-stone-400 text-ink',
  assassin: 'bg-ink text-canvas',
}

export default function CodenamesPage() {
  const { t } = useTranslation()
  const s = useCodenamesStore()
  const peers = useSessionPeers((p) => p.n)
  const [peek, setPeek] = useState(false)
  useWakeLock()

  // 房间凭据在就保证 session 活着；离开工具页（卸载）即收
  useEffect(() => {
    if (s.room) void ensureSession()
    return () => closeSession()
  }, [s.room])

  const playing = s.phase === 'playing'
  const tappable = playing && s.winner === null && (s.clue === null || s.guessesLeft > 0)
  const joinUrl = s.room
    ? encodePlayLink(location.href.split('#')[0], {
        tool: 'codenames',
        room: s.room.id,
        key: s.room.key,
      })
    : null

  const banner = (() => {
    if (s.phase === 'over') {
      return (
        <>
          <span className={`rounded-lg px-3 py-1 text-lg font-bold ${TEAM_SOLID[s.winner ?? 'red']}`}>
            {t('tools.codenames.winner', { team: t(TEAM_NAME[s.winner ?? 'red']) })}
          </span>
          {s.byAssassin && (
            <span className="text-sm text-text-muted">{t('tools.codenames.byAssassin')}</span>
          )}
        </>
      )
    }
    return (
      <>
        <span className={`rounded-lg px-3 py-1 text-lg font-bold ${TEAM_SOLID[s.turn]}`}>
          {t('tools.codenames.turn', { team: t(TEAM_NAME[s.turn]) })}
        </span>
        {s.clue ? (
          <span className="text-lg text-text">
            {t('tools.codenames.clueNow', { word: s.clue.word, n: s.clue.n })}
            <span className="ml-2 text-sm text-text-muted">
              {t('tools.codenames.guessesLeft', { n: s.guessesLeft })}
            </span>
          </span>
        ) : (
          <span className="text-base text-text-muted">{t('tools.codenames.waitingClue')}</span>
        )}
      </>
    )
  })()

  return (
    <ToolLayout
      panelWidth="narrow"
      panel={
        <>
          {s.phase !== 'setup' && (
            <div className="card flex justify-between gap-2 !p-3">
              {(['red', 'blue'] as const).map((team) => (
                <span key={team} className={`text-base font-bold ${TEAM_TEXT[team]}`}>
                  {t(TEAM_NAME[team])}{' '}
                  <span className="font-mono tabular-nums">
                    {remainingOf(s.key, s.revealed, team)}
                  </span>
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => s.pass()}
            disabled={!playing}
            className="btn-base btn-quiet w-full justify-center gap-2 text-base disabled:opacity-40"
          >
            <IconSkip className="size-5" aria-hidden />
            {t('tools.codenames.pass')}
          </button>

          <button
            type="button"
            onClick={() => setPeek(true)}
            disabled={s.phase === 'setup'}
            className="btn-base btn-quiet w-full justify-center gap-2 text-base disabled:opacity-40"
          >
            <IconEye className="size-5" aria-hidden />
            {t('tools.codenames.peekKey')}
          </button>

          <div className="card flex flex-col items-center gap-3 !p-3">
            {!window.isSecureContext ? (
              // crypto.subtle 只在安全上下文存在，明文 HTTP 下联机必败 —— 直接说明，不给点
              <p className="text-sm leading-relaxed text-text-muted">
                {t('tools.codenames.onlineInsecure')}
              </p>
            ) : !s.room ? (
              <button
                type="button"
                onClick={() => s.openRoom()}
                className="btn-base w-full justify-center gap-2 bg-sky-400 text-base text-ink"
              >
                <IconQr className="size-5" aria-hidden />
                {t('tools.codenames.onlineOpen')}
              </button>
            ) : (
              <>
                {joinUrl && (
                  <Qr value={joinUrl} label={t('tools.codenames.onlineOpen')} className="w-full max-w-52" />
                )}
                <p className="text-sm text-text-muted">
                  {t('tools.codenames.peersOnline', { n: peers })}
                </p>
                <div className="flex w-full justify-between gap-2 text-sm">
                  {(['red', 'blue'] as const).map((team) => (
                    <span key={team} className={`font-bold ${TEAM_TEXT[team]}`}>
                      {t(TEAM_NAME[team])}
                      {s.seats[team]
                        ? ` · ${t('tools.codenames.seatTaken')}`
                        : ` · ${t('tools.codenames.seatFree')}`}
                    </span>
                  ))}
                </div>
                <ConfirmButton
                  onConfirm={() => {
                    s.freeSeat('red')
                    s.freeSeat('blue')
                  }}
                  confirmText={t('tools.codenames.resetSeatsConfirm')}
                  disabled={!s.seats.red && !s.seats.blue}
                  className="btn-quiet min-h-12 w-full justify-center gap-2 text-sm disabled:opacity-40"
                >
                  {t('tools.codenames.resetSeats')}
                </ConfirmButton>
                <ConfirmButton
                  onConfirm={() => s.closeRoom()}
                  confirmText={t('tools.codenames.onlineCloseConfirm')}
                  className="btn-quiet min-h-12 w-full justify-center gap-2 text-sm"
                >
                  <IconReset className="size-4" aria-hidden />
                  {t('tools.codenames.onlineClose')}
                </ConfirmButton>
              </>
            )}
          </div>

          <ConfirmButton
            onConfirm={() => s.newGame()}
            confirmText={t('tools.codenames.confirmNewGame')}
            className="btn-quiet min-h-12 w-full justify-center gap-2 text-sm"
          >
            <IconReset className="size-4" aria-hidden />
            {t('tools.codenames.newGame')}
          </ConfirmButton>
        </>
      }
    >
      {s.phase === 'setup' ? (
        <div className="card flex h-full flex-col items-center justify-center gap-4">
          <span className="text-4xl" aria-hidden>
            🕵️
          </span>
          <p className="max-w-md text-center text-base leading-relaxed text-text-muted">
            {t('tools.codenames.startHint')}
          </p>
          <button
            type="button"
            onClick={() => s.newGame()}
            className="btn-base bg-amber-400 px-8 text-lg text-ink"
          >
            {t('tools.codenames.start')}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">{banner}</div>
          <div className="grid min-h-0 flex-1 grid-cols-5 grid-rows-5 gap-2">
            {s.words.map((word, i) => (
              <button
                key={i}
                type="button"
                disabled={!tappable || s.revealed[i]}
                onClick={() => s.tapWord(i)}
                className={`flex items-center justify-center rounded-lg p-1 text-center text-sm leading-tight font-bold break-all transition-transform duration-75 wide:text-base ${
                  s.revealed[i]
                    ? REVEALED_CELL[s.key[i]]
                    : 'card !p-1 text-text enabled:active:scale-95 disabled:opacity-100'
                }`}
              >
                {word}
              </button>
            ))}
          </div>
        </>
      )}

      {/* 队长键卡偷看：单机降级的核心。整层点一下就关，必须 onClick（会自我消失的元素不准 onPointerDown） */}
      {peek && s.phase !== 'setup' && (
        <div
          className="fixed inset-0 z-50 flex flex-col gap-3 bg-ink/90 p-4"
          onClick={() => setPeek(false)}
        >
          <p className="text-center text-sm text-text-dim">{t('tools.codenames.peekHint')}</p>
          <div className="grid min-h-0 flex-1 grid-cols-5 grid-rows-5 gap-1.5">
            {s.key.map((cell, i) => (
              <div
                key={i}
                className={`flex items-center justify-center rounded-md p-0.5 text-center text-sm leading-tight font-bold break-all ${REVEALED_CELL[cell]} ${
                  s.revealed[i] ? 'opacity-35 line-through' : ''
                }`}
              >
                {s.words[i]}
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
