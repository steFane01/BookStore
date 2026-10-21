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

interface AddItemOptions {
  quantity?: number
  /** Chosen variant id (when the product offers variants). */
  variantId?: string
  /** Human-readable variant name (for the order summary). */
  variantName?: string
  /** Effective per-unit price for the chosen variant (base + delta). */
  price?: number
  /** 'digital' items carry no shipping. */
  productType?: 'physical' | 'digital'
}

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  isOpen: boolean
  addItem: (book: Book, options?: AddItemOptions) => void
  removeItem: (bookId: string, variantId?: string) => void
  setQuantity: (bookId: string, quantity: number, variantId?: string) => void
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

  const addItem = useCallback((book: Book, options: AddItemOptions = {}) => {
    const quantity = options.quantity ?? 1
    const variantId = options.variantId
    const key = variantId ? `${book.id}__${variantId}` : book.id
    setItems((prev) => {
      const existing = prev.find(
        (i) => (i.variantId ? `${i.bookId}__${i.variantId}` : i.bookId) === key,
      )
      if (existing) {
        return prev.map((i) =>
          (i.variantId ? `${i.bookId}__${i.variantId}` : i.bookId) === key
            ? { ...i, quantity: i.quantity + quantity }
            : i,
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
          price: options.price ?? book.price,
          quantity,
          variantId,
          variantName: options.variantName,
          productType: options.productType ?? book.productType,
        },
      ]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((bookId: string, variantId?: string) => {
    setItems((prev) =>
      prev.filter((i) =>
        variantId
          ? !(i.bookId === bookId && i.variantId === variantId)
          : i.bookId !== bookId,
      ),
    )
  }, [])

  const setQuantity = useCallback(
    (bookId: string, quantity: number, variantId?: string) => {
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((i) =>
              variantId
                ? !(i.bookId === bookId && i.variantId === variantId)
                : i.bookId !== bookId,
            )
          : prev.map((i) =>
              i.bookId === bookId && (variantId ? i.variantId === variantId : true)
                ? { ...i, quantity }
                : i,
            ),
      )
    },
    [],
  )

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
