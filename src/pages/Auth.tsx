import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FormField } from '../components/FormField'
import { AnimatedSection } from '../components/AnimatedSection'
import { SectionHeading } from '../components/SectionHeading'
import { IconArrowLeft } from '../components/icons'

type Mode = 'login' | 'register' | 'forgot'

export default function Auth() {
  const navigate = useNavigate()
  const { login, register, requestPasswordReset } = useAuth()

  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setInfo(null)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        navigate('/', { replace: true })
      } else if (mode === 'register') {
        if (password.length < 6) {
          setError('Parola trebuie să aibă cel puțin 6 caractere.')
          return
        }
        if (password !== confirm) {
          setError('Parolele nu coincid.')
          return
        }
        await register(name, email, password)
        navigate('/', { replace: true })
      } else {
        await requestPasswordReset(email)
        setInfo('Dacă adresa există, vei primi un email cu pașii de resetare.')
        setMode('login')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'A apărut o eroare. Încearcă din nou.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pt-20 md:pt-24">
      <AnimatedSection className="container-page flex min-h-[70vh] flex-col items-center py-12">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 inline-flex items-center gap-2 self-start text-sm uppercase tracking-wider text-ink-muted transition-colors hover:text-brass-dark"
        >
          <IconArrowLeft className="h-4 w-4" />
          Înapoi
        </button>

        <SectionHeading
          eyebrow="Contul tău"
          title={mode === 'login' ? 'Intră în cont' : mode === 'register' ? 'Creează un cont' : 'Resetează parola'}
          align="center"
        />

        {/* Mode tabs */}
        {mode !== 'forgot' && (
          <div className="mt-8 flex rounded-sm border border-ink/15 p-1">
            <TabButton active={mode === 'login'} onClick={() => switchMode('login')}>
              Intră în cont
            </TabButton>
            <TabButton active={mode === 'register'} onClick={() => switchMode('register')}>
              Cont nou
            </TabButton>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-8 w-full max-w-md" noValidate>
          <div className="flex flex-col gap-4">
            {mode === 'register' && (
              <FormField label="Nume complet" htmlFor="auth-name" required>
                <input
                  id="auth-name"
                  className="field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </FormField>
            )}

            <FormField label="Email" htmlFor="auth-email" required>
              <input
                id="auth-email"
                type="email"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="adresa@email.ro"
              />
            </FormField>

            {mode !== 'forgot' && (
              <FormField label="Parolă" htmlFor="auth-password" required>
                <input
                  id="auth-password"
                  type="password"
                  className="field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </FormField>
            )}

            {mode === 'register' && (
              <FormField label="Confirmă parola" htmlFor="auth-confirm" required>
                <input
                  id="auth-confirm"
                  type="password"
                  className="field"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </FormField>
            )}
          </div>

          {error && (
            <p className="mt-4 text-sm text-oxblood" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="mt-4 text-sm text-oxblood" role="status">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary mt-6 w-full px-6 py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? 'Se procesează…'
              : mode === 'login'
                ? 'Intră în cont'
                : mode === 'register'
                  ? 'Creează cont'
                  : 'Trimite emailul de resetare'}
          </button>

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="mt-4 block w-full text-center text-sm text-brass-dark underline-offset-4 hover:underline"
            >
              Ai uitat parola?
            </button>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="mt-4 block w-full text-center text-sm text-brass-dark underline-offset-4 hover:underline"
            >
              Înapoi la autentificare
            </button>
          )}
        </form>

        <p className="mt-8 text-center text-xs text-ink-muted">
          Demo: cititor@example.com / parola123 · admin@libraria.ro / admin123
        </p>
      </AnimatedSection>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-6 py-2.5 text-sm uppercase tracking-wider transition-colors ${
        active ? 'bg-ink text-paper-50' : 'text-ink-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

