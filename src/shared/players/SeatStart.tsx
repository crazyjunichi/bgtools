import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buzz } from '../haptics'
import { IconCheck, IconPlayerAdd } from '../icons'
import { PlayerSelect } from './PlayerSelect'
import { usePlayersStore, type Player } from './store'

type Props = {
  /** 工具自己的 emoji（首页宫格那个），空态一眼认得出这是哪个工具 */
  icon: string
  /** 一句话说明这张空表是干什么的 */
  hint: string
  /** 按名单顺序落座 —— 回传的是玩家对象，工具那边直接 bindSeat */
  onSeat: (picked: Player[]) => void
  /** 不在名单里的人（路过的朋友）仍要能加一列 */
  onAddTemp: () => void
}

/**
 * 计分工具的**开局选人空态**：多轮计分与计分纸共用。
 *
 * 一局重新添加玩家是常态（谁参与只属于这一局），逐列点太慢，所以直接把名单摊开多选。
 * 名单的增删改仍只在顶栏 👥 里做，这里只是选。
 */
export function SeatStart({ icon, hint, onSeat, onAddTemp }: Props) {
  const { t } = useTranslation()
  const players = usePlayersStore((s) => s.players)
  const [picked, setPicked] = useState<string[]>([])

  return (
    <div className="card flex min-h-0 flex-1 flex-col items-center justify-center gap-3 wide:min-w-0">
      <span className="text-5xl" aria-hidden>
        {icon}
      </span>
      <span className="max-w-md text-center text-base leading-relaxed text-text-muted">{hint}</span>

      {/* 名单本身可能很长，只让它自己滚；受约束的是高度，所以是 vh */}
      <div className="flex max-h-[38vh] w-full max-w-lg flex-col overflow-y-auto">
        <PlayerSelect
          value={picked}
          onChange={setPicked}
          label={t('players.seatStart.label')}
        />
      </div>

      <div className="flex w-full max-w-lg flex-col gap-2">
        {players.length > 0 && (
          <button
            type="button"
            disabled={picked.length === 0}
            onClick={() => {
              onSeat(players.filter((p) => picked.includes(p.id)))
              buzz(20)
            }}
            className="btn-base gap-2 bg-emerald-400 px-5 text-base font-bold text-ink short:!min-h-11"
          >
            <IconCheck className="size-6 short:size-5" aria-hidden />
            {t('players.seatStart.start', { n: picked.length })}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            onAddTemp()
            buzz(20)
          }}
          className="btn-base gap-2 border border-line bg-surface-2 px-5 text-base short:!min-h-11"
        >
          <IconPlayerAdd className="size-6 short:size-5" aria-hidden />
          {t('players.seatStart.temp')}
        </button>
      </div>
    </div>
  )
}
