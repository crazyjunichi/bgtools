import { useEffect, useState } from 'react'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
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
        aria-label="设置：人数、重发道具、新一局"
      >
        ⚙️ 设置
        <span className="font-mono tabular-nums text-text-muted">{players}人</span>
      </button>

      {open && (
        // 点遮罩关闭；面板自身的点击不冒泡到遮罩
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false)
              setPending(null)
            }
          }}
        >
          <div className="card flex w-full max-w-md flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">设置</span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setPending(null)
                }}
                aria-label="关闭"
                className="btn-quiet !min-h-12 w-12 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="section-label">人数（决定初始生命与道具数）</span>
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
                  切到 {pending} 人将重开一局：生命重置为 {pending}、道具重发、拆弹进度清空
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
                    确认
                  </button>
                  <button
                    type="button"
                    onClick={() => setPending(null)}
                    className="btn-quiet flex-1 px-4 text-base"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="section-label">局面</span>
              <div className="flex gap-2">
                <ConfirmButton onConfirm={onDeal} className="flex-1">
                  🔄 重发道具
                </ConfirmButton>
                <ConfirmButton onConfirm={onReset} className="flex-1">
                  🧨 新一局
                </ConfirmButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
