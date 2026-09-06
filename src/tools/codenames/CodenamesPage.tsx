import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { QrOverlay } from '../../shared/components/QrOverlay'
import { ToolLayout } from '../../shared/components/ToolLayout'
import { useWakeLock } from '../../shared/hooks/useWakeLock'
import { IconEye, IconQr, IconReset, IconSkip } from '../../shared/icons'
import { BoardGrid } from './BoardGrid'
import { remaining as remainingOf, total as totalOf } from './game'
import { encodeKeyUrl } from './keyCode'
import { useCodenamesStore } from './store'
import { TEAM_NAME, TEAM_SOLID, TEAM_TEXT } from './teams'

export default function CodenamesPage() {
  const { t } = useTranslation()
  const s = useCodenamesStore()
  const [peek, setPeek] = useState(false)
  const [showQr, setShowQr] = useState(false)
  useWakeLock()

  const playing = s.phase === 'playing'
  const tappable = playing && s.winner === null

  // 牌面全编进 URL，扫码方离线还原；码内容即完整本站 URL，站内扫码因此也能直接进
  const keyUrl = useMemo(() => {
    if (s.phase === 'setup') return ''
    const d = encodeKeyUrl(s.words, s.key)
    return d ? `${location.href.split('#')[0]}#/key?d=${d}` : ''
  }, [s.phase, s.words, s.key])

  return (
    <ToolLayout
      panelWidth="narrow"
      panel={
        <>
          <div className="flex gap-2">
            {/* 看答案要二次确认（平板上谁路过都可能顺手点到）；已在偷看则变回单击退出 */}
            {peek ? (
              <button
                type="button"
                onClick={() => setPeek(false)}
                className="btn-base btn-quiet min-w-0 flex-1 justify-center gap-2 text-base"
              >
                <IconEye className="size-5" aria-hidden />
                {t('tools.codenames.peekExit')}
              </button>
            ) : (
              <ConfirmButton
                onConfirm={() => setPeek(true)}
                confirmText={t('tools.codenames.peekConfirm')}
                disabled={s.phase === 'setup'}
                className="btn-quiet min-w-0 flex-1 justify-center text-base disabled:opacity-40"
              >
                <IconEye className="size-5" aria-hidden />
                {t('tools.codenames.peekKey')}
              </ConfirmButton>
            )}
            <button
              type="button"
              onClick={() => setShowQr(true)}
              disabled={!keyUrl}
              aria-label={t('tools.codenames.qrKey')}
              className="btn-base btn-quiet size-14 shrink-0 justify-center disabled:opacity-40"
            >
              <IconQr className="size-6" aria-hidden />
            </button>
          </div>

          <ConfirmButton
            onConfirm={() => s.newGame()}
            confirmText={t('tools.codenames.confirmNewGame')}
            className="btn-quiet w-full justify-center"
          >
            <IconReset className="size-5" aria-hidden />
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
            className="btn-base bg-amber-400 px-8 text-lg text-ink eink-solid"
          >
            {t('tools.codenames.start')}
          </button>
        </div>
      ) : peek ? (
        /* 队长答案偷看：原位替换牌面（同一槽位同一网格，卡片位置不变形），
           整区点一下就关，必须 onClick（会自我消失的元素不准 onPointerDown） */
        <div className="flex min-h-0 flex-1 flex-col gap-3" onClick={() => setPeek(false)}>
          <p className="text-center text-lg text-text-muted">{t('tools.codenames.peekHint')}</p>
          {/* 队长读答案要干净视野，角标只出在桌面牌面和手机记录页 */}
          <BoardGrid words={s.words} keys={s.key} revealed={s.revealed} showKey />
        </div>
      ) : (
        <>
          {/* 计分 chip 兼作回合/胜负横幅：高亮方即状态方，省掉独立的一行；
              未行动方的 chip 即「结束回合」按钮，点它把回合交给该队 */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {(['red', 'blue'] as const).map((team) => {
              const active = s.winner ? s.winner === team : s.turn === team
              const label =
                s.winner === team
                  ? t('tools.codenames.winner', { team: t(TEAM_NAME[team]) })
                  : t(TEAM_NAME[team])
              const count = (
                <span className="font-mono tabular-nums">
                  {remainingOf(s.key, s.revealed, team)}/{totalOf(s.key, team)}
                </span>
              )
              const cls = `inline-flex min-h-14 items-center justify-center gap-1.5 rounded-xl px-3 text-lg font-semibold ${
                active ? TEAM_SOLID[team] : `bg-surface-2 ${TEAM_TEXT[team]}`
              }`
              return tappable && !active ? (
                <button
                  key={team}
                  type="button"
                  onClick={() => s.pass()}
                  aria-label={t('tools.codenames.passTo', { team: t(TEAM_NAME[team]) })}
                  className={`${cls} cursor-pointer transition-transform duration-75 active:scale-95`}
                >
                  <IconSkip className="size-5" aria-hidden />
                  {label} {count}
                </button>
              ) : (
                <span key={team} className={cls}>
                  {active && s.winner === null && <span aria-hidden>▸ </span>}
                  {label} {count}
                </span>
              )
            })}
            {s.phase === 'over' && s.byAssassin && (
              <span className="basis-full text-center text-sm text-text-muted">
                {t('tools.codenames.byAssassin')}
              </span>
            )}
          </div>
          <BoardGrid
            words={s.words}
            keys={s.key}
            revealed={s.revealed}
            marks={s.marks}
            showKey={false}
            onTap={(i) => s.tapWord(i)}
            tappable={tappable}
          />
        </>
      )}

      {/* 全屏出示队长二维码，见 QrOverlay */}
      {showQr && keyUrl && (
        <QrOverlay
          value={keyUrl}
          label={t('tools.codenames.qrKey')}
          hint={t('tools.codenames.qrHint')}
          onClose={() => setShowQr(false)}
        >
          {/* 仅 dev：单机预览扫码页，不进构建产物也不进 locale */}
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                window.open(keyUrl, '_blank', 'noopener')
              }}
              className="btn-quiet px-5 text-sm"
            >
              Preview key view (dev)
            </button>
          )}
        </QrOverlay>
      )}
    </ToolLayout>
  )
}
