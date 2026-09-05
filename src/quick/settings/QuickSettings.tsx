import { useTranslation } from 'react-i18next'
import { canRotate, useOrientation, type Orientation } from '../../shared/hooks/useOrientation'
import { SUPPORTED } from '../../shared/i18n'
import { IconCheck } from '../../shared/icons'
import {
  useThemeStore,
  type EinkChoice,
  type ThemeChoice,
} from '../../shared/theme/store'
import type { I18nKey } from '../../shared/i18n/types'

/**
 * 全局设置。语言 / 主题 / 墨水屏 / 朝向，将来是震动 / 唤醒锁 / 清空数据这类全局开关的落点。
 *
 * **刻意不设显式高度、也没有弹性块**：几行「标签 + 一排按钮」，加上 dialog 的固定
 * 开销仍远低于任何目标屏的可用高，横竖屏都没有余量要分配 —— CLAUDE.md 里「每个 quick
 * 至少一块弹性块」那条红线是为**放不下**的内容设的，硬塞一块只会撑出空白。
 * 预算算法见 CLAUDE.md 的 quick 横竖屏布局一节。
 */

/** 一排单选按钮：选中态不只靠颜色，还要叠一个勾（斜视下也分得清） */
function OptionRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; labelKey: I18nKey }[]
  value: T
  onChange: (value: T) => void
}) {
  const { t } = useTranslation()
  // 列数走内联样式：grid-cols-N 是动态值，Tailwind 编译期扫不到
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map(({ value: v, labelKey }) => {
        const active = value === v
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-pressed={active}
            className={`btn-base w-full gap-2 short:!min-h-11 ${
              active
                ? 'border border-sky-500/60 bg-sky-500/15 text-sky-300'
                : 'bg-surface-2 text-text-muted'
            }`}
          >
            {active && <IconCheck className="size-5 short:size-4" aria-hidden />}
            {t(labelKey)}
          </button>
        )
      })}
    </div>
  )
}

const THEME_OPTIONS = [
  { value: 'system', labelKey: 'quick.settings.themeSystem' },
  { value: 'light', labelKey: 'quick.settings.themeLight' },
  { value: 'dark', labelKey: 'quick.settings.themeDark' },
] as const satisfies readonly { value: ThemeChoice; labelKey: I18nKey }[]

const EINK_OPTIONS = [
  { value: 'auto', labelKey: 'quick.settings.einkAuto' },
  { value: 'on', labelKey: 'quick.settings.einkOn' },
  { value: 'off', labelKey: 'quick.settings.einkOff' },
] as const satisfies readonly { value: EinkChoice; labelKey: I18nKey }[]

const ORIENTATION_OPTIONS = [
  { value: 'portrait', labelKey: 'quick.settings.orientPortrait' },
  { value: 'landscape', labelKey: 'quick.settings.orientLandscape' },
] as const satisfies readonly { value: Orientation; labelKey: I18nKey }[]

export function QuickSettings() {
  const { t, i18n } = useTranslation()
  const theme = useThemeStore((s) => s.theme)
  const eink = useThemeStore((s) => s.eink)
  const setTheme = useThemeStore((s) => s.setTheme)
  const setEink = useThemeStore((s) => s.setEink)
  const { landscape, set: setOrientation } = useOrientation()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="section-label">{t('quick.settings.language')}</span>
        <div className="grid grid-cols-2 gap-2">
          {SUPPORTED.map(({ lng, label }) => {
            const active = i18n.language === lng
            return (
              <button
                key={lng}
                type="button"
                onClick={() => i18n.changeLanguage(lng)}
                aria-pressed={active}
                className={`btn-base w-full gap-2 short:!min-h-11 ${
                  active
                    ? 'border border-sky-500/60 bg-sky-500/15 text-sky-300'
                    : 'bg-surface-2 text-text-muted'
                }`}
              >
                {active && <IconCheck className="size-5 short:size-4" aria-hidden />}
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="section-label">{t('quick.settings.theme')}</span>
        <OptionRow options={THEME_OPTIONS} value={theme} onChange={setTheme} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="section-label">{t('quick.settings.eink')}</span>
        <OptionRow options={EINK_OPTIONS} value={eink} onChange={setEink} />
      </div>

      {/* 锁朝向需要全屏或 PWA，桌面浏览器 / iOS 上两条路都没有时整行不显示 */}
      {canRotate && (
        <div className="flex flex-col gap-2">
          <span className="section-label">{t('quick.settings.orientation')}</span>
          <OptionRow
            options={ORIENTATION_OPTIONS}
            value={landscape ? 'landscape' : 'portrait'}
            onChange={setOrientation}
          />
        </div>
      )}
    </div>
  )
}
