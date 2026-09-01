import { buzz } from '../../shared/haptics'
import { IconCheck, IconLocked, IconUnknown, type LucideIcon } from '../../shared/icons'
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

/** 拆成两张表：文字那份还要喂 aria-label 拼接，图标不能混进读屏文本 */
const BADGE_TEXT: Record<EquipState, string> = { 0: '未激活', 1: '可用', 2: '已用' }

const BADGE_ICON: Record<EquipState, LucideIcon | null> = {
  0: IconLocked,
  // 可用是全卡唯一的实心块，本身已经最扎眼，再加图标反而抢走编号的位置
  1: null,
  2: IconCheck,
}

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
      {/* 竖屏时本区只分到约一半屏高，5 张卡的硬下限可能刚好装不下 —— 允许框内滚，
          总比被 Split 外层的 overflow-hidden 裁掉第 5 张好（页面级仍不翻页） */}
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto wide:overflow-visible">
        {hand.map((card, i) => {
          const equip = findEquipment(card.equipId)
          const BadgeIcon = BADGE_ICON[card.state]
          return (
            <button
              key={i}
              type="button"
              aria-label={`${equip?.no ?? '?'} 号 ${equip?.name ?? '未知道具'}：${BADGE_TEXT[card.state]}`}
              onClick={() => {
                buzz()
                onCycle(i)
              }}
              // 竖屏下限降到 64px（仍高于 56px 触控下限），5 张才塞得进半屏
              className={`flex min-h-16 flex-1 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-transform duration-75 active:scale-95 wide:min-h-20 ${TONE[card.state]}`}
            >
              {/* 道具图示仍是 emoji：它是内容标识，彩色轮廓在斜视下比单色线条更好认。
                  已用态整卡已经 opacity-45，图标不再单独压暗，否则叠加后糊掉 */}
              {equip ? (
                <span className="shrink-0 text-3xl">{equip.icon}</span>
              ) : (
                <IconUnknown className="size-8 shrink-0" aria-hidden />
              )}

              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-center gap-2">
                  <span className={`truncate text-xl font-bold ${TITLE[card.state]}`}>
                    {equip?.name ?? '未知道具'}
                  </span>
                  <span
                    className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold ${BADGE[card.state]}`}
                  >
                    {BadgeIcon && <BadgeIcon className="size-3.5" aria-hidden />}
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
