import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Stepper } from '../../shared/components/Stepper'
import { useWakeLock } from '../../shared/hooks/useWakeLock'
import type { I18nKey } from '../../shared/i18n/types'
import type { CellKind, Team } from './game'
import type { ClientAction, SpymasterView } from './view'

/**
 * 队长手机端：私有键卡 + 出题。渲染的全部内容都是主机裁剪后下发的，
 * 本组件不算任何规则 —— 校验在 store，这里只做形状对应的界面。
 *
 * 键卡/队伍用红蓝实心色：那是实物游戏的内容色，不是语义色。
 * 已翻开的格子除了压暗还加删除线 —— 桌上斜视下颜色差异不够可靠。
 */
const KEY_CELL: Record<CellKind, string> = {
  red: 'bg-red-600 text-white',
  blue: 'bg-blue-600 text-white',
  neutral: 'bg-stone-400 text-ink',
  assassin: 'bg-ink text-canvas',
}

const TEAM_SOLID: Record<Team, string> = {
  red: 'bg-red-600 text-white',
  blue: 'bg-blue-600 text-white',
}

const TEAM_TEXT: Record<Team, string> = {
  red: 'text-red-300',
  blue: 'text-blue-300',
}

// key 写完整字面量（禁止拼接）：类型校验与全局搜索都靠它
const TEAM_NAME: Record<Team, I18nKey> = {
  red: 'tools.codenames.team.red',
  blue: 'tools.codenames.team.blue',
}

type Props = {
  view: SpymasterView
  send: (a: ClientAction) => void
}

export default function PlayerView({ view, send }: Props) {
  const { t } = useTranslation()
  // 队长要随时瞟键卡，手机不能睡
  useWakeLock()
  const [word, setWord] = useState('')
  const [n, setN] = useState(1)
  const [rejected, setRejected] = useState(false)

  const teamName = (team: Team) => t(TEAM_NAME[team])

  if (view.kind === 'claim') {
    return (
      <div className="card flex w-full max-w-lg flex-col gap-4">
        <p className="text-lg font-bold text-text">{t('tools.codenames.p.claimTitle')}</p>
        {(['red', 'blue'] as const).map((team) => (
          <button
            key={team}
            type="button"
            disabled={!view.seatsFree[team]}
            onClick={() => send({ k: 'claim', team })}
            className={`btn-base w-full justify-center text-lg ${TEAM_SOLID[team]} disabled:opacity-40`}
          >
            {teamName(team)}
            {!view.seatsFree[team] && (
              <span className="text-sm font-normal">{t('tools.codenames.p.seatTaken')}</span>
            )}
          </button>
        ))}
        {!view.seatsFree.red && !view.seatsFree.blue && (
          <p className="text-sm text-text-muted">{t('tools.codenames.p.full')}</p>
        )}
      </div>
    )
  }

  const myTurnToClue = view.phase === 'playing' && view.clue === null && view.turn === view.team

  const submit = () => {
    const w = word.trim()
    // 主机那边还会再卡一道；这里先拦，省得玩家白等一个来回
    if (!w || view.words.includes(w)) {
      setRejected(true)
      return
    }
    setRejected(false)
    send({ k: 'clue', word: w, n })
    setWord('')
    setN(1)
  }

  return (
    <div className="flex h-full w-full max-w-lg flex-col gap-3">
      {/* 状态条 */}
      <div className="card flex items-center justify-between gap-2 !p-3">
        <span className={`text-base font-bold ${TEAM_TEXT[view.team]}`}>
          {t('tools.codenames.p.youAre', { team: teamName(view.team) })}
        </span>
        <span className="text-sm text-text-muted">
          {t('tools.codenames.remaining', {
            red: view.remaining.red,
            blue: view.remaining.blue,
          })}
        </span>
      </div>

      {/* 键卡：私有信息的全部 */}
      <div className="grid min-h-0 flex-1 grid-cols-5 grid-rows-5 gap-1">
        {view.key.map((cell, i) => (
          <div
            key={i}
            className={`flex items-center justify-center rounded-md p-0.5 text-center text-xs leading-tight font-bold break-all ${KEY_CELL[cell]} ${
              view.revealed[i] ? 'opacity-35 line-through' : ''
            }`}
          >
            {view.words[i]}
          </div>
        ))}
      </div>

      {/* 操作区 */}
      {view.phase === 'over' ? (
        <div className="card !p-3 text-center">
          <span className={`text-lg font-bold ${TEAM_TEXT[view.winner ?? view.team]}`}>
            {t('tools.codenames.winner', { team: teamName(view.winner ?? view.team) })}
          </span>
          {view.byAssassin && (
            <span className="ml-2 text-sm text-text-muted">{t('tools.codenames.byAssassin')}</span>
          )}
        </div>
      ) : myTurnToClue ? (
        <div className="card flex flex-col gap-3 !p-3">
          <p className="text-sm font-bold text-text">{t('tools.codenames.p.giveClue')}</p>
          <input
            value={word}
            onChange={(e) => {
              setWord(e.target.value)
              setRejected(false)
            }}
            placeholder={t('tools.codenames.p.clueWordPh')}
            maxLength={12}
            className="min-h-12 w-full rounded-lg bg-surface-2 px-3 text-lg text-text outline-none placeholder:text-text-dim"
          />
          {rejected && (
            <p className="text-sm text-amber-300">{t('tools.codenames.p.badWord')}</p>
          )}
          <div className="flex items-center justify-between gap-3">
            <Stepper value={n} onChange={setN} min={0} max={9} label={t('tools.codenames.p.clueN')} />
            <button
              type="button"
              onClick={submit}
              disabled={!word.trim()}
              className="btn-base bg-sky-400 px-5 text-base text-ink disabled:opacity-40"
            >
              {t('tools.codenames.p.submitClue')}
            </button>
          </div>
        </div>
      ) : (
        <div className="card !p-3 text-center text-base text-text-muted">
          {view.clue !== null
            ? t('tools.codenames.p.waitGuess', {
                word: view.clue.word,
                n: view.clue.n,
                left: view.guessesLeft,
              })
            : t('tools.codenames.p.waitClue')}
        </div>
      )}
    </div>
  )
}
