import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconChevronDown, IconLogout, IconUser } from './icons'

/**
 * Small account dropdown shown when the visitor is (mock) logged in.
 */
export function AccountMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate('/')
  }

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-ink transition-colors hover:text-oxblood"
      >
        <IconUser className="h-5 w-5" />
        <span className="max-w-[8rem] truncate">{user?.name?.split(' ')[0] ?? 'Cont'}</span>
        <IconChevronDown
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-sm border border-ink/10 bg-paper-50 p-2 shadow-soft"
        >
          <div className="border-b border-ink/10 px-3 py-2">
            <p className="text-sm font-medium text-ink">{user?.name}</p>
            <p className="truncate text-xs text-ink-muted">{user?.email}</p>
          </div>
          <Link
            to="/cont"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="mt-1 flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-ink hover:bg-paper-200 hover:text-oxblood"
          >
            Contul meu
          </Link>
          <Link
            to="/cont#comenzi"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-ink hover:bg-paper-200 hover:text-oxblood"
          >
            Comenzile mele
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-ink hover:bg-paper-200 hover:text-oxblood"
          >
            <IconLogout className="h-4 w-4" /> Deconectare
          </button>
        </div>
      )}
    </div>
  )
}
