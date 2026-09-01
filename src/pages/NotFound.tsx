import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { IconCompass } from '../shared/icons'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <IconCompass className="size-16 text-text-dim" aria-hidden />
      <p className="text-lg text-text-muted">{t('notFound.text')}</p>
      <Link to="/" className="btn-quiet px-6 text-base">
        {t('notFound.home')}
      </Link>
    </div>
  )
}
