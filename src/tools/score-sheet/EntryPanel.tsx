import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Overlay } from '../../shared/components/Overlay'
import { Stepper } from '../../shared/components/Stepper'
import { IconDelete, IconSelected } from '../../shared/icons'
import { FIELD } from './fieldStyle'
import { entryLabel, fmtScore, type CustomEntry, type Entry } from './store'
import type { Scoring, Step } from './templates'

type Props = {
  entry: Entry
  /** 有值 = 通用模板自己加的条目，额外可改名与删除 */
  custom?: CustomEntry
  /** 这一行已经填过数 —— 切算分方式会清掉整行，填过了就得先确认一次 */
  filled: boolean
  /** 切填法。null = 恢复模板默认。**会清空这一行** */
  onSetScoring: (scoring: Scoring | null) => void
  /** 只调「每个 N 分」的 N，不清行 */
  onSetPer: (per: number) => void
  onRename: (label: string) => void
  onRemove: () => void
  onClose: () => void
}

/**
 * 分段表一行的三条文案。**必须窄成这三个字面量**：写成 `I18nKey` 全量联合的话，
 * i18next 推不出插值参数的形状，会掉到 `t(key, defaultValue)` 那条重载上（第二参当成 string 报错）
 */
type RowKey =
  | 'tools.scoreSheet.entry.tableRowOne'
  | 'tools.scoreSheet.entry.tableRowRange'
  | 'tools.scoreSheet.entry.tableRowUp'

/** 每个 N 分的 N。农场主最大 3，留到 20 够覆盖「每张卡 10 分」这类扩展 */
const PER_LIMIT = 20

/**
 * 点矩阵行首打开的条目面板 —— **换算表的唯一去处**。
 *
 * 换算表不放键盘：它随条目变长变短，会把下面的键区上下顶（同一个数字键换条目就换了位置，
 * 桌上盲点必然点错）。收在这里以后键盘上下文块行数恒定，键区位置钉死。
 *
 * 换算规则**整个只读**：模板给的 perUnit 与 table 互斥（一条细则在规则书里只有一种算法），
 * 改档位或自己换一种折算等于改游戏。能切的只有「要不要一个个数」这一个开关 ——
 * 比如不想数家庭成员，就切成直接填总分。切换会清空这一行（同一个数在两种模式下读法不同）。
 *
 * **只对 [isAdjustable](store.ts) 的条目开放**：直接填总分的模板条目（鸟类分、计分轨）
 * 没有可数的个数，反方向的「改成每个 N 分」是在改游戏，行首根本不给入口。
 */
export function EntryPanel({
  entry,
  custom,
  filled,
  onSetScoring,
  onSetPer,
  onRename,
  onRemove,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const name = entryLabel(entry, t)
  const [draft, setDraft] = useState(custom?.label ?? '')
  /**
   * 「每个几分」在浮层内单独留一份：从别的模式切过来时得有个初值，
   * 有模板默认就用它，否则 1（0 分一档等于这行不计分，不该是默认落点）
   */
  const [per, setPer] = useState(
    entry.scoring.kind === 'perUnit'
      ? entry.scoring.per
      : entry.base.kind === 'perUnit'
        ? entry.base.per
        : 1,
  )

  /**
   * 模板已给出换算规则（perUnit / perGroup / table）。它是这条唯一的数量算法，用户换不了。
   * 为假只剩自定义条目一种可能（模板的 direct 条目进不到这个面板），所以下面
   * `!templated` 的分支等价于「自定义条目」
   */
  const templated = entry.base.kind !== 'direct'
  const counting = entry.scoring.kind !== 'direct'

  /**
   * 切回数量模式：模板条目**清掉 override 拿回 base**，不存一份副本 ——
   * 存副本会让以后修模板（补一档、调分值）对老存档失效。自定义条目没有 base，才自带一个 per。
   */
  const useCount = () => onSetScoring(templated ? null : { kind: 'perUnit', per })
  // 反过来，自定义条目的 base 恒为 direct，切它就是回到默认 —— override 只存真偏离模板的那几条
  const useDirect = () => onSetScoring(templated ? { kind: 'direct' } : null)

  // 名字空着只是还没想好，退回原名比塞一个「条目5」更少意外（这里没有"必须有名字"的不变式）
  const commitName = () => {
    const text = draft.trim()
    if (text) onRename(text)
    else setDraft(custom?.label ?? '')
  }

  return (
    <Overlay
      title={<span className="truncate text-lg font-bold">{name}</span>}
      maxWidth="max-w-sm"
      onClose={onClose}
    >
      {custom && (
        <label className="flex flex-col gap-1">
          <span className="section-label">{t('tools.scoreSheet.entry.name')}</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
            }}
            placeholder={t('tools.scoreSheet.entry.namePlaceholder')}
            maxLength={12}
            className={FIELD}
          />
        </label>
      )}

      <div className="flex flex-col gap-2">
        <span className="section-label">{t('tools.scoreSheet.entry.scoring')}</span>
        {/* 常驻而不是等点下去才说：清行是不可逆的，得让人在点之前就知道 */}
        <span className="text-xs leading-snug text-text-dim">
          {t('tools.scoreSheet.entry.switchHint')}
        </span>
        {/*
         * 二选一，不是三选一：数量怎么折算由模板定死（perUnit / table 互斥），
         * 这里只问「填数量还是填总分」。自定义条目没有模板规则，数量方式就只有「每个 N 分」
         */}
        <Mode
          on={counting}
          filled={filled}
          onPick={useCount}
          label={t(
            templated ? 'tools.scoreSheet.entry.modeCounted' : 'tools.scoreSheet.entry.modePerUnit',
          )}
        />
        <Mode
          on={!counting}
          filled={filled}
          onPick={useDirect}
          label={t('tools.scoreSheet.entry.modeDirect')}
        />
      </div>

      {/* 档位只读，能调的只有自定义条目自己那个 N（模板条目的 N 就是档位） */}
      {!templated && counting && (
        <Stepper
          value={per}
          onChange={(n) => {
            setPer(n)
            onSetPer(n)
          }}
          min={-PER_LIMIT}
          max={PER_LIMIT}
          label={t('tools.scoreSheet.entry.per')}
          format={fmtScore}
        />
      )}

      {templated && <Rule base={entry.base} />}

      {custom && (
        <ConfirmButton
          onConfirm={() => {
            onRemove()
            onClose()
          }}
          confirmText={t('tools.scoreSheet.entry.confirmRemove')}
          className="!min-h-12 !text-sm"
        >
          <IconDelete className="size-5" aria-hidden />
          {t('tools.scoreSheet.entry.remove')}
        </ConfirmButton>
      )}
    </Overlay>
  )
}

const MODE = 'btn-base !min-h-12 w-full justify-between gap-2 border px-4 !text-sm short:!min-h-11'

/**
 * 算分方式的一个选项。三种形态：
 * 已选中（点了没有副作用，不武装确认）· 未选中且这行填过（[ConfirmButton] 拦一次，切了就清空）·
 * 未选中且这行是空的（直接切，桌上不该为没数据的行多点一次）
 */
function Mode({
  on,
  filled,
  label,
  onPick,
}: {
  on: boolean
  filled: boolean
  label: string
  onPick: () => void
}) {
  const { t } = useTranslation()

  if (on) {
    return (
      // 选中态除了 sky 底色还带一个勾：颜色不许是唯一编码
      <button
        type="button"
        aria-pressed
        className={`${MODE} border-sky-500/60 bg-sky-500/15 text-sky-200`}
      >
        {label}
        <IconSelected className="size-5 shrink-0" aria-hidden />
      </button>
    )
  }

  if (filled) {
    return (
      <ConfirmButton
        onConfirm={onPick}
        confirmText={t('tools.scoreSheet.entry.confirmSwitch')}
        className={`${MODE} border-line`}
      >
        {label}
      </ConfirmButton>
    )
  }

  return (
    <button type="button" onClick={onPick} className={`${MODE} border-line bg-surface-2`}>
      {label}
    </button>
  )
}

/** 模板自带的换算规则，只读：分段表逐档展开，线性与「每 N 个」各一行 */
function Rule({ base }: { base: Scoring }) {
  const { t } = useTranslation()
  // 提到局部：窄化在 .map 回调里对属性访问会失效
  const steps = base.kind === 'table' ? base.steps : null

  return (
    <div className="flex flex-col gap-1">
      <span className="section-label">{t('tools.scoreSheet.entry.ruleTitle')}</span>
      {/*
       * 一行一档而不是挤成一串：早先那串 `0–1 = −1 · 2 = 1 · …` 既没表头也没单位，
       * 等号两边哪个是数量哪个是分全靠猜
       */}
      <div className="flex flex-col rounded-xl border border-line bg-surface-2 p-2">
        {steps &&
          steps.map((s, i) => (
            <span key={s.from} className="py-0.5 text-sm tabular-nums">
              {t(rowKey(steps, i), {
                from: s.from,
                to: (steps[i + 1]?.from ?? 0) - 1,
                score: fmtScore(s.score),
              })}
            </span>
          ))}
        {base.kind === 'perGroup' && (
          <span className="py-0.5 text-sm tabular-nums">
            {t('tools.scoreSheet.perGroup', {
              every: base.every,
              score: fmtScore(base.score),
            })}
          </span>
        )}
        {base.kind === 'perUnit' && (
          <span className="py-0.5 text-sm tabular-nums">
            {t('tools.scoreSheet.perUnit', { n: fmtScore(base.per) })}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * 一档该读成「3 个」、「2–3 个」还是「5 个及以上」。
 * 区间上界由下一档的下界反推 —— [Step](templates.ts) 只存下界，末档天然开口。
 */
function rowKey(steps: readonly Step[], i: number): RowKey {
  const next = steps[i + 1]
  if (!next) return 'tools.scoreSheet.entry.tableRowUp'
  return next.from - steps[i].from > 1
    ? 'tools.scoreSheet.entry.tableRowRange'
    : 'tools.scoreSheet.entry.tableRowOne'
}
