import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import BookCover from './BookCover.jsx'
import { books } from '../data/books.js'

export default function Hero() {
  const { t, lang } = useLanguage()
  const si = lang === 'si' ? 'si' : ''

  // Three covers to fan out in the hero collage.
  const showcase = books.filter((b) => b.featured).slice(0, 3)

  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-copy">
          <span className={`eyebrow ${si}`}>{t('hero.eyebrow')}</span>
          <h1 className={`hero-title ${si}`}>
            {t('hero.title')
              .split('\n')
              .map((line, idx) => (
                <span key={idx} style={{ display: 'block' }}>
                  {line}
                </span>
              ))}
          </h1>
          <p className={`hero-sub ${si}`}>{t('hero.sub')}</p>
          <div className="hero-cta">
            <Link to="/shop" className="btn btn-primary">
              {t('hero.cta')}
            </Link>
            <Link to="/shop?sort=newest" className="btn btn-ghost">
              {t('hero.cta2')} →
            </Link>
          </div>
          <div className="hero-stats">
            <div>
              <strong>500+</strong>
              <span className={si}>{t('hero.stat1')}</span>
            </div>
            <div>
              <strong>25</strong>
              <span className={si}>{t('hero.stat2')}</span>
            </div>
            <div>
              <strong>10k+</strong>
              <span className={si}>{t('hero.stat3')}</span>
            </div>
          </div>
        </div>

        <div className="hero-art">
          <div className="hero-books">
            {showcase.map((b, i) => (
              <Link
                to={`/book/${b.id}`}
                key={b.id}
                className={`hero-book hero-book-${i}`}
                aria-label={lang === 'si' ? b.titleSi : b.title}
              >
                <BookCover book={b} />
              </Link>
            ))}
          </div>
          <div className="hero-blob" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
