import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'neja-cart'

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { book, qty = 1 } = action
      const existing = state.find((i) => i.id === book.id)
      if (existing) {
        return state.map((i) =>
          i.id === book.id ? { ...i, qty: i.qty + qty } : i
        )
      }
      return [
        ...state,
        {
          id: book.id,
          title: book.title,
          titleSi: book.titleSi,
          author: book.author,
          price: book.price,
          coverColor: book.coverColor,
          qty,
        },
      ]
    }
    case 'REMOVE':
      return state.filter((i) => i.id !== action.id)
    case 'SET_QTY': {
      const qty = Math.max(1, action.qty)
      return state.map((i) => (i.id === action.id ? { ...i, qty } : i))
    }
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, loadInitial)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const value = useMemo(() => {
    const count = items.reduce((sum, i) => sum + i.qty, 0)
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
    return {
      items,
      count,
      subtotal,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem: (book, qty) => {
        dispatch({ type: 'ADD', book, qty })
        setIsOpen(true)
      },
      removeItem: (id) => dispatch({ type: 'REMOVE', id }),
      setQty: (id, qty) => dispatch({ type: 'SET_QTY', id, qty }),
      clearCart: () => dispatch({ type: 'CLEAR' }),
    }
  }, [items, isOpen])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
