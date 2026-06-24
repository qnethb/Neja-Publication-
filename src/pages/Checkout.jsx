import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { districts } from '../data/districts.js'
import { bankDetails, business } from '../data/business.js'
import {
  formatLKR,
  calcDelivery,
  isFreeDelivery,
  amountToFreeDelivery,
  makeOrderRef,
} from '../utils/format.js'
import { buildOrderWhatsAppLink } from '../utils/whatsapp.js'

const PAYMENT_METHODS = [
  { id: 'cod', icon: '💵', labelKey: 'checkout.pay.cod', descKey: 'checkout.pay.cod.desc' },
  { id: 'bank', icon: '🏦', labelKey: 'checkout.pay.bank', descKey: 'checkout.pay.bank.desc' },
  {
    id: 'whatsapp',
    icon: '💬',
    labelKey: 'checkout.pay.whatsapp',
    descKey: 'checkout.pay.whatsapp.desc',
  },
]

// Accepts 07XXXXXXXX, +947XXXXXXXX or 947XXXXXXXX style numbers.
function isValidLKPhone(value) {
  const digits = value.replace(/[\s-]/g, '')
  return /^(?:\+?94|0)7\d{8}$/.test(digits)
}

export default function Checkout() {
  const { t, lang } = useLanguage()
  const si = lang === 'si' ? 'si' : ''
  const { items, subtotal, clearCart } = useCart()

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
    notes: '',
  })
  const [payment, setPayment] = useState('cod')
  const [errors, setErrors] = useState({})
  const [placed, setPlaced] = useState(null) // { ref, payment }

  const delivery = useMemo(
    () => calcDelivery(subtotal, form.district),
    [subtotal, form.district]
  )
  const free = isFreeDelivery(subtotal)
  const total = subtotal + delivery
  const remaining = amountToFreeDelivery(subtotal)

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const validate = () => {
    const er = {}
    if (!form.name.trim()) er.name = t('checkout.required')
    if (!form.phone.trim()) er.phone = t('checkout.required')
    else if (!isValidLKPhone(form.phone)) er.phone = t('checkout.phoneInvalid')
    if (!form.address.trim()) er.address = t('checkout.required')
    if (!form.city.trim()) er.city = t('checkout.required')
    if (!form.district) er.district = t('checkout.required')
    setErrors(er)
    return Object.keys(er).length === 0
  }

  const districtLabel = (id) => {
    const d = districts.find((x) => x.id === id)
    return d ? (lang === 'si' ? d.si : d.en) : ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) {
      // Focus the first invalid field's section by scrolling up.
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const ref = makeOrderRef()
    const paymentLabel = t(PAYMENT_METHODS.find((p) => p.id === payment).labelKey)

    if (payment === 'whatsapp') {
      const link = buildOrderWhatsAppLink({
        items,
        subtotal,
        delivery,
        total,
        customer: { ...form },
        district: districtLabel(form.district),
        payment: paymentLabel,
        orderRef: ref,
      })
      window.open(link, '_blank', 'noopener')
    }

    setPlaced({ ref, payment, total, delivery })
    clearCart()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ---- Confirmation screen ----
  if (placed) {
    return (
      <div className="page">
        <div className="container narrow">
          <div className="confirm-card card fade-in">
            <div className="confirm-emoji">🎉</div>
            <h1 className={si}>{t('confirm.title')}</h1>
            <p className={`muted ${si}`}>{t('confirm.sub')}</p>
            <div className="confirm-ref">
              <span className={si}>{t('confirm.orderId')}</span>
              <strong>{placed.ref}</strong>
            </div>

            {placed.payment === 'bank' && (
              <div className="bank-box">
                <p className={si}>{t('confirm.bankNote')}</p>
                <BankDetails t={t} si={si} />
              </div>
            )}
            {placed.payment === 'cod' && (
              <p className={`confirm-note ${si}`}>{t('confirm.codNote')}</p>
            )}

            <Link to="/shop" className="btn btn-primary">
              {t('confirm.continue')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ---- Empty cart ----
  if (items.length === 0) {
    return (
      <div className="page">
        <div className="container narrow empty-state">
          <div className="cart-empty-emoji">🛒</div>
          <p className={si}>{t('checkout.empty')}</p>
          <Link to="/shop" className="btn btn-primary">
            {t('cart.startShopping')}
          </Link>
        </div>
      </div>
    )
  }

  // ---- Checkout form ----
  return (
    <div className="page">
      <div className="container">
        <header className="page-head">
          <h1 className={si}>{t('checkout.title')}</h1>
        </header>

        {!free && (
          <div className={`free-banner ${si}`}>
            {t('checkout.freeProgress', { amount: remaining.toLocaleString('en-LK') })}
          </div>
        )}

        <form className="checkout-grid" onSubmit={handleSubmit} noValidate>
          <div className="checkout-main">
            <section className="card">
              <h3 className={si}>{t('checkout.contact')}</h3>
              <div className="field">
                <label className={si}>{t('checkout.name')}</label>
                <input
                  className={errors.name ? 'invalid' : ''}
                  value={form.name}
                  onChange={update('name')}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className={si}>{t('checkout.phone')}</label>
                  <input
                    className={errors.phone ? 'invalid' : ''}
                    value={form.phone}
                    onChange={update('phone')}
                    placeholder="07X XXX XXXX"
                    inputMode="tel"
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>
                <div className="field">
                  <label className={si}>{t('checkout.email')}</label>
                  <input type="email" value={form.email} onChange={update('email')} />
                </div>
              </div>
              <div className="field">
                <label className={si}>{t('checkout.address')}</label>
                <textarea
                  rows="2"
                  className={errors.address ? 'invalid' : ''}
                  value={form.address}
                  onChange={update('address')}
                />
                {errors.address && <span className="error-text">{errors.address}</span>}
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className={si}>{t('checkout.city')}</label>
                  <input
                    className={errors.city ? 'invalid' : ''}
                    value={form.city}
                    onChange={update('city')}
                  />
                  {errors.city && <span className="error-text">{errors.city}</span>}
                </div>
                <div className="field">
                  <label className={si}>{t('checkout.district')}</label>
                  <select
                    className={`${errors.district ? 'invalid' : ''} ${si}`}
                    value={form.district}
                    onChange={update('district')}
                  >
                    <option value="">{t('checkout.selectDistrict')}</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {lang === 'si' ? d.si : d.en}
                      </option>
                    ))}
                  </select>
                  {errors.district && <span className="error-text">{errors.district}</span>}
                </div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className={si}>{t('checkout.notes')}</label>
                <textarea rows="2" value={form.notes} onChange={update('notes')} />
              </div>
            </section>

            <section className="card">
              <h3 className={si}>{t('checkout.payment')}</h3>
              <div className="payment-options">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.id}
                    className={`payment-option ${payment === m.id ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={m.id}
                      checked={payment === m.id}
                      onChange={() => setPayment(m.id)}
                    />
                    <span className="payment-icon" aria-hidden="true">
                      {m.icon}
                    </span>
                    <span className="payment-text">
                      <strong className={si}>{t(m.labelKey)}</strong>
                      <span className={`muted ${si}`}>{t(m.descKey)}</span>
                    </span>
                  </label>
                ))}
              </div>

              {payment === 'bank' && (
                <div className="bank-box">
                  <strong className={si}>{t('checkout.bankDetails')}</strong>
                  <BankDetails t={t} si={si} />
                </div>
              )}
            </section>
          </div>

          <aside className="checkout-summary card">
            <h3 className={si}>{t('checkout.summary')}</h3>
            <div className="summary-items">
              {items.map((i) => (
                <div className="summary-line" key={i.id}>
                  <span className={si}>
                    {(lang === 'si' ? i.titleSi : i.title)} × {i.qty}
                  </span>
                  <span>{formatLKR(i.price * i.qty, t('currency'))}</span>
                </div>
              ))}
            </div>
            <hr />
            <div className="summary-line">
              <span className={si}>{t('cart.subtotal')}</span>
              <span>{formatLKR(subtotal, t('currency'))}</span>
            </div>
            <div className="summary-line">
              <span className={si}>{t('checkout.delivery')}</span>
              <span>
                {delivery === 0 ? (
                  <span className="free-tag">{t('checkout.deliveryFree')}</span>
                ) : (
                  formatLKR(delivery, t('currency'))
                )}
              </span>
            </div>
            <hr />
            <div className="summary-line total">
              <span className={si}>{t('checkout.total')}</span>
              <span>{formatLKR(total, t('currency'))}</span>
            </div>

            <button
              type="submit"
              className={`btn btn-block ${payment === 'whatsapp' ? 'btn-whatsapp' : 'btn-primary'}`}
            >
              {payment === 'whatsapp' ? t('checkout.sendWhatsApp') : t('checkout.placeOrder')}
            </button>
            <p className={`summary-fineprint muted ${si}`}>
              {business.phoneDisplay} · {business.email}
            </p>
          </aside>
        </form>
      </div>
    </div>
  )
}

function BankDetails({ t, si }) {
  return (
    <ul className="bank-list">
      <li>
        <span className={`muted ${si}`}>{t('checkout.bank.bank')}</span>
        <strong>{bankDetails.bank}</strong>
      </li>
      <li>
        <span className={`muted ${si}`}>{t('checkout.bank.account')}</span>
        <strong>{bankDetails.accountName}</strong>
      </li>
      <li>
        <span className={`muted ${si}`}>{t('checkout.bank.number')}</span>
        <strong>{bankDetails.accountNumber}</strong>
      </li>
      <li>
        <span className={`muted ${si}`}>{t('checkout.bank.branch')}</span>
        <strong>{bankDetails.branch}</strong>
      </li>
    </ul>
  )
}
