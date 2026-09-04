import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../components/ConfirmButton'
import { FIELD } from '../../components/fieldStyle'
import { buzz } from '../../haptics'
import { useWakeLock } from '../../hooks/useWakeLock'
import { IconCheck, IconClose, IconQr } from '../../icons'
import { ACCENT_SOLID, ACCENT_TEXT, type DealAccent } from '../accent'
import { totalOf } from '../deck'
import type { RoleCounts, RoleSet } from '../types'
import { DealFault, faultCodeOf, type DealBackend, type DealErrorCode } from './backend'
import { claimCard } from './claim'
import { databaseUrlOf, parseDatabaseUrl } from './firebase'
import { newGameId } from './ids'
import { errorKeyOf } from './messages'
import { encodePayload } from './payload'
import { pickCard, type PickedCard } from './pick'
import { Qr } from '../../components/Qr'
import { backendFor } from './resolve'
import { RoleCard } from './RoleCard'
import { newSeed } from './seeded'
import { useDealOnlineStore } from './store'

/** 「已领 X 人」的刷新间隔。一次 GET 只有几百字节，但也没必要比人扫码的节奏更快 */
const POLL_MS = 3000

/** gameId 撞车才重开，且只重一次 —— 12 字符 base36 撞两次基本只能是别的问题 */
const OPEN_ATTEMPTS = 2

/** 一局的全部身份：gameId 用来排队，seed 决定牌堆。两者都只在这一屏的生命期内有效 */
type Opened = { gameId: string; seed: string }

/**
 * 占下一个牌局。**必须在显示二维码之前跑完** —— 内容池的写权限是"不存在才能写"，
 * 有人抢先写入就锁死了；这一步同时也把 gameId 占下来。
 */
async function openGame(backend: DealBackend): Promise<Opened> {
  for (let i = 0; i < OPEN_ATTEMPTS; i++) {
    const gameId = newGameId()
    try {
      // 本期还没有内容型游戏，所以不带内容池；通道见 backend.createGame 的说明
      await backend.createGame(gameId)
      return { gameId, seed: newSeed() }
    } catch (e) {
      if (faultCodeOf(e) !== 'taken') throw e
    }
  }
  throw new DealFault('taken')
}

type Stage =
  | { k: 'setup' }
  | { k: 'opening' }
  | { k: 'qr' }
  | { k: 'mine'; card: PickedCard }
  | { k: 'soldOut' }
  | { k: 'error'; code: DealErrorCode }

type Props = {
  set: RoleSet
  counts: RoleCounts
  accent: DealAccent
  onClose: () => void
}

/**
 * 扫码发牌的组织者侧：**举着这一屏让各人扫**，牌堆配方全在二维码里，
 * 数据库只用来排队（见 [backend.ts](backend.ts)）。
 *
 * 这里不套 [Overlay](../../components/Overlay.tsx)：那个点遮罩即关闭，
 * 而关掉就等于把还没领到牌的人撂下。出口只有右上角那个二次确认。
 */
export function DealOnline({ set, counts, accent, onClose }: Props) {
  const { t } = useTranslation()
  const target = useDealOnlineStore((s) => s.target)
  const setTarget = useDealOnlineStore((s) => s.setTarget)

  const [stage, setStage] = useState<Stage>(target ? { k: 'opening' } : { k: 'setup' })
  const [game, setGame] = useState<Opened | null>(null)
  const [claimed, setClaimed] = useState(0)
  /** 换个值就重开一局，见下面那个 effect */
  const [round, setRound] = useState(0)

  const total = totalOf(counts)
  const backend = useMemo(() => (target ? backendFor(target) : null), [target])

  // 二维码要一直举着让人扫，中途息屏就得重新点亮再对准
  useWakeLock()

  /**
   * 开局是这一屏唯一的入口动作，**只由这个 effect 发起**：地址配好（backend 变）
   * 或点了重试（round 变）就跑一遍。想再开一局是改 round，不要另写一条调用路径 ——
   * 两条路径各自 setStage 必然有一条忘记同步。
   */
  useEffect(() => {
    if (!backend) return
    let alive = true
    const run = async () => {
      try {
        const opened = await openGame(backend)
        if (alive) {
          setGame(opened)
          setStage({ k: 'qr' })
        }
      } catch (e) {
        if (alive) setStage({ k: 'error', code: faultCodeOf(e) })
      }
    }
    void run()
    return () => {
      alive = false
    }
  }, [backend, round])

  /** 重开一局：置 opening 态并让上面那个 effect 再跑一遍 */
  const reopen = () => {
    setStage({ k: 'opening' })
    setClaimed(0)
    setRound((n) => n + 1)
  }

  // 已领人数：只在二维码亮着时轮询，看自己的牌或出错时停掉
  useEffect(() => {
    if (stage.k !== 'qr' || !backend || !game) return
    let alive = true
    const tick = async () => {
      try {
        const snap = await backend.read(game.gameId)
        if (alive) setClaimed(Object.keys(snap.claims).length)
      } catch {
        // 静默：网络抖一下不该把二维码撤掉，人还在扫
      }
    }
    void tick()
    const id = window.setInterval(() => void tick(), POLL_MS)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [stage.k, backend, game])

  const takeMine = async () => {
    if (!backend || !game) return
    buzz(20)
    try {
      const res = await claimCard(backend, game.gameId)
      setClaimed(res.total)
      const card = pickCard(set, counts, game.seed, res.rank, res.pool)
      setStage(card ? { k: 'mine', card } : { k: 'soldOut' })
    } catch (e) {
      setStage({ k: 'error', code: faultCodeOf(e) })
    }
  }

  const url =
    game && target
      ? encodePayload(location.href.split('#')[0], {
          target,
          gameId: game.gameId,
          setId: set.id,
          counts,
          seed: game.seed,
        })
      : ''

  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-ink/95 p-4 backdrop-blur-sm short:gap-2 short:p-2">
      {stage.k === 'setup' ? (
        <SetupForm
          initialUrl={target ? databaseUrlOf(target) : ''}
          accent={accent}
          onSaved={(tg) => {
            setStage({ k: 'opening' })
            setClaimed(0)
            setTarget(tg)
          }}
        />
      ) : stage.k === 'opening' ? (
        <span className="text-data-sm font-bold text-text">{t('dealRoles.online.opening')}</span>
      ) : stage.k === 'error' ? (
        <div className="card flex w-full max-w-lg flex-col gap-4 short:!p-3">
          <p className="text-base leading-relaxed text-amber-300">{t(errorKeyOf(stage.code))}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={reopen}
              className={`btn-base gap-2 px-5 text-base short:!min-h-11 ${ACCENT_SOLID[accent]}`}
            >
              {t('dealRoles.online.retry')}
            </button>
            <button
              type="button"
              onClick={() => setStage({ k: 'setup' })}
              className="btn-quiet px-5 text-base short:!min-h-11"
            >
              {t('dealRoles.online.change')}
            </button>
          </div>
        </div>
      ) : stage.k === 'mine' ? (
        <>
          <RoleCard role={stage.card.role} content={stage.card.content} accent={accent} />
          <button
            type="button"
            onClick={() => setStage({ k: 'qr' })}
            className="btn-quiet gap-2 px-5 text-base short:!min-h-11 short:text-sm"
          >
            <IconQr className="size-5 short:size-4" aria-hidden />
            {t('dealRoles.online.backToQr')}
          </button>
        </>
      ) : stage.k === 'soldOut' ? (
        <div className="card flex w-full max-w-lg flex-col gap-3 short:!p-3">
          <span className="text-data-sm font-bold text-text">{t('dealRoles.online.soldOut')}</span>
          <button
            type="button"
            onClick={() => setStage({ k: 'qr' })}
            className="btn-quiet self-start px-5 text-base short:!min-h-11"
          >
            {t('dealRoles.online.backToQr')}
          </button>
        </div>
      ) : (
        /*
         * 二维码是这一屏唯一的主角，两个方向都受视口约束 —— 所以尺寸只能用 vmin，
         * 竖屏下 vh 取的是长边，码会直接撑出屏幕。右侧（竖屏是下方）那一列全是刚性内容。
         */
        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-4 wide:flex-row short:gap-2">
          <Qr
            value={url}
            label={t('dealRoles.online.title')}
            className="w-[min(28rem,56vmin)] shrink-0 rounded-2xl"
          />
          <div className="flex shrink-0 flex-col items-center gap-3 wide:w-64 short:gap-2">
            <span className="text-center text-base leading-relaxed text-text-muted short:text-sm">
              {t('dealRoles.online.scanHint')}
            </span>
            {/* 领的人多过牌时换一句话，光看数字读不出"多出来的那几台看到的是'发完了'" */}
            <span
              className={`font-mono text-xl font-bold tabular-nums ${
                claimed > total ? 'text-amber-300' : ACCENT_TEXT[accent]
              }`}
            >
              {t(claimed > total ? 'dealRoles.online.overClaimed' : 'dealRoles.online.claimed', {
                n: claimed,
                total,
              })}
            </span>
            <button
              type="button"
              onClick={() => void takeMine()}
              className={`btn-base gap-2 px-5 text-base short:!min-h-11 short:text-sm ${ACCENT_SOLID[accent]}`}
            >
              {t('dealRoles.online.mine')}
            </button>
          </div>
        </div>
      )}

      {/*
       * 出口压到右上角、且要二次确认：同 [DealRunner](../DealRunner.tsx) ——
       * 底部两角正是举着设备时托住的位置，放那儿必被误触，而一按就把没领到牌的人撂下了。
       */}
      <ConfirmButton
        onConfirm={onClose}
        confirmText={t('dealRoles.stopConfirm')}
        className="absolute top-[env(safe-area-inset-top)] right-[env(safe-area-inset-right)] !min-h-12 !px-4 !text-sm"
      >
        <IconClose className="size-4" aria-hidden />
        {t('dealRoles.stop')}
      </ConfirmButton>
    </div>
  )
}

/**
 * 后端地址的配置引导。**让他粘贴完整 URL 而不是从下拉里挑 region**：
 * region 在控制台是拼在域名里的，照抄一整条比让他辨认自己选了哪个可靠。
 */
function SetupForm({
  initialUrl,
  accent,
  onSaved,
}: {
  initialUrl: string
  accent: DealAccent
  onSaved: (target: ReturnType<typeof parseDatabaseUrl>) => void
}) {
  const { t } = useTranslation()
  const [url, setUrl] = useState(initialUrl)
  const [testing, setTesting] = useState(false)
  const [err, setErr] = useState<DealErrorCode | null>(null)

  const submit = async () => {
    setErr(null)
    setTesting(true)
    try {
      const parsed = parseDatabaseUrl(url)
      // 先测再存：存下一个连不上的地址，下次进来会直接卡在开局那一步
      await backendFor(parsed).test()
      onSaved(parsed)
    } catch (e) {
      setErr(faultCodeOf(e))
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="card flex w-full max-w-xl flex-col gap-3 short:!p-3">
      <span className="flex items-center gap-2 text-lg font-bold text-text">
        <IconQr className="size-5 shrink-0" aria-hidden />
        {t('dealRoles.online.title')}
      </span>
      <p className="text-sm leading-relaxed text-text-muted">{t('dealRoles.online.setupHint')}</p>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={t('dealRoles.online.urlPlaceholder')}
        aria-label={t('dealRoles.online.urlLabel')}
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        className={FIELD}
      />
      {/* amber 而非 rose：连不上是"这条路暂时不通"，rose 在这个项目里只给破坏性操作 */}
      {err && <p className="text-sm leading-relaxed text-amber-300">{t(errorKeyOf(err))}</p>}
      <button
        type="button"
        disabled={testing || !url.trim()}
        onClick={() => void submit()}
        className={`btn-base gap-2 self-start px-5 text-base short:!min-h-11 ${ACCENT_SOLID[accent]}`}
      >
        <IconCheck className="size-5 short:size-4" aria-hidden />
        {t(testing ? 'dealRoles.online.testing' : 'dealRoles.online.test')}
      </button>
    </div>
  )
}
