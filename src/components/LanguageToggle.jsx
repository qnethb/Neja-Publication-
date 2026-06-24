import { useLanguage } from '../context/LanguageContext.jsx'

// Pill toggle between English and Sinhala.
export default function LanguageToggle() {
  const { lang, setLang } = useLanguage()
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button
        className={lang === 'en' ? 'active' : ''}
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
      <button
        className={`si ${lang === 'si' ? 'active' : ''}`}
        onClick={() => setLang('si')}
        aria-pressed={lang === 'si'}
      >
        සිං
      </button>
    </div>
  )
}
