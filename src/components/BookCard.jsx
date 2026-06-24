import { Link } from 'react-router-dom'
import BookCover from './BookCover.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { formatLKR } from '../utils/format.js'

export default function BookCard({ book }) {
  const { lang, t } = useLanguage()
  const { addItem } = useCart()

  const title = lang === 'si' ? book.titleSi : book.title
  const author = lang === 'si' ? book.authorSi || book.author : book.author
  const badgeClass =
    book.badge === 'new' ? 'badge new' : book.badge === 'best' ? 'badge best' : 'badge'
  const badgeText =
    book.badge === 'new'
      ? lang === 'si'
        ? 'නවතම'
        : 'New'
      : book.badge === 'best'
        ? lang === 'si'
          ? 'ජනප්‍රිය'
          : 'Bestseller'
        : null

  return (
    <article className="book-card fade-in">
      <Link to={`/book/${book.id}`} className="cover-wrap" aria-label={title}>
        {badgeText && <span className={badgeClass}>{badgeText}</span>}
        <BookCover book={book} />
      </Link>
      <div className="book-card-body">
        <Link to={`/book/${book.id}`}>
          <h3 className={`book-card-title${lang === 'si' ? ' si' : ''}`}>{title}</h3>
        </Link>
        <div className={`book-card-author${lang === 'si' ? ' si' : ''}`}>{author}</div>
        <div className="book-card-foot">
          <span className="price">{formatLKR(book.price, t('currency'))}</span>
          <button
            className="btn btn-accent"
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            onClick={() => addItem(book, 1)}
            aria-label={`${t('book.addToCart')} — ${title}`}
          >
            +
          </button>
        </div>
      </div>
    </article>
  )
}
