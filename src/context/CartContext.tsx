import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Book, CartItem } from '../types'

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  isOpen: boolean
  addItem: (book: Book, quantity?: number) => void
  removeItem: (bookId: string) => void
  setQuantity: (bookId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const CART_KEY = 'libraria.cart'

function readCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

function writeCart(items: CartItem[]) {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readCart())
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    writeCart(items)
  }, [items])

  const addItem = useCallback((book: Book, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.bookId === book.id)
      if (existing) {
        return prev.map((i) =>
          i.bookId === book.id ? { ...i, quantity: i.quantity + quantity } : i,
        )
      }
      return [
        ...prev,
        {
          bookId: book.id,
          title: book.title,
          author: book.author,
          coverSrc: book.cover.src,
          coverAlt: book.cover.alt,
          price: book.price,
          quantity,
        },
      ]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((bookId: string) => {
    setItems((prev) => prev.filter((i) => i.bookId !== bookId))
  }, [])

  const setQuantity = useCallback((bookId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.bookId !== bookId)
        : prev.map((i) => (i.bookId === bookId ? { ...i, quantity } : i)),
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0)
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    return {
      items,
      count,
      subtotal,
      isOpen,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      openCart,
      closeCart,
    }
  }, [items, isOpen, addItem, removeItem, setQuantity, clearCart, openCart, closeCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
