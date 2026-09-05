import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Stepper } from '../../shared/components/Stepper'
import { ToolLayout } from '../../shared/components/ToolLayout'
import { buzz } from '../../shared/haptics'
import { useWakeLock } from '../../shared/hooks/useWakeLock'
import { IconCheck, IconEdit, IconMinus, IconPlayers, IconPlus, IconReset } from '../../shared/icons'
import { findClass, levelOf, xpToNext } from './classes'
import { SheetEditor } from './SheetEditor'
import { SheetPicker } from './SheetPicker'
import { maxHpOf, useSheetsStore } from './sheets'
import { STATUSES, statusIcon } from './statuses'
import { TEMP_HP_MAX, TEMP_HP_MIN, useGhStore } from './store'

/** 只留 ±1：数字中央、两侧一个暗色减/加，盘面最干净；大步进靠连点 */
const DIAL_STEPS = [-1, 1] as const

/**
 * 转盘的内容标识色：图标 + 标签 + 大数字同色，举屏斜视时一眼分出是哪条轨。
 * 只作内容标识（这是内容色不是语义色），数字因此不用默认的 text
 */
const DIAL_TONES = {
  hp: 'text-rose-300 light:text-rose-700 eink:text-text',
  xp: 'text-sky-300 light:text-sky-700 eink:text-text',
  gold: 'text-amber-300 light:text-amber-600 eink:text-text',
} as const

/**
 * 大数字转盘：替代实体的血量/经验/金币拨盘。
 * 减档、大数字、加档排在同一行（减左加右），横屏下按钮独立成行会把数字挤出可视区。
 * 按钮平面化压暗（半透明 surface-3 薄底 + text-dim 字），
 * 颜色只留给图标/标签/大数字这层内容标识
 */
function Dial({
  icon,
  label,
  tone,
  value,
  sub,
  small,
  onBump,
}: {
  icon: string
  label: string
  tone: keyof typeof DIAL_TONES
  value: number
  sub?: string
  /** 半宽盘：数字降一档，给两侧按钮留地方 */
  small?: boolean
  onBump: (delta: number) => void
}) {
  const toneClass = DIAL_TONES[tone]
  const neg = DIAL_STEPS.filter((d) => d < 0)
  const pos = DIAL_STEPS.filter((d) => d > 0)
  const stepBtn = (delta: number) => (
    <button
      key={delta}
      type="button"
      onClick={() => {
        onBump(delta)
        buzz(delta < 0 ? [15, 25, 15] : 12)
      }}
      className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface-3/60 font-mono text-2xl font-bold tabular-nums text-text-dim short:size-12"
    >
      {delta > 0 ? `+${delta}` : `−${-delta}`}
    </button>
  )
  return (
    <div className="card flex flex-col items-center justify-center gap-1 !p-3 short:!p-2">
      <span className={`section-label text-center ${toneClass}`}>
        <span aria-hidden>{icon} </span>
        {label}
        {sub && <span className="text-text-dim"> · {sub}</span>}
      </span>
      <div className="flex w-full items-center justify-center">
        {neg.map(stepBtn)}
        <span
          className={`flex-1 text-center font-mono font-bold tabular-nums ${toneClass} ${
            small ? 'text-data-sm' : 'text-data'
          }`}
        >
          {value}
        </span>
        {pos.map(stepBtn)}
      </div>
    </div>
  )
}

/**
 * 状态标记：左侧祝福/诅咒两个宽格竖排（会叠多张，图标 + 计数 + 显式 −/+），
 * 右侧 8 个二元状态 4×2（点一下挂上、再点卸下）。两区行高天然对齐。
 * 激活/未激活 = 淡底描边+全彩 vs 无底+半透明彩色 —— 图标保留彩色才认得出是什么；
 * 激活色用 sky（语义色里它就是中性选中档），不占用 rose/emerald 的危险与完成义
 */
function StatusGrid() {
  const { t } = useTranslation()
  const statuses = useGhStore((s) => s.statuses)
  const setStatus = useGhStore((s) => s.setStatus)
  const counted = STATUSES.filter((s) => s.max > 1)
  const binary = STATUSES.filter((s) => s.max === 1)
  return (
    <div className="card flex shrink-0 flex-col gap-2 !p-3">
      <span className="section-label">{t('tools.gloomhaven.statuses')}</span>
      <div className="flex gap-2 short:gap-1.5">
        <div className="flex flex-[2] flex-col gap-2 short:gap-1.5">
          {counted.map((s) => {
            const n = statuses[s.id] ?? 0
            const active = n > 0
            return (
              <div
                key={s.id}
                className={`flex flex-1 items-center gap-1 rounded-xl border px-1.5 ${
                  active
                    ? 'border-sky-500/60 bg-sky-500/15 eink:border-black eink:bg-white'
                    : 'border-transparent bg-surface-2'
                }`}
              >
                {/* 原图白边大，放大裁边让菱形撑满；溢出由外层裁掉 */}
                <span className="block size-10 shrink-0 overflow-hidden rounded-md short:size-9">
                  <img
                    src={statusIcon(s.id)}
                    alt={t(s.nameKey)}
                    className={`size-full scale-[1.4] ${active ? '' : 'opacity-50'}`}
                  />
                </span>
                <span
                  className={`min-w-8 text-center font-mono text-sm font-bold tabular-nums ${
                    active ? 'text-sky-300 light:text-sky-700 eink:text-black' : 'text-text-dim'
                  }`}
                >
                  ×{n}
                </span>
                <div className="ml-auto flex gap-1">
                  <button
                    type="button"
                    disabled={!active}
                    onClick={() => {
                      setStatus(s.id, n - 1)
                      buzz(12)
                    }}
                    aria-label={`${t(s.nameKey)} −1`}
                    className="flex size-12 items-center justify-center rounded-lg bg-surface-3/60 text-text-dim disabled:opacity-30 short:size-11"
                  >
                    <IconMinus className="size-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={n >= s.max}
                    onClick={() => {
                      setStatus(s.id, n + 1)
                      buzz(12)
                    }}
                    aria-label={`${t(s.nameKey)} +1`}
                    className="flex size-12 items-center justify-center rounded-lg bg-surface-3/60 text-text-dim disabled:opacity-30 short:size-11"
                  >
                    <IconPlus className="size-5" aria-hidden />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <div className="grid flex-[4] grid-cols-4 gap-2 short:gap-1.5">
          {binary.map((s) => {
            const active = (statuses[s.id] ?? 0) > 0
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                aria-label={t(s.nameKey)}
                onClick={() => {
                  setStatus(s.id, active ? 0 : 1)
                  buzz(12)
                }}
                className={`flex min-h-[4.5rem] items-center justify-center rounded-xl border short:min-h-16 ${
                  active
                    ? 'border-sky-500/60 bg-sky-500/15 eink:border-black eink:bg-white'
                    : 'border-transparent bg-surface-2'
                }`}
              >
                <span className="block size-11 overflow-hidden rounded-md short:size-10">
                  <img
                    src={statusIcon(s.id)}
                    alt=""
                    className={`size-full scale-[1.4] ${active ? '' : 'opacity-50'}`}
                  />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * 幽港迷城个人面板：血量转盘独占一行（最常操作），本场经验/金币并排半行，状态标记一排。
 * 跨局的角色数据在角色纸库（[sheets.ts](sheets.ts)，IDB），这里只读它算血上限与升级进度。
 *
 * 竖屏预算紧（手机手持是个人面板的主场景）：控制栏压成两行（角色行 + 操作行），
 * 主区两行三盘的排布横竖屏一致，朝向不再改变排列
 */
export default function GloomhavenPage() {
  // 面板要长时间举屏/瞟看，不能息屏
  useWakeLock()
  const { t } = useTranslation()

  const panel = useGhStore()
  const { sheets, status, load, update } = useSheetsStore()
  const [editing, setEditing] = useState(false)

  // 绑着角色纸重开页面时要先读盘（幂等，读过了就跳过）
  useEffect(() => {
    load()
  }, [load])

  const sheet = panel.sheetId ? sheets.find((s) => s.id === panel.sheetId) : undefined

  // 选人界面：没绑定、或绑的那张已被删掉
  if (!panel.temp && !sheet) {
    if (panel.sheetId && (status === 'idle' || status === 'loading')) {
      return (
        <div className="card flex flex-1 items-center justify-center text-text-muted">
          {t('common.loading')}
        </div>
      )
    }
    return <SheetPicker />
  }

  const maxHp = sheet ? maxHpOf(sheet) : panel.tempMaxHp
  const cls = sheet ? findClass(sheet.classId) : undefined
  // 累计 = 角色纸总经验 + 本场转盘上的，举屏就能回答「离升级还差多少」
  const totalXp = sheet ? sheet.xp + panel.xp : panel.xp
  const toNext = xpToNext(totalXp)

  return (
    <ToolLayout
      panel={
        <div className="flex flex-col gap-3">
          {sheet ? (
            <div className="card flex items-center gap-2 !p-3">
              <span className="text-xl" aria-hidden>
                {cls?.icon ?? '❔'}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-base font-bold">{sheet.name}</span>
                <span className="text-xs text-text-muted">
                  {cls ? t(cls.nameKey) : t('tools.gloomhaven.classes.custom')} · Lv.
                  {levelOf(sheet.xp)} · {t('tools.gloomhaven.gold')} {sheet.gold}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label={t('tools.gloomhaven.openSheet')}
                className="btn-base w-14 shrink-0 bg-surface-2"
              >
                <IconEdit className="size-6 short:size-5" aria-hidden />
              </button>
            </div>
          ) : (
            <div className="card !p-3">
              <Stepper
                label={t('tools.gloomhaven.tempMaxHp')}
                value={panel.tempMaxHp}
                min={TEMP_HP_MIN}
                max={TEMP_HP_MAX}
                onChange={panel.setTempMaxHp}
              />
            </div>
          )}

          <div className="flex gap-2 wide:flex-col">
            {sheet && (
              <button
                type="button"
                onClick={() => {
                  // 结算：本场经验与金币加进角色纸并清零转盘，然后进角色纸办升级/购物
                  update(sheet.id, { xp: sheet.xp + panel.xp, gold: sheet.gold + panel.gold })
                  panel.clearLoot()
                  setEditing(true)
                }}
                className="btn-base min-w-0 flex-1 gap-2 bg-emerald-400 px-2 text-base font-bold text-ink"
              >
                <IconCheck className="size-6 shrink-0 short:size-5" aria-hidden />
                <span className="truncate">{t('tools.gloomhaven.settle')}</span>
              </button>
            )}
            <ConfirmButton
              onConfirm={() => panel.newScenario(maxHp)}
              confirmText={t('tools.gloomhaven.confirmNewScenario')}
              className="min-w-0 flex-1 !px-2"
            >
              <IconReset className="size-6 shrink-0 short:size-5" aria-hidden />
              <span className="truncate">{t('tools.gloomhaven.newScenario')}</span>
            </ConfirmButton>
            <button
              type="button"
              onClick={panel.quitToPicker}
              className="btn-base min-w-0 flex-1 gap-2 bg-surface-2 px-2 text-base"
            >
              <IconPlayers className="size-6 shrink-0 short:size-5" aria-hidden />
              <span className="truncate">{t('tools.gloomhaven.switchSheet')}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 short:gap-2">
        <Dial
          icon="❤️"
          label={t('tools.gloomhaven.hp')}
          tone="hp"
          sub={`/ ${maxHp}`}
          value={panel.hp}
          onBump={(d) => panel.bumpHp(d, maxHp)}
        />
        <div className="grid grid-cols-2 gap-3 short:gap-2">
          <Dial
            icon="⭐"
            label={t('tools.gloomhaven.xp')}
            tone="xp"
            small
            sub={
              sheet
                ? toNext === null
                  ? t('tools.gloomhaven.maxLevel')
                  : t('tools.gloomhaven.toNext', { n: toNext })
                : undefined
            }
            value={panel.xp}
            onBump={panel.bumpXp}
          />
          <Dial
            icon="🪙"
            label={t('tools.gloomhaven.gold')}
            tone="gold"
            small
            value={panel.gold}
            onBump={panel.bumpGold}
          />
        </div>
      </div>
      <StatusGrid />

      {editing && sheet && <SheetEditor sheet={sheet} onClose={() => setEditing(false)} />}
    </ToolLayout>
  )
}
