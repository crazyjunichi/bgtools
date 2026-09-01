import { useTranslation } from 'react-i18next'
import { buzz } from '../../shared/haptics'
import type { I18nKey } from '../../shared/i18n/types'
import type { DefuseState } from './store'
import { DATA_FONT } from './typography'

type Props = {
  wires: DefuseState[]
  onCycle: (index: number) => void
}

/**
 * 显式映射而非拼接类名：Tailwind 编译期扫描静态字符串。
 * 三态是"进度"而非"好坏"，所以只走一条 sky 亮度阶梯（未拆最亮 → 半拆稍暗 → 全拆最暗），
 * 不换色相 —— 12 格是同一件事的进度，色相跳变会让人以为是三类不同的东西。
 * 亮度是唯一的**量**编码，识别仍不靠颜色：另有 4 等分的填充格数与 ½ ✓ 角标、删除线。
 * 全程不留灰：灰底会把整页压成一片死色，桌上隔一米就分不出这是可点的格子。
 *
 * 亮度设计（相对亮度 Y 越大越亮，半透明的按合成在 sky-950/40 区块底上估算）：
 * 亮格 sky-700 = 87 · 暗格 sky-950 = 41 · 全拆整格 ink/70 = 21
 *
 * 底色是每格的**暗底**，亮的部分由下面 BAND_FILL 铺，两处都用不透明色：
 * 半透明色叠在不同底上合成结果不同，未拆与半拆的亮格就对不上了。
 */
const TONE: Record<DefuseState, string> = {
  0: 'border-sky-300 bg-sky-950 text-sky-50',
  // 未拆与半拆的暗底相同，差别全在填充格数（4/4 vs 2/4）+ 边框亮度
  1: 'border-sky-500/70 bg-sky-950 text-sky-50',
  // 全拆退场：拆完的号码不用再读，压到最暗（比半拆的暗格还暗一档，21 vs 41）
  // 让还没拆的自己浮出来。虚线边框保住"这格已经不是活的"这层非颜色编码
  2: 'border-dashed border-sky-800 bg-ink/70 text-sky-400/75',
}

/**
 * 每格纵向 4 等分，**亮 = 还没拆的部分**，从底往上填：未拆 4/4 · 半拆 2/4 · 全拆 0/4。
 * 4 等分不对应任何局内数量（三态就是三态），它的作用是把"拆了多少"从一块色块变成可数的格数 ——
 * 桌上斜视时数格子比比亮度可靠。
 */
const BAND_FILL: Record<DefuseState, number> = { 0: 4, 1: 2, 2: 0 }

const BANDS = [0, 1, 2, 3]

/**
 * 分割线走**暗色低透**：它只是分格用的结构线，不该跟编号抢注意力。
 * 用 ink 而不是亮色 —— 亮线压在亮格上会读成"又一层填充"，暗线只是把亮格切开。
 * 代价是暗格上的线几乎看不见（ink 压在 sky-950 上差不多同色），这是有意的：
 * 需要数的是亮格，暗格本来就是空的。
 */
const DIVIDER: Record<DefuseState, string> = {
  0: 'border-ink/20',
  1: 'border-ink/20',
  // 全拆已退场，线再弱一档，否则一格死牌被三条线勾得比活牌还显眼
  2: 'border-ink/12',
}

/** 不只靠颜色区分三态：半拆填一半格数 + ½，全拆退场 + ✓ + 删除线 */
const MARK: Record<DefuseState, string> = { 0: '', 1: '½', 2: '✓' }

const LABEL_KEY: Record<DefuseState, I18nKey> = {
  0: 'tools.bombBusters.wires.state.intact',
  1: 'tools.bombBusters.wires.state.half',
  2: 'tools.bombBusters.wires.state.done',
}

/**
 * 有色外壳把拆弹区圈成一块 sky 领地，和右侧 violet 的道具区分开 ——
 * 两块信息都裸放在同一深底上时会连成一片，隔着桌子找不到边界。
 */
export function WireGrid({ wires, onCycle }: Props) {
  const { t } = useTranslation()

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-2 rounded-3xl border-2 border-sky-500/40 bg-sky-950/40 p-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="text-sm font-semibold tracking-wide text-sky-200">
          {t('tools.bombBusters.wires.title')}
        </span>
        <div className="flex items-center gap-4 text-xs text-sky-100/80">
          {/* 格子是 4 等分，但 12px 的色块塞不进三条分割线（挤成一团糊），
              所以图例只保留填充量这层信息：满 4/4 · 半 2/4 · 空 0/4。
              色块统一比格子亮一档（sky-500 而非 sky-700）：12px 见方压暗就看不见了 */}
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm border border-sky-300 bg-sky-500" />
            {t('tools.bombBusters.wires.legend.intact')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="flex size-3 flex-col justify-end overflow-hidden rounded-sm border border-sky-400/80 bg-sky-950">
              <span className="h-1/2 bg-sky-500" />
            </span>
            {t('tools.bombBusters.wires.legend.half')}
          </span>
          {/* 空格子 + 虚线边框对应格子的退场态；边框不跟着格子压到 sky-800
              （图例本来就小，压暗就看不见了），用删除线对应格子里的删除线 */}
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm border border-dashed border-sky-400/70" />
            <span className="line-through">{t('tools.bombBusters.wires.legend.done')}</span>
          </span>
        </div>
      </div>

      {/* 格子填满可用高度而非固定 aspect：一屏不翻页优先于正方形。
          横屏分栏后本区只剩约 510px 宽，4×3 比 6×2 更接近方形，编号不会孤零零挂在瘦长格子中间；
          竖屏本区拿到整屏宽（≈820px）但高度只剩一半，6×2 才不会把格子拉成竖条 */}
      <div className="grid min-h-0 flex-1 grid-cols-6 grid-rows-2 gap-2.5 wide:grid-cols-4 wide:grid-rows-3">
        {wires.map((state, i) => (
          <button
            key={i}
            type="button"
            aria-label={t('tools.bombBusters.wires.cell', { n: i + 1, state: t(LABEL_KEY[state]) })}
            onClick={() => {
              buzz()
              onCycle(i)
            }}
            className={`relative flex min-h-16 items-center justify-center overflow-hidden rounded-2xl border-2 transition-transform duration-75 active:scale-95 ${TONE[state]}`}
          >
            {/* 4 等分层铺在数字下面。band 用 flex-1 而非固定高度：格子在矮屏被压成矩形时
                4 层仍严格等高（border-box 下 border-t 算在自己高度里，不会挤歪某一层）。
                数字压在分界线上，所以两种格都得让 text-sky-50 读得出来：
                sky-950 上是白字（对比极高）、sky-700 上 5.9:1，都够 */}
            <span className="absolute inset-0 flex flex-col" aria-hidden>
              {BANDS.map((band) => (
                <span
                  key={band}
                  className={`flex-1 ${band === 0 ? '' : `border-t-2 ${DIVIDER[state]}`} ${
                    band >= BANDS.length - BAND_FILL[state] ? 'bg-sky-700' : ''
                  }`}
                />
              ))}
            </span>
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
