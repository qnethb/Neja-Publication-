import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import LanguageToggle from './LanguageToggle.jsx'

export default function Navbar() {
  const { t, lang } = useLanguage()
  const { count, openCart } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const submitSearch = (e) => {
    e.preventDefault()
    navigate(`/shop?q=${encodeURIComponent(query.trim())}`)
    setMenuOpen(false)
  }

  const navClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')

  return (
    <>
      <div className="promo-bar">
        <div className="container">
          <span className={lang === 'si' ? 'si' : ''}>{t('promo.bar')}</span>
        </div>
      </div>

      <header className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark" aria-hidden="true">
              ने
            </span>
            <span className="brand-text">
              <span className={`brand-name${lang === 'si' ? ' si' : ''}`}>
                {t('brand.name')}
              </span>
              <span className={`brand-tag${lang === 'si' ? ' si' : ''}`}>
                {t('brand.tagline')}
              </span>
            </span>
          </Link>

          <form className="nav-search" onSubmit={submitSearch}>
            <input
              type="search"
              placeholder={t('nav.search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t('nav.search')}
            />
            <button type="submit" aria-label="Search">
              🔍
            </button>
          </form>

          <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <NavLink to="/" end className={navClass} onClick={() => setMenuOpen(false)}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/shop" className={navClass} onClick={() => setMenuOpen(false)}>
              {t('nav.shop')}
            </NavLink>
            <NavLink to="/about" className={navClass} onClick={() => setMenuOpen(false)}>
              {t('nav.about')}
            </NavLink>
            <NavLink to="/contact" className={navClass} onClick={() => setMenuOpen(false)}>
              {t('nav.contact')}
            </NavLink>
            <form className="nav-search nav-search-mobile" onSubmit={submitSearch}>
              <input
                type="search"
                placeholder={t('nav.search')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" aria-label="Search">
                🔍
              </button>
            </form>
          </nav>

          <div className="nav-actions">
            <LanguageToggle />
            <button className="cart-btn" onClick={openCart} aria-label={t('nav.cart')}>
              🛒
              {count > 0 && <span className="cart-count">{count}</span>}
            </button>
            <button
              className="menu-btn"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
