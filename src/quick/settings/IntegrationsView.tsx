import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { FIELD } from '../../shared/components/fieldStyle'
import { faultCodeOf, type DealErrorCode } from '../../shared/deal-roles/online/backend'
import { databaseUrlOf, parseDatabaseUrl } from '../../shared/deal-roles/online/firebase'
import { errorKeyOf } from '../../shared/deal-roles/online/messages'
import { backendFor } from '../../shared/deal-roles/online/resolve'
import { testBggToken, type BggTestResult } from '../../shared/integrations/bgg'
import { useIntegrationsStore } from '../../shared/integrations/store'
import type { I18nKey } from '../../shared/i18n/types'
import { IconCheck } from '../../shared/icons'

/**
 * 「第三方配置」子视图:Firebase 数据库地址(扫码发牌)+ BGG token。
 * 两个凭据都**先测再存** —— 存下一个连不上的凭据,要到用它的现场才报错。
 *
 * 横屏两块并排(两块全是刚性内容,谁也不需要吸收余量),竖屏堆叠。
 * 不设返回:关掉 dialog 重开即回主视图,比为低频页在标题栏上牵线通信划算。
 */
export function IntegrationsView() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-text-muted">
        {t('quick.settings.integrationsHint')}
      </p>
      <div className="flex flex-col gap-4 wide:flex-row wide:items-start wide:gap-6">
        <FirebaseSection />
        <BggSection />
      </div>
    </div>
  )
}

function FirebaseSection() {
  const { t } = useTranslation()
  const target = useIntegrationsStore((s) => s.dealTarget)
  const setDealTarget = useIntegrationsStore((s) => s.setDealTarget)
  const clearDealTarget = useIntegrationsStore((s) => s.clearDealTarget)

  const [url, setUrl] = useState(target ? databaseUrlOf(target) : '')
  const [testing, setTesting] = useState(false)
  const [err, setErr] = useState<DealErrorCode | null>(null)
  const [saved, setSaved] = useState(false)

  const submit = async () => {
    setErr(null)
    setSaved(false)
    setTesting(true)
    try {
      const parsed = parseDatabaseUrl(url)
      await backendFor(parsed).test()
      setDealTarget(parsed)
      setSaved(true)
    } catch (e) {
      setErr(faultCodeOf(e))
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 wide:min-w-0 wide:flex-1">
      <span className="section-label">{t('dealRoles.online.urlLabel')}</span>
      <input
        value={url}
        onChange={(e) => {
          setUrl(e.target.value)
          setSaved(false)
        }}
        placeholder={t('dealRoles.online.urlPlaceholder')}
        aria-label={t('dealRoles.online.urlLabel')}
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        className={FIELD}
      />
      {/* amber 而非 rose:连不上是"这条路暂时不通",rose 只给破坏性操作 */}
      {err && <p className="text-sm leading-relaxed text-amber-300">{t(errorKeyOf(err))}</p>}
      {saved && <p className="text-sm text-emerald-300">{t('quick.settings.saved')}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={testing || !url.trim()}
          onClick={() => void submit()}
          className="btn-base gap-2 bg-sky-400 px-5 text-base text-ink short:!min-h-11"
        >
          <IconCheck className="size-5 short:size-4" aria-hidden />
          {t(testing ? 'dealRoles.online.testing' : 'dealRoles.online.test')}
        </button>
        {/* 清掉就等于回到"只有轮传":可逆但影响发牌入口,走二次确认 */}
        {target && (
          <ConfirmButton
            onConfirm={() => {
              clearDealTarget()
              setUrl('')
              setSaved(false)
            }}
            confirmText={t('common.confirmShort')}
            className="short:!min-h-11"
          >
            {t('common.clear')}
          </ConfirmButton>
        )}
      </div>
    </div>
  )
}

const BGG_ERR_KEY: Record<Exclude<BggTestResult, 'ok'>, I18nKey> = {
  invalid: 'quick.settings.bggInvalid',
  unreachable: 'quick.settings.bggUnreachable',
}

function BggSection() {
  const { t } = useTranslation()
  const bggToken = useIntegrationsStore((s) => s.bggToken)
  const setBggToken = useIntegrationsStore((s) => s.setBggToken)

  const [token, setToken] = useState(bggToken)
  const [testing, setTesting] = useState(false)
  const [err, setErr] = useState<Exclude<BggTestResult, 'ok'> | null>(null)
  const [saved, setSaved] = useState(false)

  const submit = async () => {
    setErr(null)
    setSaved(false)
    const value = token.trim()
    // 空串 = 清除,不值得为此发一次必 401 的请求
    if (!value) {
      setBggToken('')
      setSaved(true)
      return
    }
    setTesting(true)
    const result = await testBggToken(value)
    setTesting(false)
    if (result === 'ok') {
      setBggToken(value)
      setSaved(true)
    } else {
      setErr(result)
    }
  }

  return (
    <div className="flex flex-col gap-2 wide:min-w-0 wide:flex-1">
      <span className="section-label">{t('quick.settings.bggTokenLabel')}</span>
      <input
        value={token}
        onChange={(e) => {
          setToken(e.target.value)
          setSaved(false)
        }}
        placeholder={t('quick.settings.bggTokenPlaceholder')}
        aria-label={t('quick.settings.bggTokenLabel')}
        autoComplete="off"
        spellCheck={false}
        className={FIELD}
      />
      {err && <p className="text-sm leading-relaxed text-amber-300">{t(BGG_ERR_KEY[err])}</p>}
      {saved && <p className="text-sm text-emerald-300">{t('quick.settings.saved')}</p>}
      <button
        type="button"
        disabled={testing}
        onClick={() => void submit()}
        className="btn-base gap-2 self-start bg-sky-400 px-5 text-base text-ink short:!min-h-11"
      >
        <IconCheck className="size-5 short:size-4" aria-hidden />
        {t(testing ? 'dealRoles.online.testing' : 'dealRoles.online.test')}
      </button>
    </div>
  )
}
