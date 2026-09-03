import { useTranslation } from 'react-i18next'
import { PLAYER_SOLID } from '../../shared/players/colors'
import type { Seat } from '../../shared/players/seats'
import { tone } from '../../shared/tone'
import { fmtDelta, totalOf, type Round } from './store'

type Props = {
  seats: Seat[]
  rounds: Round[]
  draft: Record<string, number>
  /**
   * 滚动框的高度类。缺省是「撑满外层剩余空间」（浮层里外层就是 flex 列）；
   * 回看用的详情框自己给固定高度 —— 那边同屏还有别的块要分预算
   */
  box?: string
}

/** 轮次号列，窄到只放两位数 —— 横向每一像素都该留给分数 */
const LEAD = 'w-9'

/** 每人一列，宽度按「四位数还留得下一位余量」定，容量校核见 docs/DESIGN.md §3 */
const COL = 'w-20'

/**
 * 一行一轮、一列一人的矩阵。**横向对比全落在这里** —— 「这一轮谁最高」
 * 「上半场是谁在领跑」得把同一轮排成一行才看得出。
 *
 * 当前轮（还没封档）作为进行中的第一行留在最上面，底色标出来 —— 否则合计对不上账。
 * 回看已归档的一局时它就是那一晚没来得及封档的最后一轮。
 *
 * 抽成组件是因为有两个消费方：进行中的完整记录浮层（[ScoreHistory](ScoreHistory.tsx)）
 * 与回看某一局的细则视图（[ScoreDetail](ScoreDetail.tsx)）—— 两边必须长得一样。
 */
export function ScoreRounds({ seats, rounds, draft, box = 'min-h-0 flex-1' }: Props) {
  const { t } = useTranslation()

  const drafted = Object.values(draft).some((v) => v !== 0)

  if (rounds.length === 0 && !drafted) {
    return (
      <p className="p-4 text-center text-sm leading-relaxed text-text-muted">
        {t('tools.score.noRounds')}
      </p>
    )
  }

  return (
    <>
      {/* 自己滚而不是让外层滚：表头要 sticky 住，否则滚两屏就不知道哪列是谁 */}
      <div className={`overflow-auto rounded-xl border border-line ${box}`}>
        {/* min-w-max 让列宽跌到 COL 以下时改为横滚，而不是继续压窄到读不出数字 */}
        <table className="w-full min-w-max table-fixed border-collapse">
          <thead>
            <tr>
              <th className={`sticky left-0 top-0 z-20 bg-surface p-1 ${LEAD}`}>
                <span className="sr-only">{t('tools.score.roundCol')}</span>
              </th>
              {seats.map((s) => (
                <th key={s.id} className={`sticky top-0 z-10 bg-surface p-1 ${COL}`}>
                  <span className="flex flex-col items-stretch gap-0.5">
                    <span className="font-mono text-2xl font-bold leading-none tabular-nums">
                      {totalOf(rounds, draft, s.id)}
                    </span>
                    <span
                      className={`truncate rounded-md px-1 text-sm font-bold ${PLAYER_SOLID[s.color]}`}
                    >
                      {s.name}
                    </span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {drafted && (
              <tr className="border-t border-line bg-sky-500/15">
                <td
                  className={`sticky left-0 bg-surface-3 p-1 text-center text-xs font-semibold text-sky-300 ${LEAD}`}
                >
                  {t('tools.score.thisRound')}
                </td>
                {seats.map((s) => (
                  <td
                    key={s.id}
                    className={`p-1 text-center font-mono text-lg font-semibold tabular-nums ${COL} ${tone(
                      draft[s.id],
                    )}`}
                  >
                    {fmtDelta(draft[s.id])}
                  </td>
                ))}
              </tr>
            )}

            {rounds
              .slice()
              .reverse()
              .map((r, i) => (
                <tr key={r.id} className="border-t border-line">
                  {/* 轮次号跟着横滚固定在左侧，否则滚到右边就不知道在看第几轮 */}
                  <td
                    className={`sticky left-0 bg-surface p-1 text-center font-mono text-sm tabular-nums text-text-dim ${LEAD}`}
                  >
                    {rounds.length - i}
                  </td>
                  {seats.map((s) => (
                    <td
                      key={s.id}
                      className={`p-1 text-center font-mono text-lg tabular-nums ${COL} ${tone(
                        r.delta[s.id],
                      )}`}
                    >
                      {fmtDelta(r.delta[s.id])}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* 合计与主界面同源，但这里没有王冠：一屏矩阵里同时出现王冠和一堆数字反而更花 */}
      <p className="text-center text-xs text-text-dim">
        {t('tools.score.history.hint', { n: rounds.length })}
      </p>
    </>
  )
}
