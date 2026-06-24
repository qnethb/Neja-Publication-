import { Link } from 'react-router-dom'
import Hero from '../components/Hero.jsx'
import FeatureStrip from '../components/FeatureStrip.jsx'
import Newsletter from '../components/Newsletter.jsx'
import BookCard from '../components/BookCard.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { books, categories } from '../data/books.js'

const CATEGORY_ICONS = {
  'sinhala-literature': '📖',
  'english-fiction': '📚',
  childrens: '🧸',
  poetry: '🪶',
  academic: '🎓',
  religion: '🕯️',
  biography: '👤',
}

function Section({ eyebrowKey, titleKey, items }) {
  const { t, lang } = useLanguage()
  const si = lang === 'si' ? 'si' : ''
  if (items.length === 0) return null
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <div className={`eyebrow ${si}`}>{t(eyebrowKey)}</div>
            <h2 className={si}>{t(titleKey)}</h2>
          </div>
          <Link to="/shop" className={`link-arrow ${si}`}>
            {t('viewall')} →
          </Link>
        </div>
        <div className="book-grid">
          {items.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const { t, lang } = useLanguage()
  const si = lang === 'si' ? 'si' : ''

  const featured = books.filter((b) => b.featured).slice(0, 5)
  const bestsellers = books.filter((b) => b.bestseller).slice(0, 5)
  const newReleases = books.filter((b) => b.newRelease).slice(0, 5)

  return (
    <>
      <Hero />
      <FeatureStrip />

      <section className="section categories-section">
        <div className="container">
          <div className="section-head" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <div>
              <div className={`eyebrow ${si}`}>{t('cat.heading')}</div>
              <h2 className={si}>{t('cat.sub')}</h2>
            </div>
          </div>
          <div className="category-cards">
            {categories.map((c) => (
              <Link key={c} to={`/shop?category=${c}`} className="category-card">
                <span className="category-emoji" aria-hidden="true">
                  {CATEGORY_ICONS[c]}
                </span>
                <span className={si}>{t(`category.${c}`)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Section eyebrowKey="new.eyebrow" titleKey="new.title" items={newReleases} />

      <section className="banner-cta">
        <div className="container banner-inner">
          <div>
            <h2 className={si}>{t('promo.bar')}</h2>
          </div>
          <Link to="/shop" className="btn btn-accent">
            {t('hero.cta')}
          </Link>
        </div>
      </section>

      <Section eyebrowKey="bestsellers.eyebrow" titleKey="bestsellers.title" items={bestsellers} />
      <Section eyebrowKey="featured.eyebrow" titleKey="featured.title" items={featured} />

      <Newsletter />
    </>
  )
}
