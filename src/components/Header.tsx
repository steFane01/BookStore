import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { siteConfig } from '../config/site'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { MobileNavigation } from './MobileNavigation'
import { CartDrawer } from './CartDrawer'
import { AccountMenu } from './AccountMenu'
import { BrandLogo } from './BrandLogo'
import { IconCart, IconMenu, IconUser } from './icons'

const navItems = [
  { to: '/', label: 'Magazin' },
  { to: '/despre', label: 'Despre' },
  { to: '/contact', label: 'Contact' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { count, openCart } = useCart()
  const { isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()

  const onLogo = (e: React.MouseEvent) => {
    e.preventDefault()
    setMobileOpen(false)
    navigate('/')
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-ink/10 bg-paper-100/95 backdrop-blur transition-colors">
        <div className="container-page flex h-16 items-center justify-between gap-4 md:h-20">
          {/* Brand */}
          <Link
            to="/"
            onClick={onLogo}
            className="relative z-10 flex items-center gap-2.5 font-serif text-2xl tracking-tight text-ink"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-200/70 ring-1 ring-ink/10 md:h-11 md:w-11">
              {/* Logo image — graceful fallback so text brand stays visible. */}
              <span className="h-full w-full overflow-hidden rounded-full">
                <BrandLogo className="h-full w-full" />
              </span>
            </span>
            <span className="leading-none">{siteConfig.brandName}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex" aria-label="Navigare principală">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `link-underline text-sm font-medium tracking-wide transition-colors ${
                    isActive ? 'text-oxblood' : 'text-ink hover:text-oxblood'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden rounded-sm px-2 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-oxblood md:inline-flex"
              >
                Admin
              </Link>
            )}

            {isAuthenticated ? (
              <AccountMenu />
            ) : (
              <Link
                to="/autentificare"
                className="hidden items-center gap-2 px-2 py-1.5 text-sm font-medium text-ink transition-colors hover:text-oxblood sm:inline-flex"
              >
                <IconUser className="h-5 w-5" />
                Cont
              </Link>
            )}

            {/* Cart */}
            <button
              type="button"
              onClick={openCart}
              aria-label={`Coș de cumpărături, ${count} articole`}
              className="relative inline-flex items-center gap-2 rounded-sm px-2 py-1.5 text-ink transition-colors hover:text-oxblood"
            >
              <IconCart className="h-5 w-5" />
              {count > 0 && (
                <span
                  key={count}
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-oxblood px-1 text-[10px] font-semibold text-paper-100 animate-slide-up"
                  aria-hidden="true"
                >
                  {count}
                </span>
              )}
              <span className="hidden text-sm font-medium sm:inline">Coș</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Deschide meniul"
              className="inline-flex items-center rounded-sm p-2 text-ink transition-colors hover:text-oxblood md:hidden"
            >
              <IconMenu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <MobileNavigation open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <CartDrawer />
    </>
  )
}
