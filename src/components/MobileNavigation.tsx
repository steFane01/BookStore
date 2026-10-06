import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useEscape, useLockBody } from '../hooks/useEscape'
import { siteConfig } from '../config/site'
import { IconClose, IconUser, IconCart } from './icons'

interface MobileNavigationProps {
  open: boolean
  onClose: () => void
}

const navItems = [
  { to: '/', label: 'Magazin' },
  { to: '/despre', label: 'Despre' },
  { to: '/contact', label: 'Contact' },
]

/**
 * Editorial full-width mobile navigation drawer.
 * Uses a masked paper slide-up rather than a generic hamburger panel.
 */
export function MobileNavigation({ open, onClose }: MobileNavigationProps) {
  const { isAuthenticated, isAdmin } = useAuth()
  const { openCart } = useCart()
  const navigate = useNavigate()

  useEscape(onClose, open)
  useLockBody(open)

  useEffect(() => {
    if (!open) return
    const onResize = () => {
      if (window.innerWidth >= 768) onClose()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [open, onClose])

  return (
    <div
      className={`fixed inset-0 z-50 md:hidden ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-500 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* Panel */}
      <div
        className={`absolute inset-0 flex flex-col bg-paper-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'translate-y-0' : '-translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Meniu"
      >
        <div className="container-page flex h-16 items-center justify-between pt-2">
          <span className="font-serif text-2xl text-ink">{siteConfig.brandName}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Închide meniul"
            className="rounded-sm p-2 text-ink transition-colors hover:text-oxblood"
          >
            <IconClose className="h-6 w-6" />
          </button>
        </div>

        <nav className="container-page mt-8 flex flex-col gap-1" aria-label="Navigare mobilă">
          {[...navItems, ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : [])].map(
            (item, i) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                style={{
                  transitionDelay: open ? `${120 + i * 60}ms` : '0ms',
                  transform: open ? 'none' : 'translateY(16px)',
                  opacity: open ? 1 : 0,
                }}
                className={({ isActive }) =>
                  `border-b border-ink/10 py-4 font-serif text-3xl transition-all duration-500 ${
                    isActive ? 'text-oxblood' : 'text-ink'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="container-page mt-auto flex items-center gap-6 pb-10 pt-8">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate('/cont')
              }}
              className="flex items-center gap-2 text-sm font-medium text-ink hover:text-oxblood"
            >
              <IconUser className="h-5 w-5" /> Contul meu
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate('/autentificare')
              }}
              className="flex items-center gap-2 text-sm font-medium text-ink hover:text-oxblood"
            >
              <IconUser className="h-5 w-5" /> Cont
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onClose()
              openCart()
            }}
            className="flex items-center gap-2 text-sm font-medium text-ink hover:text-oxblood"
          >
            <IconCart className="h-5 w-5" /> Coș
          </button>
        </div>
      </div>
    </div>
  )
}
