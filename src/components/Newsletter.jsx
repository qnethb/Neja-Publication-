import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function Newsletter() {
  const { t, lang } = useLanguage()
  const si = lang === 'si' ? 'si' : ''
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (!email) return
    // Front-end only: in a real deployment this would post to a mailing list.
    setDone(true)
    setEmail('')
  }

  return (
    <section className="newsletter">
      <div className="container newsletter-inner">
        <div>
          <h2 className={si}>{t('news.title')}</h2>
          <p className={si}>{t('news.sub')}</p>
        </div>
        {done ? (
          <p className={`news-thanks ${si}`}>{t('news.thanks')}</p>
        ) : (
          <form className="news-form" onSubmit={submit}>
            <input
              type="email"
              required
              placeholder={t('news.placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label={t('news.placeholder')}
            />
            <button type="submit" className="btn btn-accent">
              {t('news.button')}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
