import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { Header } from './components/Header'
import { Footer } from './components/Footer'

import Home from './pages/Home'
import BookDetail from './pages/BookDetail'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Auth from './pages/Auth'
import Account from './pages/Account'
import Admin from './pages/Admin'
import About from './pages/About'
import Contact from './pages/Contact'

/**
 * Scrolls to the top whenever the route changes. This keeps the fixed header
 * from leaving the user mid-page between navigation and is a common SPA need.
 */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ScrollToTop />
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/carte/:id" element={<BookDetail />} />
              <Route path="/comanda" element={<Checkout />} />
              <Route path="/comanda/:id" element={<OrderSuccess />} />
              <Route path="/autentificare" element={<Auth />} />
              <Route path="/cont" element={<Account />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/despre" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/termeni" element={<SimplePage title="Termeni și condiții" />} />
              <Route path="/confidentialitate" element={<SimplePage title="Politica de confidențialitate" />} />
              <Route path="/cookies" element={<SimplePage title="Politica de cookies" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  )
}

function SimplePage({ title }: { title: string }) {
  return (
    <div className="pt-20 md:pt-24">
      <div className="container-page max-w-2xl py-16">
        <h1 className="serif-display text-4xl text-ink">{title}</h1>
        <div className="mt-6 flex flex-col gap-4 leading-relaxed text-ink-muted">
          <p>
            Această pagină este doar demonstrativă în această versiune a sitului.
            Într-o implementare completă, aici ar apărea textul legal relevant.
          </p>
          <p>
            Dacă ai întrebări legate de această politică, ne poți contacta la{' '}
            <a href="mailto:bun@libraria.ro" className="text-brass-dark underline underline-offset-2">
              bun@libraria.ro
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="container-page flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <p className="font-serif text-7xl text-brass-dark">404</p>
      <h1 className="font-serif text-3xl text-ink">Pagina nu a fost găsită.</h1>
      <a href="/" className="btn btn-primary px-6 py-3">
        Înapoi la magazin
      </a>
    </div>
  )
}
