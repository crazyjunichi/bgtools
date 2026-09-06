import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buzz } from '../haptics'
import { IconCheck, IconClose, IconPlayerAdd } from '../icons'
import { PlayerSelect } from './PlayerSelect'
import { usePlayersStore, type Player } from './store'

type Props = {
  /** 按名单顺序落座，末尾追加 temps 个临时席位 —— 回传的是玩家对象，工具那边直接 bindSeat */
  onSeat: (picked: Player[], temps: number) => void
  /**
   * 工具要求的最少人数：不够时就坐按钮禁用并换文案。
   * 人数限制落在选人这一步 —— 进了开局页再拦，等于让人白点一次。
   */
  minSeats?: number
}

/**
 * 计分工具的**开局选人空态**：多轮计分、计分纸、王权骰铸共用。
 *
 * 一局重新添加玩家是常态（谁参与只属于这一局），逐列点太慢，所以直接把名单摊开多选。
 * 名单的增删改仍只在顶栏 👥 里做，这里只是选。
 *
 * 临时席是**待入座**占位：点 ＋ 只在这页加一张卡，就坐时才随名单一起落座 ——
 * 立即落座会让空态当场卸载（席位不再是 0），加第二个人就得重开一次面板。
 */
export function SeatStart({ onSeat, minSeats = 1 }: Props) {
  const { t } = useTranslation()
  const players = usePlayersStore((s) => s.players)
  const [picked, setPicked] = useState<string[]>([])
  /** 待入座的临时席。存 id 而非计数：点哪张删哪张，剩余编号自动顺移 */
  const [temps, setTemps] = useState<string[]>([])
  const total = picked.length + temps.length
  const enough = total >= minSeats

  return (
    <div className="card flex min-h-0 flex-1 flex-col items-center justify-center gap-3 wide:min-w-0">
      {/*
       * 竖屏：名单可能很长，只让这个框自己滚（受约束的是高度，所以是 vh）。
       * 横屏：摊满整行、把高度交给两栏各自框内滚（见 PlayerSelect），外层不再裁切
       */}
      <div className="flex max-h-[38vh] w-full max-w-lg flex-col overflow-y-auto wide:max-h-none wide:min-h-0 wide:max-w-none wide:flex-1 wide:overflow-hidden">
        <PlayerSelect
          value={picked}
          onChange={setPicked}
          label={t('players.seatStart.label', { n: total })}
          trailing={
            <>
              {/*
               * 临时卡预演落座后的名字（makeSeat 的 玩家N 规则）：选了几个名单玩家，
               * 临时席就从几号起排，勾选变化时编号跟着顺移 —— 这里看到的即是就坐后的
               */}
              {temps.map((id, i) => {
                const name = t('players.defaultName', { n: picked.length + i + 1 })
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setTemps(temps.filter((v) => v !== id))
                      buzz()
                    }}
                    aria-label={t('players.seatStart.tempRemove', { name })}
                    className="btn-base gap-2 border border-line bg-surface-2 px-3 text-base text-text-muted short:!min-h-11 short:text-sm"
                  >
                    <span className="truncate">{name}</span>
                    <IconClose className="size-4 shrink-0" aria-hidden />
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => {
                  setTemps([...temps, crypto.randomUUID()])
                  buzz(20)
                }}
                className="btn-base gap-2 border border-dashed border-line px-3 text-base text-text-muted short:!min-h-11 short:text-sm"
              >
                <IconPlayerAdd className="size-5 shrink-0" aria-hidden />
                {t('players.seatStart.tempAdd')}
              </button>
            </>
          }
        />
      </div>

      <div className="flex w-full max-w-lg flex-col gap-2 wide:max-w-none">
        <button
          type="button"
          disabled={!enough}
          onClick={() => {
            onSeat(
              // 点击顺序即座位顺序（PlayerSelect 的契约），不再按名单回排
              picked
                .map((id) => players.find((p) => p.id === id))
                .filter((p): p is Player => p !== undefined),
              temps.length,
            )
            buzz(20)
          }}
          className="btn-base gap-2 bg-emerald-400 px-5 text-base font-bold text-ink eink-solid short:!min-h-11"
        >
          <IconCheck className="size-6 short:size-5" aria-hidden />
          {enough ? t('players.seatStart.start', { n: total }) : t('players.seatStart.tooFew', { n: minSeats })}
        </button>
      </div>
    </div>
  )
}
