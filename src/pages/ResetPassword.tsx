import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authService } from '../services/authService'
import { FormField } from '../components/FormField'
import { AnimatedSection } from '../components/AnimatedSection'
import { SectionHeading } from '../components/SectionHeading'
import { IconCheck, IconArrowLeft } from '../components/icons'

/**
 * Password reset page.
 *
 * Users reach this via the link in the password-reset email
 * (`/resetare-parola/:token`). They set a new password; the single-use token is
 * validated by `POST /api/auth/reset-password` on the backend.
 */
export default function ResetPassword() {
  const { token = '' } = useParams()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere.')
      return
    }
    if (password !== confirm) {
      setError('Parolele nu coincid.')
      return
    }
    setSubmitting(true)
    try {
      await authService.resetPassword(token, password)
      setDone(true)
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
          onClick={() => navigate('/autentificare')}
          className="mb-8 inline-flex items-center gap-2 self-start text-sm uppercase tracking-wider text-ink-muted transition-colors hover:text-brass-dark"
        >
          <IconArrowLeft className="h-4 w-4" />
          Înapoi la autentificare
        </button>

        <SectionHeading
          eyebrow="Contul tău"
          title={done ? 'Parolă schimbată' : 'Alege o parolă nouă'}
          align="center"
        />

        {done ? (
          <div className="mt-10 flex w-full max-w-md flex-col items-center gap-4 text-center">
            <IconCheck className="h-8 w-8 text-oxblood" />
            <p className="text-ink-light">
              Parola ta a fost schimbată cu succes. Te poți autentifica acum cu noua parolă.
            </p>
            <Link to="/autentificare" className="btn btn-primary mt-2 px-6 py-3">
              Intră în cont
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 w-full max-w-md" noValidate>
            <div className="flex flex-col gap-4">
              <FormField label="Parolă nouă" htmlFor="reset-password" required>
                <input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  className="field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormField>
              <FormField label="Confirmă parola" htmlFor="reset-confirm" required>
                <input
                  id="reset-confirm"
                  type="password"
                  autoComplete="new-password"
                  className="field"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </FormField>
            </div>

            {error && (
              <p className="mt-4 text-sm text-oxblood" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary mt-6 w-full px-6 py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Se salvează…' : 'Schimbă parola'}
            </button>
          </form>
        )}
      </AnimatedSection>
    </div>
  )
}
