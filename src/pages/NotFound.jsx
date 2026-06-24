import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function NotFound() {
  const { t, lang } = useLanguage()
  const si = lang === 'si' ? 'si' : ''
  return (
    <div className="page">
      <div className="container narrow empty-state">
        <div className="cart-empty-emoji">📕</div>
        <h1>404</h1>
        <p className={`muted ${si}`}>
          {lang === 'si'
            ? 'ඔබ සොයන පිටුව හමු නොවීය.'
            : 'The page you are looking for could not be found.'}
        </p>
        <Link to="/" className="btn btn-primary">
          {t('nav.home')}
        </Link>
      </div>
    </div>
  )
}
