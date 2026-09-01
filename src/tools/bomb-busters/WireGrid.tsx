import { buzz } from '../../shared/haptics'
import type { DefuseState } from './store'
import { DATA_FONT } from './typography'

type Props = {
  wires: DefuseState[]
  onCycle: (index: number) => void
}

/**
 * 显式映射而非拼接类名：Tailwind 编译期扫描静态字符串。
 * 三态是"进度"而非"好坏"，所以走填充量递进（空 / 半满 / 全满）+ 色相递进
 * （蓝=原样 → 琥珀=动过 → 绿=完成）。未拆态也给 sky 色相而不留灰：
 * 12 格占屏幕大半，灰底会把整页压成一片死色，桌上隔一米就分不出这是可点的格子。
 */
const TONE: Record<DefuseState, string> = {
  0: 'border-sky-400/70 bg-sky-500/20 text-sky-50',
  // 半拆是唯一"还需要处理"的态，饱和度给到最高。填充档位（/60）刻意不再往上：
  // 数字要跨过上下半区的分界，填充再亮 amber-100 在下半截就压不住了
  1: 'border-amber-400 bg-amber-500/25 text-amber-100',
  // 全拆退场：拆完的号码不用再读，压暗让还没拆的自己浮出来。
  // 色相留着（emerald = 完成）但不给饱和实心，否则会跟半拆抢注意力
  2: 'border-dashed border-emerald-500/50 bg-emerald-500/12 text-emerald-300 opacity-50',
}

/** 不只靠颜色区分三态：半拆多一条半高填充 + ½，全拆退场 + ✓ + 删除线 */
const MARK: Record<DefuseState, string> = { 0: '', 1: '½', 2: '✓' }

const LABEL: Record<DefuseState, string> = { 0: '未拆过', 1: '拆了一半', 2: '全部拆完' }

/**
 * 有色外壳把拆弹区圈成一块 sky 领地，和右侧 violet 的道具区分开 ——
 * 两块信息都裸放在同一深底上时会连成一片，隔着桌子找不到边界。
 */
export function WireGrid({ wires, onCycle }: Props) {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-2 rounded-3xl border-2 border-sky-500/40 bg-sky-950/40 p-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="text-sm font-semibold tracking-wide text-sky-200">拆弹状态</span>
        <div className="flex items-center gap-4 text-xs text-sky-100/80">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm border border-sky-400 bg-sky-500/40" />
            未拆
          </span>
          {/* 图例色块跟格子一样按填充量给：半格 / 满格，颜色之外还有一层量的编码 */}
          <span className="flex items-center gap-1.5">
            <span className="flex size-3 flex-col justify-end rounded-sm border border-amber-400">
              <span className="h-1/2 bg-amber-400" />
            </span>
            一半
          </span>
          {/* 色块不跟着格子压暗（图例本来就小，压暗就看不见了），
              用删除线对应格子里的删除线 */}
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm border border-emerald-400 bg-emerald-500" />
            <span className="line-through">全拆</span>
          </span>
        </div>
      </div>

      {/* 格子填满可用高度而非固定 aspect：一屏不翻页优先于正方形。
          分栏后本区只剩约 510px 宽，4 列比 6 列更接近方形，编号不会孤零零挂在瘦长格子中间 */}
      <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-3 gap-2.5">
        {wires.map((state, i) => (
          <button
            key={i}
            type="button"
            aria-label={`数字 ${i + 1}：${LABEL[state]}`}
            onClick={() => {
              buzz()
              onCycle(i)
            }}
            className={`relative flex min-h-16 items-center justify-center overflow-hidden rounded-2xl border-2 transition-transform duration-75 active:scale-95 ${TONE[state]}`}
          >
            {state === 1 && (
              <span className="absolute inset-x-0 bottom-0 h-1/2 bg-amber-500/60" aria-hidden />
            )}
            <span
              style={DATA_FONT.wire}
              className={`relative font-mono font-bold tabular-nums ${
                state === 2 ? 'line-through decoration-4' : ''
              }`}
            >
              {i + 1}
            </span>
            {MARK[state] && (
              <span className="absolute top-1.5 right-2 text-sm font-bold opacity-80" aria-hidden>
                {MARK[state]}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
