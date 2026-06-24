import { useLanguage } from '../context/LanguageContext.jsx'

const FEATURES = [
  { icon: '🚚', titleKey: 'trust.delivery.title', textKey: 'trust.delivery.text' },
  { icon: '💵', titleKey: 'trust.cod.title', textKey: 'trust.cod.text' },
  { icon: '💬', titleKey: 'trust.secure.title', textKey: 'trust.secure.text' },
  { icon: '🎁', titleKey: 'trust.gift.title', textKey: 'trust.gift.text' },
]

export default function FeatureStrip() {
  const { t, lang } = useLanguage()
  const si = lang === 'si' ? 'si' : ''
  return (
    <section className="feature-strip">
      <div className="container feature-grid">
        {FEATURES.map((f) => (
          <div className="feature-item" key={f.titleKey}>
            <span className="feature-icon" aria-hidden="true">
              {f.icon}
            </span>
            <div>
              <strong className={si}>{t(f.titleKey)}</strong>
              <p className={`muted ${si}`}>{t(f.textKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
