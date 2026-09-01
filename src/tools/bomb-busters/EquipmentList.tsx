import { buzz } from '../../shared/haptics'
import { findEquipment, type EquipState, type HandCard } from './store'
import { DATA_FONT } from './typography'

type Props = {
  hand: HandCard[]
  onCycle: (index: number) => void
}

/**
 * 整个道具区是一块 violet 领地：色相在这里表示"这是道具信息"，不再表示"能不能用"，
 * 所以三态在同一色系里靠饱和度拉开，而不是靠"有色 / 无色"。
 * 未激活保持正常亮度 —— 它是待满足条件的牌，玩家得读清条件，压暗反而误导；
 * 真该被忽略的只有已用，整卡透明度砍到 45% 直接退场。
 */
/**
 * 三态靠"质地"区分而不是靠明度档位：淡底实线 / 实心 + 光环 / 无底虚线半透明。
 * 未激活和已用都做成"暗紫底"时会糊成同一个状态（这是原来两档灰的老问题换了色相重演），
 * 所以已用干脆不给底色，直接露出区块底 + 虚线 + 40% 透明退场；
 * 可用则是全卡里唯一的实心块，隔着桌子第一眼就该落在它上面。
 */
const TONE: Record<EquipState, string> = {
  0: 'border-violet-400/50 bg-violet-500/15',
  // ring 只给 2px：卡间距 10px，4px 光环会把相邻两张卡挤到几乎贴一起
  1: 'border-violet-200 bg-violet-600 ring-2 ring-violet-300/60',
  2: 'border-dashed border-violet-500/25 opacity-40',
}

const TITLE: Record<EquipState, string> = {
  0: 'text-text',
  1: 'text-white',
  2: 'text-violet-200 line-through',
}

/** 编号是隔着桌子找牌的锚点，未激活也要看得清，只有已用才划掉 */
const NUMBER: Record<EquipState, string> = {
  0: 'text-violet-200',
  1: 'text-white',
  2: 'text-violet-300 line-through',
}

/** 描述在可用态是压在实心 violet-600 上的，白字才够（violet-100/80 只有 3.5:1） */
const DESC: Record<EquipState, string> = {
  0: 'text-violet-100/80',
  1: 'text-white',
  2: 'text-violet-200/80',
}

/** 白实心 / 暗实心 / 空心三种质地，跟颜色无关的那层编码 */
const BADGE: Record<EquipState, string> = {
  0: 'bg-violet-900 text-violet-200',
  1: 'bg-white text-violet-700',
  2: 'text-violet-300 ring-1 ring-violet-500/50',
}

const BADGE_TEXT: Record<EquipState, string> = { 0: '🔒 未激活', 1: '可用', 2: '✔ 已用' }

/**
 * 道具牌竖排、卡内横向排布。竖排是为了把整个栏宽让给名称和描述 ——
 * 横排 5 张时每张只剩 160px，描述会碎成五六行。
 * 编号单独占最右一列：它是"桌上那张牌是哪张"的唯一锚点，比图标和徽章都更需要远距离可读。
 */
export function EquipmentList({ hand, onCycle }: Props) {
  return (
    <section className="flex min-h-0 flex-col gap-2 rounded-3xl border-2 border-violet-500/40 bg-violet-950/40 p-3">
      <span className="shrink-0 text-sm font-semibold tracking-wide text-violet-200">
        道具牌 · 点击切换状态
      </span>
      <div className="flex min-h-0 flex-1 flex-col gap-2.5">
        {hand.map((card, i) => {
          const equip = findEquipment(card.equipId)
          return (
            <button
              key={i}
              type="button"
              aria-label={`${equip?.no ?? '?'} 号 ${equip?.name ?? '未知道具'}：${BADGE_TEXT[card.state]}`}
              onClick={() => {
                buzz()
                onCycle(i)
              }}
              className={`flex min-h-20 flex-1 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-transform duration-75 active:scale-95 ${TONE[card.state]}`}
            >
              {/* 已用态整卡已经 opacity-45，图标不再单独压暗，否则叠加后糊掉 */}
              <span className="shrink-0 text-3xl">{equip?.icon ?? '❔'}</span>

              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-center gap-2">
                  <span className={`truncate text-xl font-bold ${TITLE[card.state]}`}>
                    {equip?.name ?? '未知道具'}
                  </span>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold ${BADGE[card.state]}`}
                  >
                    {BADGE_TEXT[card.state]}
                  </span>
                </span>
                <span className={`line-clamp-2 text-base leading-snug ${DESC[card.state]}`}>
                  {equip?.desc ?? '清单已更新，请重发道具'}
                </span>
              </span>

              <span
                style={DATA_FONT.equipNo}
                className={`shrink-0 font-mono font-bold tabular-nums ${NUMBER[card.state]}`}
              >
                {equip?.no ?? '?'}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
