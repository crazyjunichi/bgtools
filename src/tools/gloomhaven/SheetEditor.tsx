import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { Overlay } from '../../shared/components/Overlay'
import { Stepper } from '../../shared/components/Stepper'
import { buzz } from '../../shared/haptics'
import { IconCheck, IconDelete, IconPlus } from '../../shared/icons'
import { findClass, levelOf } from './classes'
import { useSheetsStore, type GhSheet } from './sheets'
import { useState } from 'react'

type Props = {
  sheet: GhSheet
  onClose: () => void
}

/**
 * 角色纸编辑浮层：升级、购物、勾 perk、整物品栏 —— 全是低频的里程碑操作，
 * 每次改动直接写 IDB（文本输入 blur 落盘）。
 * 职业创建后锁定：换职业等于换了一张角色纸，回选人界面新建
 */
export function SheetEditor({ sheet, onClose }: Props) {
  const { t } = useTranslation()
  const { update } = useSheetsStore()
  const [newItem, setNewItem] = useState('')

  const cls = findClass(sheet.classId)
  const patch = (p: Parameters<typeof update>[1]) => update(sheet.id, p)

  const addItem = () => {
    const text = newItem.trim()
    if (!text) return
    patch({ items: [...sheet.items, { id: crypto.randomUUID(), text, equipped: false }] })
    setNewItem('')
    buzz(20)
  }

  return (
    <Overlay
      maxWidth="max-w-lg wide:max-w-3xl"
      title={
        <input
          key={sheet.id}
          type="text"
          defaultValue={sheet.name}
          onBlur={(e) => {
            const name = e.target.value.trim()
            if (name && name !== sheet.name) patch({ name })
            else e.target.value = sheet.name
          }}
          aria-label={t('tools.gloomhaven.editor.name')}
          maxLength={20}
          className="min-h-12 w-full rounded-xl border border-line bg-surface-2 px-3 text-lg font-bold text-text"
        />
      }
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <span className="text-sm text-text-muted">
          {cls?.icon} {cls ? t(cls.nameKey) : t('tools.gloomhaven.classes.custom')} · Lv.
          {levelOf(sheet.xp)}
        </span>

        <div className="grid grid-cols-2 gap-3">
          <Stepper
            label={t('tools.gloomhaven.editor.xpTotal')}
            value={sheet.xp}
            min={0}
            max={999}
            onChange={(xp) => patch({ xp })}
          />
          <Stepper
            label={t('tools.gloomhaven.gold')}
            value={sheet.gold}
            min={0}
            max={999}
            onChange={(gold) => patch({ gold })}
          />
        </div>

        {!cls && (
          <Stepper
            label={t('tools.gloomhaven.tempMaxHp')}
            value={sheet.customMaxHp ?? 6}
            min={1}
            max={30}
            onChange={(customMaxHp) => patch({ customMaxHp })}
          />
        )}

        {cls && (
          <div className="flex flex-col gap-2">
            <span className="section-label">{t('tools.gloomhaven.editor.perks')}</span>
            {cls.perks.map((perk, i) => {
              const checked = sheet.perks[i] ?? 0
              return (
                <div key={perk.textKey} className="flex items-center gap-2">
                  <div className="flex shrink-0 gap-1.5">
                    {Array.from({ length: perk.n }, (_, box) => {
                      const on = box < checked
                      return (
                        <button
                          key={box}
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          aria-label={`${t(perk.textKey)} ${box + 1}`}
                          onClick={() => {
                            // 点已勾的最后一格 = 退一格，否则勾到这一格
                            const perks = [...sheet.perks]
                            perks[i] = checked === box + 1 ? box : box + 1
                            patch({ perks })
                            buzz(12)
                          }}
                          className={`flex size-12 items-center justify-center rounded-lg border short:size-11 ${
                            on
                              ? 'border-sky-500/60 bg-sky-500/15 text-sky-300 light:text-sky-700 eink-wash eink:text-black'
                              : 'border-line bg-surface-2 text-transparent'
                          }`}
                        >
                          <IconCheck className="size-5" aria-hidden />
                        </button>
                      )
                    })}
                  </div>
                  <span className="min-w-0 flex-1 text-sm text-text-muted">{t(perk.textKey)}</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="section-label">{t('tools.gloomhaven.editor.items')}</span>
          {sheet.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <button
                type="button"
                aria-pressed={item.equipped}
                aria-label={t('tools.gloomhaven.editor.equipped')}
                onClick={() => {
                  patch({
                    items: sheet.items.map((it) =>
                      it.id === item.id ? { ...it, equipped: !it.equipped } : it,
                    ),
                  })
                  buzz(12)
                }}
                className={`btn-base w-12 shrink-0 !min-h-12 border ${
                  item.equipped
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 light:text-emerald-700 eink-wash eink:text-black'
                    : 'border-transparent bg-surface-2 text-text-dim'
                }`}
              >
                <IconCheck className="size-5" aria-hidden />
              </button>
              <input
                type="text"
                defaultValue={item.text}
                onBlur={(e) => {
                  const text = e.target.value.trim()
                  if (text && text !== item.text)
                    patch({
                      items: sheet.items.map((it) => (it.id === item.id ? { ...it, text } : it)),
                    })
                  else e.target.value = item.text
                }}
                maxLength={40}
                className="min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 text-base text-text"
              />
              <ConfirmButton
                onConfirm={() =>
                  patch({ items: sheet.items.filter((it) => it.id !== item.id) })
                }
                confirmText={t('common.confirmShort')}
                aria-label={t('tools.gloomhaven.editor.removeItem', { name: item.text })}
                className="w-12 shrink-0 !min-h-12 !px-0"
              >
                <IconDelete className="size-5" aria-hidden />
              </ConfirmButton>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addItem()
              }}
              placeholder={t('tools.gloomhaven.editor.itemPlaceholder')}
              maxLength={40}
              className="min-h-12 min-w-0 flex-1 rounded-xl border border-dashed border-line bg-surface-2 px-3 text-base text-text"
            />
            <button
              type="button"
              disabled={!newItem.trim()}
              onClick={addItem}
              aria-label={t('tools.gloomhaven.editor.addItem')}
              className="btn-base w-12 shrink-0 !min-h-12 bg-surface-2"
            >
              <IconPlus className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="section-label">{t('tools.gloomhaven.editor.notes')}</span>
          <input
            key={`${sheet.id}-notes`}
            type="text"
            defaultValue={sheet.notes ?? ''}
            onBlur={(e) => {
              const notes = e.target.value.trim()
              if (notes !== (sheet.notes ?? '')) patch({ notes: notes || undefined })
            }}
            maxLength={60}
            className="min-h-12 w-full rounded-xl border border-line bg-surface-2 px-3 text-base text-text"
          />
        </div>
      </div>
    </Overlay>
  )
}
