import i18n from '../i18n'
import { PLAYER_COLORS, type PlayerColor } from './colors'
import { findPlayer, type Player } from './store'

/**
 * 一个计分工具里的「一列 / 一个人」。
 *
 * 放在 `shared/players/` 而不是某个工具目录里：**「临时席位 or 绑定全局名单」是跨工具契约** ——
 * 多轮计分和计分纸都要它，配套的换人面板（[SeatPicker](SeatPicker.tsx)）也是共用的。
 * 各工具的 store 仍各自持有自己的 `seats: Seat[]`（两个工具的桌面互不干扰），
 * 共享的只有类型和这几个纯函数。
 */
export type Seat = {
  id: string
  /** 关联的全局名单玩家；null = 临时席位 */
  playerId: string | null
  /**
   * 名字/颜色快照。名单是真源，但那个人被删掉后席位靠快照继续显示 ——
   * 桌上正在计分时，删个名单条目不该让一整列分数跟着蒸发。
   */
  name: string
  color: PlayerColor
}

export type SeatView = Seat & { linked: boolean }

const newId = () => crypto.randomUUID()

/**
 * 同色允许重复，这里只是新增时的默认值：优先挑本桌还没用的色。
 * 调色板用尽后按席位序轮转 —— 全都回落到第一色会让后来的人彼此分不开，
 * 而表头本来就同时出名字，同色不是唯一编码。
 */
function firstFreeColor(seats: Seat[]): PlayerColor {
  const used = new Set(seats.map((s) => s.color))
  return (
    PLAYER_COLORS.find((c) => !used.has(c.id))?.id ??
    PLAYER_COLORS[seats.length % PLAYER_COLORS.length].id
  )
}

export function makeSeat(seats: Seat[]): Seat {
  return {
    id: newId(),
    playerId: null,
    // 临时席位的名字是快照数据，存的是当下语言的字面量，与全局名单同一套默认名
    name: i18n.t('players.defaultName', { n: seats.length + 1 }),
    color: firstFreeColor(seats),
  }
}

/**
 * 名单是真源：人还在就以名单为准（在顶栏 👥 改名/换色立刻反映到表头），
 * 被删了就退回快照并按临时席位对待 —— 不写回 store，避免渲染期产生副作用。
 */
export function resolveSeat(seat: Seat, players: Player[]): SeatView {
  const p = seat.playerId ? findPlayer(players, seat.playerId) : undefined
  return p ? { ...seat, name: p.name, color: p.color, linked: true } : { ...seat, linked: false }
}

/** 绑定/解绑名单玩家。解绑时名字颜色留着当快照，就地变回临时席位 */
export function bindSeat(seat: Seat, player: Player | null): Seat {
  if (!player) return { ...seat, playerId: null }
  return { ...seat, playerId: player.id, name: player.name, color: player.color }
}

/** 已被别的席位占用的 playerId：一个人不该同时占两列 */
export function takenPlayerIds(seats: Seat[]): Set<string> {
  return new Set(seats.map((s) => s.playerId).filter((id): id is string => id !== null))
}
