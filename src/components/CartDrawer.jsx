import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { formatLKR, amountToFreeDelivery, isFreeDelivery } from '../utils/format.js'
import BookCover from './BookCover.jsx'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, setQty, subtotal, count } = useCart()
  const { t, lang } = useLanguage()
  const navigate = useNavigate()

  const goCheckout = () => {
    closeCart()
    navigate('/checkout')
  }

  const remaining = amountToFreeDelivery(subtotal)
  const free = isFreeDelivery(subtotal)

  return (
    <>
      <div
        className={`drawer-overlay ${isOpen ? 'show' : ''}`}
        onClick={closeCart}
        aria-hidden={!isOpen}
      />
      <aside className={`cart-drawer ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
        <div className="cart-drawer-head">
          <h3 className={lang === 'si' ? 'si' : ''}>
            {t('cart.title')}{' '}
            {count > 0 && (
              <span className="muted" style={{ fontSize: '0.9rem' }}>
                ({count} {count === 1 ? t('cart.item') : t('cart.items')})
              </span>
            )}
          </h3>
          <button className="icon-btn" onClick={closeCart} aria-label="Close">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-emoji">📚</div>
            <p className={`cart-empty-title${lang === 'si' ? ' si' : ''}`}>
              {t('cart.empty')}
            </p>
            <p className={`muted${lang === 'si' ? ' si' : ''}`}>{t('cart.empty.sub')}</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                closeCart()
                navigate('/shop')
              }}
            >
              {t('cart.startShopping')}
            </button>
          </div>
        ) : (
          <>
            <div className="free-bar">
              {free ? (
                <span className={lang === 'si' ? 'si' : ''}>{t('checkout.freeUnlocked')}</span>
              ) : (
                <span className={lang === 'si' ? 'si' : ''}>
                  {t('checkout.freeProgress', {
                    amount: remaining.toLocaleString('en-LK'),
                  })}
                </span>
              )}
              <div className="free-track">
                <div
                  className="free-fill"
                  style={{ width: `${free ? 100 : Math.min(100, (subtotal / 5000) * 100)}%` }}
                />
              </div>
            </div>

            <div className="cart-items">
              {items.map((i) => (
                <div className="cart-item" key={i.id}>
                  <div className="cart-item-cover">
                    <BookCover book={i} />
                  </div>
                  <div className="cart-item-info">
                    <div className={`cart-item-title${lang === 'si' ? ' si' : ''}`}>
                      {lang === 'si' ? i.titleSi : i.title}
                    </div>
                    <div className="price">{formatLKR(i.price, t('currency'))}</div>
                    <div className="qty-row">
                      <button onClick={() => setQty(i.id, i.qty - 1)} aria-label="Decrease">
                        −
                      </button>
                      <span>{i.qty}</span>
                      <button onClick={() => setQty(i.id, i.qty + 1)} aria-label="Increase">
                        +
                      </button>
                      <button
                        className="remove-link"
                        onClick={() => removeItem(i.id)}
                      >
                        {t('cart.remove')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-drawer-foot">
              <div className="cart-subtotal">
                <span className={lang === 'si' ? 'si' : ''}>{t('cart.subtotal')}</span>
                <span className="price">{formatLKR(subtotal, t('currency'))}</span>
              </div>
              <button className="btn btn-primary btn-block" onClick={goCheckout}>
                {t('cart.checkout')}
              </button>
              <button className="btn btn-ghost btn-block" onClick={closeCart}>
                {t('cart.continue')}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
