import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { business } from '../data/business.js'
import { buildContactWhatsAppLink } from '../utils/whatsapp.js'

export default function Contact() {
  const { t, lang } = useLanguage()
  const si = lang === 'si' ? 'si' : ''
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  const sendWhatsApp = (e) => {
    e.preventDefault()
    const text = `Hello Neja Publication!\n\nName: ${name}\n\n${message}`
    window.open(buildContactWhatsAppLink(text), '_blank', 'noopener')
  }

  return (
    <div className="page">
      <div className="container">
        <header className="page-head">
          <h1 className={si}>{t('contact.title')}</h1>
          <p className={`muted ${si}`}>{t('contact.sub')}</p>
        </header>

        <div className="contact-grid">
          <div className="contact-info">
            <div className="contact-block">
              <span className="contact-icon">📍</span>
              <div>
                <strong className={si}>{t('contact.address')}</strong>
                <p className={si}>{lang === 'si' ? business.addressSi : business.addressEn}</p>
              </div>
            </div>
            <div className="contact-block">
              <span className="contact-icon">📞</span>
              <div>
                <strong className={si}>{t('contact.phone')}</strong>
                <p>
                  <a href={`tel:${business.phoneDisplay.replace(/\s/g, '')}`}>
                    {business.phoneDisplay}
                  </a>
                </p>
              </div>
            </div>
            <div className="contact-block">
              <span className="contact-icon">✉️</span>
              <div>
                <strong className={si}>{t('contact.email')}</strong>
                <p>
                  <a href={`mailto:${business.email}`}>{business.email}</a>
                </p>
              </div>
            </div>
            <div className="contact-block">
              <span className="contact-icon">🕘</span>
              <div>
                <strong className={si}>{t('contact.hours')}</strong>
                <p className={si}>{t('contact.hours.text')}</p>
              </div>
            </div>
            <a
              href={buildContactWhatsAppLink()}
              target="_blank"
              rel="noreferrer"
              className="btn btn-whatsapp"
            >
              💬 {t('contact.whatsapp')}
            </a>
          </div>

          <form className="card contact-form" onSubmit={sendWhatsApp}>
            <h3 className={si}>{t('contact.form.title')}</h3>
            <div className="field">
              <label className={si}>{t('checkout.name')}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label className={si}>{t('contact.form.message')}</label>
              <textarea
                rows="5"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-whatsapp btn-block">
              💬 {t('contact.form.send')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
