import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { ToolLayout } from '../../shared/components/ToolLayout'
import { buzz } from '../../shared/haptics'
import { IconCheck, IconClose, IconDelete, IconPlus, IconSave, IconUpload } from '../../shared/icons'
import { saveText, stampName } from '../../shared/match/share/save'
import { CLASSES, CUSTOM_CLASS, findClass, levelOf } from './classes'
import { exportSheets, maxHpOf, parseSheets, useSheetsStore } from './sheets'
import { useGhStore } from './store'

/**
 * 选人界面 + 角色纸管理（同一张屏）：选用、新建、逐张删除、整库导出/导入。
 * 进这个界面才读 IDB（惰性 load）；IDB 打不开不是崩点 —— 关掉角色纸区，留临时模式入口
 */
export function SheetPicker() {
  const { t } = useTranslation()
  const { sheets, status, load, create, remove, importAll } = useSheetsStore()
  const { bindSheet, startTemp } = useGhStore()

  const [creating, setCreating] = useState(false)
  const [classId, setClassId] = useState(CLASSES[0].id)
  const [name, setName] = useState('')
  /** 导入失败的提示开关（不弹框，就地一句人话） */
  const [importFailed, setImportFailed] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    load()
  }, [load])

  const unavailable = status === 'unavailable'
  const defaultName = (id: string) =>
    id === CUSTOM_CLASS
      ? t('tools.gloomhaven.classes.custom')
      : t(findClass(id)?.nameKey ?? 'tools.gloomhaven.classes.custom')

  const submitCreate = async () => {
    const id = await create(classId, name.trim() || defaultName(classId))
    if (id === null) return // IDB 挂了，状态已翻成 unavailable，界面自己换
    const sheet = useSheetsStore.getState().sheets.find((s) => s.id === id)
    bindSheet(id, sheet ? maxHpOf(sheet) : 6)
    buzz(20)
  }

  const pick = (id: string) => {
    const sheet = sheets.find((s) => s.id === id)
    if (!sheet) return
    bindSheet(id, maxHpOf(sheet))
    buzz(20)
  }

  const onImportFile = async (file: File) => {
    const parsed = parseSheets(await file.text())
    if (!parsed) {
      setImportFailed(true)
      return
    }
    setImportFailed(false)
    await importAll(parsed)
  }

  return (
    <ToolLayout
      panel={
        <div className="flex gap-2 wide:flex-col">
          {!unavailable && (
            <button
              type="button"
              onClick={() => {
                setCreating(true)
                buzz(20)
              }}
              className="btn-base min-w-0 flex-1 gap-2 bg-emerald-400 px-2 text-base font-bold text-ink"
            >
              <IconPlus className="size-6 shrink-0 short:size-5" aria-hidden />
              <span className="truncate">{t('tools.gloomhaven.create')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={startTemp}
            className="btn-base min-w-0 flex-1 gap-2 bg-surface-2 px-2 text-base"
          >
            <IconCheck className="size-6 shrink-0 short:size-5" aria-hidden />
            <span className="truncate">{t('tools.gloomhaven.tempStart')}</span>
          </button>
          {!unavailable && (
            <>
              <button
                type="button"
                disabled={sheets.length === 0}
                onClick={() =>
                  saveText(
                    exportSheets(sheets),
                    stampName('gloomhaven-sheets', Date.now(), 'json'),
                    'application/json',
                  )
                }
                className="btn-base min-w-0 flex-1 gap-2 bg-surface-2 px-2 text-base"
              >
                <IconSave className="size-6 shrink-0 short:size-5" aria-hidden />
                <span className="truncate">{t('tools.gloomhaven.export')}</span>
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn-base min-w-0 flex-1 gap-2 bg-surface-2 px-2 text-base"
              >
                <IconUpload className="size-6 shrink-0 short:size-5" aria-hidden />
                <span className="truncate">{t('tools.gloomhaven.import')}</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onImportFile(file)
                  e.target.value = ''
                }}
              />
            </>
          )}
        </div>
      }
    >
      {creating && !unavailable ? (
        <div className="card flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          <span className="section-label">{t('tools.gloomhaven.createTitle')}</span>
          <div className="grid grid-cols-2 gap-2">
            {[...CLASSES.map((c) => c.id), CUSTOM_CLASS].map((id) => {
              const cls = findClass(id)
              const selected = classId === id
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setClassId(id)
                    buzz(12)
                  }}
                  className={`btn-base gap-2 border px-3 text-base ${
                    selected
                      ? 'border-sky-500/60 bg-sky-500/15 text-sky-300 light:text-sky-700 eink:border-black eink:bg-white eink:text-black'
                      : 'border-transparent bg-surface-2 text-text'
                  }`}
                >
                  <span aria-hidden>{cls?.icon ?? '❔'}</span>
                  <span className="truncate">{defaultName(id)}</span>
                </button>
              )
            })}
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={defaultName(classId)}
            aria-label={t('tools.gloomhaven.editor.name')}
            maxLength={20}
            className="min-h-14 w-full rounded-xl border border-line bg-surface-2 px-4 text-base text-text short:min-h-11"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitCreate}
              className="btn-base flex-1 gap-2 bg-emerald-400 text-base font-bold text-ink"
            >
              <IconCheck className="size-6 short:size-5" aria-hidden />
              {t('tools.gloomhaven.create')}
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="btn-base gap-2 bg-surface-2 px-5 text-base"
            >
              <IconClose className="size-6 short:size-5" aria-hidden />
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <div className="card flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {unavailable ? (
            <p className="py-6 text-center text-sm text-text-muted">
              {t('tools.gloomhaven.unavailable')}
            </p>
          ) : status === 'idle' || status === 'loading' ? (
            <p className="py-6 text-center text-sm text-text-muted">{t('common.loading')}</p>
          ) : sheets.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">
              {t('tools.gloomhaven.noSheets')}
            </p>
          ) : (
            sheets.map((s) => {
              const cls = findClass(s.classId)
              return (
                <div key={s.id} className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => pick(s.id)}
                    className="flex min-h-14 min-w-0 flex-1 items-center gap-2 rounded-xl bg-surface-2 px-3 text-left short:min-h-11"
                  >
                    <span className="text-xl" aria-hidden>
                      {cls?.icon ?? '❔'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold">{s.name}</span>
                      <span className="block text-xs text-text-muted">
                        {cls ? t(cls.nameKey) : t('tools.gloomhaven.classes.custom')} · Lv.
                        {levelOf(s.xp)} · {t('tools.gloomhaven.xp')} {s.xp} ·{' '}
                        {t('tools.gloomhaven.gold')} {s.gold}
                      </span>
                    </span>
                  </button>
                  <ConfirmButton
                    onConfirm={() => remove(s.id)}
                    confirmText={t('common.confirmShort')}
                    aria-label={t('tools.gloomhaven.removeSheet', { name: s.name })}
                    className="w-14 shrink-0 !px-0"
                  >
                    <IconDelete className="size-6 short:size-5" aria-hidden />
                  </ConfirmButton>
                </div>
              )
            })
          )}
          {importFailed && (
            <p className="text-center text-sm text-amber-300 light:text-amber-700">
              {t('tools.gloomhaven.importFailed')}
            </p>
          )}
        </div>
      )}
    </ToolLayout>
  )
}
