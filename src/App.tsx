import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { CartProvider } from './context/CartContext'
import { DialogProvider } from './context/DialogContext'
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
import ResetPassword from './pages/ResetPassword'
import Legal from './pages/Legal'
import OrderTracking from './pages/OrderTracking'

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
    <SettingsProvider>
      <AuthProvider>
        <CartProvider>
          <DialogProvider>
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
                  <Route path="/resetare-parola/:token" element={<ResetPassword />} />
                  <Route path="/cont" element={<Account />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/despre" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/termeni" element={<Legal kind="terms" />} />
                  <Route path="/confidentialitate" element={<Legal kind="privacy" />} />
                  <Route path="/cookies" element={<Legal kind="cookies" />} />
                  <Route path="/urmarire-comanda" element={<OrderTracking />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </DialogProvider>
        </CartProvider>
      </AuthProvider>
    </SettingsProvider>
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
