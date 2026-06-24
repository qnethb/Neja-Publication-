import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'

const VALUES = [
  { icon: '📖', titleKey: 'about.value1.title', textKey: 'about.value1.text' },
  { icon: '🗣️', titleKey: 'about.value2.title', textKey: 'about.value2.text' },
  { icon: '🌏', titleKey: 'about.value3.title', textKey: 'about.value3.text' },
]

export default function About() {
  const { t, lang } = useLanguage()
  const si = lang === 'si' ? 'si' : ''
  return (
    <div className="page">
      <div className="about-hero">
        <div className="container narrow">
          <h1 className={si}>{t('about.title')}</h1>
          <p className={`about-lead ${si}`}>{t('about.lead')}</p>
        </div>
      </div>

      <div className="container narrow section">
        <h2 className={si}>{t('about.story.title')}</h2>
        <p className={`about-para ${si}`}>{t('about.story.p1')}</p>
        <p className={`about-para ${si}`}>{t('about.story.p2')}</p>
      </div>

      <div className="container section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <h2 className={si}>{t('about.values.title')}</h2>
        </div>
        <div className="values-grid">
          {VALUES.map((v) => (
            <div className="value-card card" key={v.titleKey}>
              <span className="value-icon" aria-hidden="true">
                {v.icon}
              </span>
              <h3 className={si}>{t(v.titleKey)}</h3>
              <p className={`muted ${si}`}>{t(v.textKey)}</p>
            </div>
          ))}
        </div>
        <div className="about-cta">
          <Link to="/shop" className="btn btn-primary">
            {t('hero.cta')}
          </Link>
          <Link to="/contact" className="btn btn-ghost">
            {t('nav.contact')}
          </Link>
        </div>
      </div>
    </div>
  )
}
