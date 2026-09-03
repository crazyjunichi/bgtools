import { useTranslation } from 'react-i18next'
import { buzz } from '../../shared/haptics'
import type { I18nKey } from '../../shared/i18n/types'
import {
  IconCheck,
  IconLocked,
  IconUnknown,
  IconUnlocked,
  type LucideIcon,
} from '../../shared/icons'
import { findEquipment, type EquipState, type HandCard } from './store'
import { DATA_FONT } from './typography'

type Props = {
  hand: HandCard[]
  onCycle: (index: number) => void
}

/**
 * 整个装备区是一块 violet 领地：色相在这里表示"这是装备信息"，不再表示"能不能用"，
 * 所以三态在同一色系里靠饱和度拉开，而不是靠"有色 / 无色"。
 * 未激活保持正常亮度 —— 它是待满足条件的牌，玩家得读清条件，压暗反而误导；
 * 真该被忽略的只有已用，整卡压透明直接退场。
 *
 * 三态靠"质地"区分而不是靠明度档位：淡底实线 / 实心 + 光环 / 无底虚线半透明。
 * 未激活和已用都做成"暗紫底"时会糊成同一个状态（这是原来两档灰的老问题换了色相重演），
 * 所以已用干脆不给底色，直接露出区块底 + 虚线 + 压透明；
 * 可用则是全卡里唯一的实心块，隔着桌子第一眼就该落在它上面。
 */
const TONE: Record<EquipState, string> = {
  0: 'border-violet-400/50 bg-violet-500/15',
  // 光环不能再粗：它是往外长的，加宽会把相邻两张卡挤到几乎贴一起
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

/** 描述在可用态是压在实心 violet-600 上的，只有纯白够对比度，淡紫不行 */
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

/**
 * 拆成两张表：徽章上只画图标（文案会跟名称抢卡片宽度，而名称优先级更高），
 * 文字那份只喂 aria-label —— 读屏文本里不许混图标。
 */
const BADGE_TEXT_KEY: Record<EquipState, I18nKey> = {
  0: 'tools.bombBusters.equip.state.locked',
  1: 'tools.bombBusters.equip.state.ready',
  2: 'tools.bombBusters.equip.state.used',
}

/** 三态都要有图标：缺一个会让右列时高时矮，编号跟着上下跳 */
const BADGE_ICON: Record<EquipState, LucideIcon> = {
  0: IconLocked,
  1: IconUnlocked,
  2: IconCheck,
}

/**
 * 装备牌竖排、卡内横向排布。竖排是为了把整个栏宽让给名称和描述 ——
 * 5 张横排时每张分到的宽度会把描述碎成五六行。
 * 卡内两列：左边文字（图示 + 名称一行、描述一行），右边纵向的编号 + 状态徽章。
 * 图示不再单独占一列 —— 独立列会把它的宽度从描述里也扣掉一份，塞进名称行只影响名称。
 *
 * 卡内三样东西的优先级是**名称 > 编号 > 状态**，右列的两处设计都由它推出来：
 * 徽章在编号下方而不是名称旁边（名称长度不可控，横排时它先被切掉），
 * 且徽章只画图标不带文案 —— 状态文案（尤其英文）会让右列比编号还宽，
 * 挤掉的正好是名称。状态本身还有底色和删除线两层编码，少一份文字不影响识别。
 */
export function EquipmentList({ hand, onCycle }: Props) {
  const { t } = useTranslation()

  return (
    <section className="flex min-h-0 flex-col gap-2 rounded-3xl border-2 border-violet-500/40 bg-violet-950/40 p-3">
      <span className="shrink-0 text-sm font-semibold tracking-wide text-violet-200">
        {t('tools.bombBusters.equip.title')}
      </span>
      {/* 卡片 flex-1：人数决定张数（2–5），少的时候摊开占满，不留一截空框。
          竖屏拿的是拆弹区之外的余量（Split 的 autoFirst），最矮的机型上 5 张仍可能装不下 ——
          允许框内滚，总比被 Split 外层的 overflow-hidden 裁掉第 5 张好（页面级仍不翻页） */}
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto wide:overflow-visible">
        {hand.map((card, i) => {
          const equip = findEquipment(card.equipId)
          const BadgeIcon = BADGE_ICON[card.state]
          const badgeText = t(BADGE_TEXT_KEY[card.state])
          const name = equip ? t(equip.nameKey) : t('tools.bombBusters.equip.unknown')
          return (
            <button
              key={i}
              type="button"
              aria-label={t('tools.bombBusters.equip.card', {
                no: equip?.no ?? '?',
                name,
                state: badgeText,
              })}
              onClick={() => {
                buzz()
                onCycle(i)
              }}
              // 竖屏下限比横屏低一档（仍高于触控下限），5 张才塞得进半屏
              className={`flex min-h-16 flex-1 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-transform duration-75 active:scale-95 wide:min-h-20 ${TONE[card.state]}`}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                {/* 图示只占名称这一行，描述仍从卡片左边缘起排（宽度不受它影响）。
                    emoji 给 leading-none：24px 字号配 text-xl 的 28px 行高，不加会把整行顶高 */}
                <span className="flex items-center gap-2">
                  {equip ? (
                    <span className="shrink-0 text-2xl leading-none">{equip.icon}</span>
                  ) : (
                    <IconUnknown className="size-6 shrink-0" aria-hidden />
                  )}
                  {/* 名称保持单行（换行会把描述挤成三行），矮屏降一档给英文名留余量 */}
                  <span className={`truncate text-xl font-bold short:text-lg ${TITLE[card.state]}`}>
                    {name}
                  </span>
                </span>
                <span className={`line-clamp-2 text-base leading-snug ${DESC[card.state]}`}>
                  {equip ? t(equip.descKey) : t('tools.bombBusters.equip.stale')}
                </span>
              </span>

              {/* 编号在上、徽章在下，居中对齐：右列宽度现在由编号独占，
                  徽章比它窄，居中才不会看着往左偏。这一列整体仍矮于两行描述的文本块，不撑高卡片 */}
              <span className="flex shrink-0 flex-col items-center gap-1">
                <span
                  style={DATA_FONT.equipNo}
                  className={`font-mono font-bold tabular-nums ${NUMBER[card.state]}`}
                >
                  {equip?.no ?? '?'}
                </span>
                <span className={`rounded-lg p-1 ${BADGE[card.state]}`}>
                  <BadgeIcon className="size-4" aria-hidden />
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
