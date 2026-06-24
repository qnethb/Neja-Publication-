import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import BookCard from '../components/BookCard.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { books, categories } from '../data/books.js'

export default function Shop() {
  const { t, lang } = useLanguage()
  const si = lang === 'si' ? 'si' : ''
  const [params, setParams] = useSearchParams()

  const q = params.get('q') || ''
  const category = params.get('category') || 'all'
  const sort = params.get('sort') || 'featured'

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value && value !== 'all' && value !== 'featured') next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  const results = useMemo(() => {
    let list = [...books]

    if (category !== 'all') list = list.filter((b) => b.category === category)

    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      list = list.filter((b) =>
        [b.title, b.titleSi, b.author, b.authorSi]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(needle))
      )
    }

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        list.sort((a, b) => b.added - a.added)
        break
      default:
        // featured first, then bestsellers
        list.sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            Number(b.bestseller) - Number(a.bestseller)
        )
    }
    return list
  }, [q, category, sort])

  const clearFilters = () => setParams(new URLSearchParams())

  return (
    <div className="page">
      <div className="container">
        <header className="page-head">
          <h1 className={si}>{t('shop.title')}</h1>
          <p className={`muted ${si}`}>{t('shop.sub')}</p>
        </header>

        <div className="shop-controls">
          <div className="tag-row category-filter">
            <button
              className={`chip ${category === 'all' ? 'active' : ''} ${si}`}
              onClick={() => setParam('category', 'all')}
            >
              {t('category.all')}
            </button>
            {categories.map((c) => (
              <button
                key={c}
                className={`chip ${category === c ? 'active' : ''} ${si}`}
                onClick={() => setParam('category', c)}
              >
                {t(`category.${c}`)}
              </button>
            ))}
          </div>

          <div className="shop-sort">
            <label htmlFor="sort" className={`muted ${si}`}>
              {t('shop.sort')}:
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className={si}
            >
              <option value="featured">{t('shop.sort.featured')}</option>
              <option value="newest">{t('shop.sort.newest')}</option>
              <option value="price-asc">{t('shop.sort.price-asc')}</option>
              <option value="price-desc">{t('shop.sort.price-desc')}</option>
            </select>
          </div>
        </div>

        <p className={`results-count muted ${si}`}>
          {results.length} {t('shop.results')}
          {q && ` · “${q}”`}
        </p>

        {results.length === 0 ? (
          <div className="empty-state">
            <div className="cart-empty-emoji">🔍</div>
            <p className={si}>{t('shop.empty')}</p>
            <button className="btn btn-primary" onClick={clearFilters}>
              {t('shop.clear')}
            </button>
          </div>
        ) : (
          <div className="book-grid">
            {results.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
