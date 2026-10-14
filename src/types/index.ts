/**
 * Core entity types for the bookstore.
 *
 * These describe the domain model consumed by the entire frontend.
 * The mock service layer (`src/services`) implements the same contracts a real
 * backend would later expose, so swapping data sources should not require
 * touching UI components.
 */

export type BookStatus = 'draft' | 'active'

export interface BookCover {
  /** URL or path to the cover image when available */
  src: string | null
  /** Accessible description / alt text for the cover image */
  alt: string
  /**
   * When no real cover is uploaded, the frontend renders an intentional
   * editorial placeholder built from the book's text fields.
   */
  placeholder?: {
    title: string
    author: string
    theme?: 'oxblood' | 'brass' | 'ink' | 'paper'
  }
}

export interface Book {
  id: string
  title: string
  author: string
  /** Short description shown on cards and hero */
  shortDescription: string
  /** Long-form description shown on the book detail page */
  description: string
  /** An excerpt / fragment to display as a printed-page sample */
  excerpt: string
  price: number
  /** Available quantity in stock */
  stock: number
  currency: string
  /** Cover image plus any gallery images */
  cover: BookCover
  gallery?: string[]
  isbn?: string
  pages?: number
  year?: number
  language?: string
  format?: string
  category?: string
  featured?: boolean
  status: BookStatus
  tags?: string[]
}

export interface CartItem {
  bookId: string
  title: string
  author: string
  coverSrc: string | null
  coverAlt: string
  price: number
  quantity: number
}

export type UserRole = 'customer' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface ShippingAddress {
  fullName: string
  email: string
  phone: string
  county: string
  locality: string
  street: string
  number: string
  block?: string
  staircase?: string
  floor?: string
  apartment?: string
  postalCode?: string
  notes?: string
}

export interface OrderLine {
  bookId: string
  title: string
  author: string
  price: number
  quantity: number
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

/** How an order is delivered (SameDay courier home, or EasyBox pickup point). */
export type DeliveryMethod = 'courier' | 'easybox'

export interface EasyBox {
  id: string
  city: string
  name: string
  address: string
  /** WGS84 coordinates, used to plot the EasyBox on the checkout map. Optional —
   * the SameDay live API provides them; the bundled demo list carries
   * approximate ones. Guard on the frontend for boxes without coordinates. */
  lat?: number
  lng?: number
}

export interface OrderDraft {
  id: string
  reference: string
  lines: OrderLine[]
  shipping: ShippingAddress
  subtotal: number
  /** Shipping fee (RON) for the chosen delivery method. */
  shippingCost: number
  /** Grand total = subtotal + shippingCost. */
  total: number
  deliveryMethod: DeliveryMethod
  /** The chosen SameDay EasyBox (present only when deliveryMethod === 'easybox'). */
  easybox?: { name: string; address: string }
  /** No online payment — this stays null by design in this frontend-only build. */
  payment: null
  status: OrderStatus
  createdAt: string
  userId?: string
}

export interface CustomerAddress {
  id: string
  label: string
  recipient: string
  phone: string
  address: Omit<ShippingAddress, 'fullName' | 'email' | 'phone' | 'notes'>
}

export interface AdminBookInput {
  title: string
  author: string
  price: number
  stock: number
  coverSrc: string | null
  gallery: string[]
  shortDescription: string
  description: string
  excerpt: string
  isbn?: string
  pages?: number
  year?: number
  language?: string
  format?: string
  category?: string
  featured: boolean
  status: BookStatus
}

export type MockResult<T> = Promise<T>
