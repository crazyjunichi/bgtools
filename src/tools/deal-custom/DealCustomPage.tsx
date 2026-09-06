import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { FIELD } from '../../shared/components/fieldStyle'
import { Stepper } from '../../shared/components/Stepper'
import { ToolLayout } from '../../shared/components/ToolLayout'
import { ACCENT_SOLID, ACCENT_TEXT, type DealAccent } from '../../shared/deal-roles/accent'
import { CUSTOM_ROLES } from '../../shared/deal-roles/custom'
import { DealRunner } from '../../shared/deal-roles/DealRunner'
import { DealOnline } from '../../shared/deal-roles/online/DealOnline'
import type { DealPool } from '../../shared/deal-roles/online/backend'
import type { RoleCounts, RoleSet } from '../../shared/deal-roles/types'
import { buzz } from '../../shared/haptics'
import { IconDeal, IconDelete, IconEraser, IconPlus, IconQr } from '../../shared/icons'
import { useDealCustomStore } from './store'

/** 与数据库内容池规则的 64 字符上限一致（见 docs/DEAL-ONLINE.md），两条发牌路统一限长 */
const MAX_TEXT = 64

/** 少于两张就不是"发身份"了（同 DealSetup 的下限） */
const MIN_CARDS = 2

const ACCENT: DealAccent = 'violet'

type Mode = 'edit' | 'pass' | 'online'

/** 一次发牌的全部输入：开局那一刻冻结，发牌途中编辑器的改动不影响这一局 */
type DealInput = { set: RoleSet; counts: RoleCounts; pool: DealPool }

/**
 * 自定义发身份：自己填文本、定张数，轮传或扫码发牌。
 *
 * 与内置游戏的差别只在数据从哪来：身份集是开局前从条目列表现场拼的运行时 RoleSet
 * （字面量 `name`，没有图标/阵营），发牌现场（[DealRunner] / [DealOnline]）原样复用。
 * 扫码那条路身份文本走内容池 —— 玩家侧按 roleId 从池里取回（见 [custom.ts]）。
 */
export default function DealCustomPage() {
  const { t } = useTranslation()
  const { entries, add, rename, setCount, remove, clear } = useDealCustomStore()
  const [mode, setMode] = useState<Mode>('edit')
  const [deal, setDeal] = useState<DealInput | null>(null)
  const [draft, setDraft] = useState('')

  // 这局要发的：张数 > 0 且文本非空。张数 0 的条目留在列表里下局再用
  const live = entries.filter((e) => e.count > 0 && e.text.trim())
  const total = live.reduce((a, e) => a + e.count, 0)
  const hasEmpty = entries.some((e) => e.count > 0 && !e.text.trim())
  const ready = total >= MIN_CARDS && !hasEmpty

  const start = (mode: 'pass' | 'online') => {
    const roles = live.map((e) => ({ id: e.id, name: e.text.trim() }))
    setDeal({
      // namesFromPool 是玩家侧（roles 为空）的取退路；组织者侧 roles 就在集里
      set: { ...CUSTOM_ROLES, namesFromPool: undefined, roles },
      counts: Object.fromEntries(live.map((e) => [e.id, e.count])),
      pool: Object.fromEntries(live.map((e) => [e.id, e.text.trim()])),
    })
    setMode(mode)
    buzz(20)
  }

  if (mode === 'pass' && deal) {
    return (
      <DealRunner
        set={deal.set}
        counts={deal.counts}
        accent={ACCENT}
        onClose={() => setMode('edit')}
      />
    )
  }
  if (mode === 'online' && deal) {
    return (
      <DealOnline
        set={deal.set}
        counts={deal.counts}
        accent={ACCENT}
        pool={deal.pool}
        onClose={() => setMode('edit')}
      />
    )
  }

  const submitAdd = (ev: React.FormEvent) => {
    ev.preventDefault()
    const text = draft.trim()
    if (!text) return
    add(text)
    setDraft('')
    buzz()
  }

  return (
    <ToolLayout
      panel={
        <>
          {/* 快速录入：打字 → 回车/添加，连续录完一局的全部身份；事后再在列表里调张数 */}
          <form onSubmit={submitAdd} className="flex shrink-0 items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={MAX_TEXT}
              placeholder={t('tools.dealCustom.addPlaceholder')}
              aria-label={t('tools.dealCustom.addPlaceholder')}
              autoComplete="off"
              className={FIELD}
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className={`btn-base !min-h-12 shrink-0 gap-2 !px-4 text-base short:!min-h-10 short:!text-sm ${ACCENT_SOLID[ACCENT]}`}
            >
              <IconPlus className="size-5 short:size-4" aria-hidden />
              {t('tools.dealCustom.add')}
            </button>
          </form>

          <div className="flex shrink-0 items-center gap-3">
            <span
              className={`font-mono text-xl font-bold leading-none tabular-nums ${ACCENT_TEXT[ACCENT]}`}
            >
              {t('tools.dealCustom.total', { n: total })}
            </span>
            {entries.length > 0 && (
              <ConfirmButton
                onConfirm={clear}
                className="ml-auto !min-h-11 border border-line !px-3 !text-sm"
              >
                <IconEraser className="size-4" aria-hidden />
                {t('common.clear')}
              </ConfirmButton>
            )}
          </div>

          {/* 终结动作贴控制栏底部：竖屏下控制栏在拇指边上 */}
          <div className="mt-auto flex shrink-0 flex-col gap-2">
            <button
              type="button"
              disabled={!ready}
              onClick={() => start('pass')}
              className={`btn-base min-h-16 gap-2 text-xl font-bold short:!min-h-12 short:text-base ${ACCENT_SOLID[ACCENT]}`}
            >
              <IconDeal className="size-6 short:size-5" aria-hidden />
              {!ready
                ? t(hasEmpty ? 'tools.dealCustom.fillText' : 'dealRoles.tooFew')
                : t('dealRoles.start', { n: total })}
            </button>
            {/* 扫码次一档：轮传零配置、不用网络，仍是默认那条路（同 DealSetup 的层级） */}
            <button
              type="button"
              disabled={!ready}
              onClick={() => start('online')}
              className="btn-quiet gap-2 !text-base short:!min-h-11 short:!text-sm"
            >
              <IconQr className="size-5 short:size-4" aria-hidden />
              {t('dealRoles.online.start')}
            </button>
          </div>
        </>
      }
    >
      <span className="section-label shrink-0">{t('tools.dealCustom.list')}</span>
      {entries.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <span className="text-center text-sm leading-relaxed text-text-muted">
            {t('tools.dealCustom.empty')}
          </span>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {entries.map((e, i) => {
            const emptyBad = e.count > 0 && !e.text.trim()
            return (
              <div
                key={e.id}
                className="flex shrink-0 flex-col gap-1 rounded-xl border border-line bg-surface-2 p-3 short:p-2"
              >
                <input
                  value={e.text}
                  onChange={(ev) => rename(e.id, ev.target.value)}
                  maxLength={MAX_TEXT}
                  placeholder={t('tools.dealCustom.textPlaceholder')}
                  aria-label={t('tools.dealCustom.textLabel', { n: i + 1 })}
                  autoComplete="off"
                  className={`${FIELD} ${emptyBad ? '!border-amber-400' : ''}`}
                />
                <div className="flex items-center gap-3 short:gap-2">
                  <div className="flex-1">
                    <Stepper
                      value={e.count}
                      min={0}
                      onChange={(n) => {
                        setCount(e.id, n)
                      }}
                    />
                  </div>
                  <ConfirmButton
                    onConfirm={() => remove(e.id)}
                    confirmText={t('common.confirmDelete')}
                    aria-label={t('tools.dealCustom.remove', {
                      name: e.text.trim() || t('tools.dealCustom.textPlaceholder'),
                    })}
                    className="!min-h-12 !px-3"
                  >
                    <IconDelete className="size-5" aria-hidden />
                  </ConfirmButton>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </ToolLayout>
  )
}
