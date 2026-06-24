import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { business } from '../data/business.js'

export default function Footer() {
  const { t, lang } = useLanguage()
  const si = lang === 'si' ? 'si' : ''
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">
            <span className="brand-mark" aria-hidden="true">
              ने
            </span>
            <span className={`brand-name ${si}`}>{t('brand.name')}</span>
          </div>
          <p className={`muted ${si}`}>{t('footer.about')}</p>
          <div className="social-row">
            <a href={business.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
              f
            </a>
            <a href={business.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
              ⌾
            </a>
          </div>
        </div>

        <div>
          <h4 className={si}>{t('footer.quick')}</h4>
          <ul className="footer-links">
            <li>
              <Link to="/" className={si}>
                {t('nav.home')}
              </Link>
            </li>
            <li>
              <Link to="/shop" className={si}>
                {t('nav.shop')}
              </Link>
            </li>
            <li>
              <Link to="/about" className={si}>
                {t('nav.about')}
              </Link>
            </li>
            <li>
              <Link to="/contact" className={si}>
                {t('nav.contact')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className={si}>{t('footer.categories')}</h4>
          <ul className="footer-links">
            <li>
              <Link to="/shop?category=sinhala-literature" className={si}>
                {t('category.sinhala-literature')}
              </Link>
            </li>
            <li>
              <Link to="/shop?category=english-fiction" className={si}>
                {t('category.english-fiction')}
              </Link>
            </li>
            <li>
              <Link to="/shop?category=childrens" className={si}>
                {t('category.childrens')}
              </Link>
            </li>
            <li>
              <Link to="/shop?category=academic" className={si}>
                {t('category.academic')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className={si}>{t('footer.contact')}</h4>
          <ul className="footer-links">
            <li className={si}>{lang === 'si' ? business.addressSi : business.addressEn}</li>
            <li>
              <a href={`tel:${business.phoneDisplay.replace(/\s/g, '')}`}>
                {business.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${business.email}`}>{business.email}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <span className={si}>
            © {year} {t('brand.name')}. {t('footer.rights')}
          </span>
          <span className="footer-pay">
            <span className={`muted ${si}`}>{t('footer.payments')}:</span> COD · Bank · WhatsApp
          </span>
          <span className={`muted ${si}`}>{t('footer.madein')}</span>
        </div>
      </div>
    </footer>
  )
}
