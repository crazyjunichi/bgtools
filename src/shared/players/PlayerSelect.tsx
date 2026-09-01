import { useQuickUI } from '../../quick/store'
import { buzz } from '../haptics'
import { IconCheck, IconPlayers } from '../icons'
import { PLAYER_DOT, PLAYER_SOLID } from './colors'
import { usePlayersStore } from './store'

type Props = {
  /** 选中的玩家 id。single 模式也用数组，长度 0 或 1 */
  value: string[]
  onChange: (ids: string[]) => void
  mode?: 'single' | 'multi'
  /** multi 模式的选中上限，达到后再点未选项无效 */
  max?: number
  label?: string
}

/**
 * 工具页"调出玩家名单"的通用入口件。工具只管拿 id 数组，
 * 名单的增删改一律回到顶栏「玩家名单」面板，不在工具里重复实现一套编辑 UI。
 *
 * 选中态是"实心玩家色 + IconCheck"两重编码：同色可被两人共用，
 * 光靠颜色深浅在斜视下分不出选没选。
 */
export function PlayerSelect({ value, onChange, mode = 'multi', max, label }: Props) {
  const players = usePlayersStore((s) => s.players)
  const openTool = useQuickUI((s) => s.openTool)

  const toggle = (id: string) => {
    const on = value.includes(id)
    if (mode === 'single') {
      onChange(on ? [] : [id])
      buzz()
      return
    }
    if (on) {
      onChange(value.filter((v) => v !== id))
      buzz()
      return
    }
    if (max !== undefined && value.length >= max) return
    // 按名单顺序回传，工具拿到的就是座位顺序，不必自己排
    onChange(players.filter((p) => p.id === id || value.includes(p.id)).map((p) => p.id))
    buzz()
  }

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="section-label">{label}</span>}

      {players.length === 0 ? (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-3">
          <span className="text-sm leading-relaxed text-text-muted">
            名单是空的。先添加玩家，之后每个工具都能直接用。
          </span>
          <button
            type="button"
            onClick={() => openTool('players')}
            className="btn-quiet !min-h-12 gap-2 px-4 text-base"
          >
            <IconPlayers className="size-5" aria-hidden />
            管理玩家
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {players.map((p) => {
            const on = value.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                aria-pressed={on}
                className={`btn-base min-w-28 flex-1 gap-2 px-3 text-base short:!min-h-11 short:text-sm ${
                  on ? PLAYER_SOLID[p.color] : 'bg-surface-2 text-text'
                }`}
              >
                {!on && (
                  <span
                    className={`size-3 shrink-0 rounded-full ${PLAYER_DOT[p.color]}`}
                    aria-hidden
                  />
                )}
                <span className="truncate">{p.name}</span>
                {on && <IconCheck className="size-5 shrink-0" aria-hidden />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
