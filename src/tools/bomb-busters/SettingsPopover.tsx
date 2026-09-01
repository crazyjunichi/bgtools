import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { IconClose, IconNewGame, IconRepeat, IconSettings } from '../../shared/icons'
import { MAX_PLAYERS, MIN_PLAYERS } from './store'

const PLAYER_OPTIONS = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (_, i) => MIN_PLAYERS + i,
)

type Props = {
  players: number
  /** 局已开始：改人数会清掉进度，需要二次确认 */
  started: boolean
  onSetPlayers: (players: number) => void
  onDeal: () => void
  onReset: () => void
}

/**
 * 低频操作（人数 / 重发道具 / 新一局）收进浮层，日常不占版面。
 * 用 fixed 遮罩而非 absolute 气泡：ToolLayout 的 aside 是 overflow-hidden，气泡会被裁掉。
 */
export function SettingsPopover({ players, started, onSetPlayers, onDeal, onReset }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setPending(null)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const pickPlayers = (n: number) => {
    if (n === players) return
    // 开局前随手调不该被拦，局中才要确认
    if (started) {
      setPending(n)
      return
    }
    onSetPlayers(n)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-quiet shrink-0 gap-2 text-base"
        aria-label={t('tools.bombBusters.settings.open')}
      >
        <IconSettings className="size-5" aria-hidden />
        {t('tools.bombBusters.settings.title')}
        <span className="font-mono tabular-nums text-text-muted">
          {t('tools.bombBusters.settings.playerCount', { n: players })}
        </span>
      </button>

      {open && (
        // 点遮罩关闭；面板自身的点击不冒泡到遮罩
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
          /* 同 QuickDialog 遮罩：onPointerDown 会让抬手的 click 穿透到底下的牌面 */
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false)
              setPending(null)
            }
          }}
        >
          <div className="card flex w-full max-w-md flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">
                {t('tools.bombBusters.settings.title')}
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setPending(null)
                }}
                aria-label={t('common.close')}
                className="btn-quiet !min-h-12 w-12"
              >
                <IconClose className="size-5" aria-hidden />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="section-label">{t('tools.bombBusters.settings.players')}</span>
              <div className="flex flex-wrap gap-2">
                {PLAYER_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => pickPlayers(n)}
                    // 选中态用 sky 而非 rose：同屏里 rose 专属危险语义（生命、重开）
                    className={`btn-base size-14 font-mono text-2xl tabular-nums ${
                      n === players ? 'bg-sky-400 text-ink' : 'bg-surface-2 text-text-muted'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {pending !== null && (
              <div className="flex flex-col gap-2 rounded-xl border border-rose-500 bg-rose-500/15 p-3">
                <span className="text-sm leading-relaxed text-rose-200">
                  {t('tools.bombBusters.settings.warn', { n: pending })}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSetPlayers(pending)
                      setPending(null)
                    }}
                    className="btn-base flex-1 bg-rose-600 px-4 text-base font-bold text-white"
                  >
                    {t('common.confirmShort')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPending(null)}
                    className="btn-quiet flex-1 px-4 text-base"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="section-label">{t('tools.bombBusters.settings.board')}</span>
              <div className="flex gap-2">
                <ConfirmButton onConfirm={onDeal} className="flex-1">
                  <IconRepeat className="size-5" aria-hidden />
                  {t('tools.bombBusters.settings.deal')}
                </ConfirmButton>
                <ConfirmButton onConfirm={onReset} className="flex-1">
                  <IconNewGame className="size-5" aria-hidden />
                  {t('tools.bombBusters.settings.newGame')}
                </ConfirmButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
