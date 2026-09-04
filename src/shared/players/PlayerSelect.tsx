import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuickUI } from '../../quick/store'
import { buzz } from '../haptics'
import { IconClose, IconPlayers } from '../icons'
import { PLAYER_SOLID } from './colors'
import { usePlayersStore, type Player } from './store'

type Props = {
  /** 参与的玩家 id，**数组顺序即座位顺序**（先点先坐） */
  value: string[]
  onChange: (ids: string[]) => void
  /** 参与区的区首标签 */
  label?: string
  /**
   * 跟在参与卡后面的同格内容（开局页的临时席位卡）。名单为空时也会渲染 ——
   * 一桌子不在名单上的人也得能开局
   */
  trailing?: ReactNode
}

/** 所有卡严格等宽，列数随宽度自适应 */
const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2'

/**
 * 工具页"调出玩家名单"的通用入口件：**参与区 + 待选区**两栏。点待选卡加入（坐到末尾），
 * 点参与卡放回。名单的增删改一律回到顶栏「玩家名单」面板，不在工具里重复实现一套编辑 UI。
 *
 * 两栏都走实心玩家色（圆点形态已禁用）；参与卡是主角，多一个 ✕ 移除码。
 * 横屏下两栏并排各占一半、各自框内滚，竖屏堆叠成一栏。
 */
export function PlayerSelect({ value, onChange, label, trailing }: Props) {
  const { t } = useTranslation()
  const players = usePlayersStore((s) => s.players)
  const openTool = useQuickUI((s) => s.openTool)

  // 名单里被删掉的人静默掉队：卡自然消失，不必处理悬挂 id
  const seated = value
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined)
  const pool = players.filter((p) => !value.includes(p.id))

  const join = (id: string) => {
    onChange([...value, id])
    buzz()
  }
  const leave = (id: string) => {
    onChange(value.filter((v) => v !== id))
    buzz()
  }

  return (
    <div className="flex flex-col gap-4 wide:min-h-0 wide:flex-1 wide:flex-row">
      <div className="flex flex-col gap-2 wide:min-h-0 wide:min-w-0 wide:flex-1 wide:overflow-y-auto">
        {label && <span className="section-label">{label}</span>}

        {(seated.length > 0 || trailing) && (
          <div className={GRID}>
            {seated.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => leave(p.id)}
                aria-label={t('players.select.leave', { name: p.name })}
                className={`btn-base gap-2 px-3 text-base short:!min-h-11 short:text-sm ${PLAYER_SOLID[p.color]}`}
              >
                <span className="truncate">{p.name}</span>
                <IconClose className="size-4 shrink-0" aria-hidden />
              </button>
            ))}
            {trailing}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 wide:min-h-0 wide:min-w-0 wide:flex-1 wide:overflow-y-auto">
        {players.length === 0 ? (
          <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-3">
            <span className="text-sm leading-relaxed text-text-muted">
              {t('players.select.empty')}
            </span>
            <button
              type="button"
              onClick={() => openTool('players')}
              className="btn-quiet !min-h-12 gap-2 px-4 text-base"
            >
              <IconPlayers className="size-5" aria-hidden />
              {t('players.select.manage')}
            </button>
          </div>
        ) : (
          pool.length > 0 && (
            <>
              <span className="text-sm text-text-muted">{t('players.select.poolHint')}</span>
              <div className={GRID}>
                {pool.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => join(p.id)}
                    aria-label={t('players.select.join', { name: p.name })}
                    className={`btn-base gap-2 px-3 text-base short:!min-h-11 short:text-sm ${PLAYER_SOLID[p.color]}`}
                  >
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </>
          )
        )}
      </div>
    </div>
  )
}
