import { buzz } from '../../shared/haptics'
import { MAX_LIVES } from './store'
import { DATA_FONT } from './typography'

type Props = {
  lives: number
  onChange: (next: number) => void
}

type Level = 'dead' | 'critical' | 'low' | 'ok'

const levelOf = (lives: number): Level =>
  lives === 0 ? 'dead' : lives === 1 ? 'critical' : lives === 2 ? 'low' : 'ok'

/**
 * 血量色带：绿 → 琥珀 → 红，整块卡跟着变。
 * 生命是"量"而不是"状态"，色带能让人不读数字就知道还剩多少，
 * 这也是左栏唯一一块信息，颜色给得比拆弹/道具区更满。
 */
const CARD: Record<Level, string> = {
  dead: 'border-rose-400 bg-rose-600/45 animate-pulse',
  critical: 'border-rose-400 bg-rose-500/30',
  low: 'border-amber-400 bg-amber-500/20',
  ok: 'border-emerald-400/70 bg-emerald-500/15',
}

const TONE: Record<Level, string> = {
  dead: 'text-rose-100',
  critical: 'text-rose-300',
  low: 'text-amber-300',
  ok: 'text-emerald-200',
}

/** 颜色之外的第二层编码：档位换文案，色觉障碍与斜视色偏都不影响判断 */
const CAPTION: Record<Level, string> = {
  dead: '💥 已引爆',
  critical: '⚠️ 最后一点',
  low: '⚡ 还剩两点',
  ok: '剩余生命',
}

/**
 * 生命指示器。只留数字不做格子进度条 —— 桌上要的是一眼读数，
 * 省下的高度让给道具描述。
 */
export function LifeBar({ lives, onChange }: Props) {
  const level = levelOf(lives)

  const bump = (dir: 1 | -1) => {
    const next = lives + dir
    if (next < 0 || next > MAX_LIVES) return
    buzz(dir === -1 ? [15, 25, 15] : 12)
    onChange(next)
  }

  return (
    <section
      className={`card flex min-h-0 flex-1 flex-col justify-between border-2 transition-colors ${CARD[level]}`}
    >
      <span className={`text-base font-semibold ${TONE[level]}`}>{CAPTION[level]}</span>

      <div className="flex min-h-0 flex-1 items-center justify-center py-2">
        <span className="font-mono tabular-nums">
          <span style={DATA_FONT.lives} className={`font-bold ${TONE[level]}`}>
            {lives}
          </span>
          {/* 分母不用 text-dim：灰字压在彩色底上会显脏 */}
          <span className="text-3xl text-white/45">/{MAX_LIVES}</span>
        </span>
      </div>

      {/* 两个按钮分色：扣血是危险方向（rose），加回是恢复（emerald）。
          原来两个都是灰底，桌上摸黑点很容易按反 */}
      <div className="grid shrink-0 grid-cols-2 gap-3">
        <button
          type="button"
          aria-label="扣除一点生命"
          disabled={lives <= 0}
          onClick={() => bump(-1)}
          className="btn-base border-2 border-rose-400/70 bg-rose-500/25 text-3xl text-rose-100"
        >
          −
        </button>
        <button
          type="button"
          aria-label="增加一点生命"
          disabled={lives >= MAX_LIVES}
          onClick={() => bump(1)}
          className="btn-base border-2 border-emerald-400/70 bg-emerald-500/20 text-3xl text-emerald-100"
        >
          +
        </button>
      </div>
    </section>
  )
}
