import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { translations } from '../i18n/translations.js'

const LanguageContext = createContext(null)

const STORAGE_KEY = 'neja-lang'

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)
    return saved === 'si' || saved === 'en' ? saved : 'en'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.setAttribute('lang', lang)
  }, [lang])

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'si' : 'en'))
  }, [])

  // t(key, vars?) — returns translated string, falling back to English then the key.
  const t = useCallback(
    (key, vars) => {
      let str = translations[lang]?.[key] ?? translations.en[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, v)
        }
      }
      return str
    },
    [lang]
  )

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
