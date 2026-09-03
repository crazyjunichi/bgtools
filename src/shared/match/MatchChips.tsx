import { IconCrown } from '../icons'
import { PLAYER_SOLID } from '../players/colors'
import { fmtScore } from './format'
import type { MatchPlayer } from './types'

/**
 * 一局的参与者，一人一枚胶囊 —— 列表行、回看详情、结算后的确认三处共用。
 *
 * **名字必须与色块同框**：玩家色允许被两个人共用，颜色不许是唯一识别编码。
 *
 * 王冠取 `outcome` 而不是自己比分数：谁算赢是结算面板定下的
 * （合作局全员同赢、阵营局按阵营），旧存档压根没有胜负，那就都不戴。
 */
export function MatchChips({ players }: { players: readonly MatchPlayer[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {players.map((p, i) => (
        <span
          key={i}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${
            PLAYER_SOLID[p.color]
          }`}
        >
          {p.outcome === 'win' && <IconCrown className="size-3.5 shrink-0" aria-hidden />}
          <span className="max-w-24 truncate">{p.name}</span>
          {p.score !== undefined && (
            <span className="font-mono tabular-nums">{fmtScore(p.score)}</span>
          )}
        </span>
      ))}
    </span>
  )
}
