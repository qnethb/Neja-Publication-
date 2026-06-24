import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import BookCover from '../components/BookCover.jsx'
import BookCard from '../components/BookCard.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { getBook, getRelated } from '../data/books.js'
import { formatLKR } from '../utils/format.js'

export default function BookDetail() {
  const { id } = useParams()
  const { t, lang } = useLanguage()
  const si = lang === 'si' ? 'si' : ''
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [qty, setQtyState] = useState(1)
  const [justAdded, setJustAdded] = useState(false)

  const book = getBook(id)

  if (!book) {
    return (
      <div className="page container empty-state">
        <h2 className={si}>{t('book.notFound')}</h2>
        <Link to="/shop" className="btn btn-primary">
          {t('book.backToShop')}
        </Link>
      </div>
    )
  }

  const title = lang === 'si' ? book.titleSi : book.title
  const author = lang === 'si' ? book.authorSi || book.author : book.author
  const synopsis = lang === 'si' ? book.synopsisSi : book.synopsis
  const related = getRelated(book)

  const langLabel =
    book.language === 'sinhala'
      ? t('lang.sinhala')
      : book.language === 'english'
        ? t('lang.english')
        : t('lang.bilingual')

  const handleAdd = () => {
    addItem(book, qty)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1800)
  }

  const buyNow = () => {
    addItem(book, qty)
    navigate('/checkout')
  }

  return (
    <div className="page">
      <div className="container">
        <nav className="breadcrumb">
          <Link to="/">{t('nav.home')}</Link> ›{' '}
          <Link to="/shop">{t('nav.shop')}</Link> › <span className={si}>{title}</span>
        </nav>

        <div className="book-detail">
          <div className="book-detail-cover">
            <BookCover book={book} />
          </div>

          <div className="book-detail-info">
            <div className={`eyebrow ${si}`}>{t(`category.${book.category}`)}</div>
            <h1 className={si}>{title}</h1>
            <p className={`book-detail-author ${si}`}>
              {t('book.by')} <strong>{author}</strong>
            </p>

            <div className="book-detail-price">
              <span className="price-big">{formatLKR(book.price, t('currency'))}</span>
              <span className={`stock-pill ${si}`}>● {t('book.inStock')}</span>
            </div>

            <p className={`book-detail-synopsis ${si}`}>{synopsis}</p>

            <div className="buy-row">
              <div className="qty-stepper" aria-label={t('book.qty')}>
                <button onClick={() => setQtyState((q) => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQtyState((q) => q + 1)}>+</button>
              </div>
              <button className="btn btn-primary" onClick={handleAdd}>
                {justAdded ? t('book.added') : t('book.addToCart')}
              </button>
              <button className="btn btn-accent" onClick={buyNow}>
                {t('book.buyNow')}
              </button>
            </div>

            <dl className="book-meta">
              <div>
                <dt className={si}>{t('book.category')}</dt>
                <dd className={si}>{t(`category.${book.category}`)}</dd>
              </div>
              <div>
                <dt className={si}>{t('book.language')}</dt>
                <dd className={si}>{langLabel}</dd>
              </div>
              <div>
                <dt className={si}>{t('book.pages')}</dt>
                <dd>{book.pages}</dd>
              </div>
              <div>
                <dt className={si}>{t('book.isbn')}</dt>
                <dd>{book.isbn}</dd>
              </div>
            </dl>
          </div>
        </div>

        {related.length > 0 && (
          <section className="section" style={{ paddingTop: '24px' }}>
            <div className="section-head">
              <h2 className={si}>{t('book.related')}</h2>
            </div>
            <div className="book-grid">
              {related.map((b) => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
