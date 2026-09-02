import { useTranslation } from 'react-i18next'
import { SUPPORTED } from '../../shared/i18n'
import { IconCheck } from '../../shared/icons'

/**
 * 全局设置。目前只有语言，将来是震动 / 唤醒锁 / 清空数据这类全局开关的落点。
 *
 * **刻意不设显式高度、也没有弹性块**：内容只有一行标签加一排按钮，加上 dialog 的固定
 * 开销仍远低于任何目标屏的可用高，横竖屏都没有余量要分配 —— CLAUDE.md 里「每个 quick
 * 至少一块弹性块」那条红线是为**放不下**的内容设的，硬塞一块只会撑出空白。
 * 预算算法见 CLAUDE.md 的 quick 横竖屏布局一节。
 */
export function QuickSettings() {
  const { t, i18n } = useTranslation()

  return (
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
              {/* 选中态不只靠颜色：叠一个勾，斜视下也分得清 */}
              {active && <IconCheck className="size-5 short:size-4" aria-hidden />}
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
