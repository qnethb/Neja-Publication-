import { useLanguage } from '../context/LanguageContext.jsx'

// Generated typographic book cover — no image assets needed, so nothing 404s.
// A darker shade of coverColor is derived for the gradient.
function darken(hex, amount = 0.78) {
  const c = hex.replace('#', '')
  const num = parseInt(c, 16)
  let r = (num >> 16) & 255
  let g = (num >> 8) & 255
  let b = num & 255
  r = Math.round(r * amount)
  g = Math.round(g * amount)
  b = Math.round(b * amount)
  return `rgb(${r}, ${g}, ${b})`
}

export default function BookCover({ book }) {
  const { lang } = useLanguage()
  const color = book.coverColor || '#0f5e5a'
  const title = lang === 'si' ? book.titleSi : book.title
  const author = lang === 'si' ? book.authorSi || book.author : book.author
  const isSinhalaText = lang === 'si'

  return (
    <div
      className="cover"
      style={{
        background: `linear-gradient(150deg, ${color} 0%, ${darken(color)} 100%)`,
      }}
      aria-hidden="true"
    >
      <span className="cover-deco" />
      <div className="cover-pub">Neja</div>
      <div>
        <div className={`cover-title${isSinhalaText ? ' si' : ''}`}>{title}</div>
        <div className={`cover-author${isSinhalaText ? ' si' : ''}`}>{author}</div>
      </div>
    </div>
  )
}
