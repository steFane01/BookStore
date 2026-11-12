import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  newsletterService,
  type CampaignResult,
} from '../../services/newsletterService'
import { useAuth } from '../../context/AuthContext'
import { useDialog } from '../../context/DialogContext'
import { useSettings } from '../../context/SettingsContext'
import { FormField } from '../../components/FormField'

const SUBJECT_MAX = 160
const MESSAGE_MAX = 8000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Ready-made offer copy the owner can start from and edit. */
const EXAMPLE_SUBJECT = 'Trei cărți noi și 10% reducere pentru cititorii noștri'

const EXAMPLE_MESSAGE = `Bună,

Săptămâna aceasta au intrat în librărie trei titluri alese cu grijă, iar pentru cititorii newsletterului avem o ofertă mică: 10% reducere la toate cărțile de eseuri, până duminică.

• „Cartea întâi” — 49 lei
• „Cartea a doua” — 42 lei
• „Cartea a treia” — 55 lei

Reducerea se aplică automat în coș. Comenzile plasate până duminică pleacă luni dimineață, cu tot cu semnul de carte.

Spor la citit,
Echipa`

/**
 * Admin → „Campanie email”: compose the offer email, preview it, send a test
 * copy and then deliver it to every newsletter subscriber.
 */
export function AdminNewsletterCampaign() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const { confirm } = useDialog()

  const [subscribers, setSubscribers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [testTo, setTestTo] = useState('')
  const [sending, setSending] = useState<'test' | 'campaign' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CampaignResult | null>(null)

  const loadSubscribers = useCallback(async () => {
    setLoadError(null)
    try {
      const list = await newsletterService.list()
      setSubscribers(list.length)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Lista de abonați nu a putut fi încărcată.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSubscribers()
  }, [loadSubscribers])

  useEffect(() => {
    setTestTo((current) => current || user?.email || settings.contactEmail || '')
  }, [user?.email, settings.contactEmail])

  const validationError = useMemo(() => {
    if (subject.trim().length < 3) return 'Scrie un subiect de cel puțin 3 caractere.'
    if (message.trim().length < 10) return 'Scrie mesajul ofertei (cel puțin 10 caractere).'
    return null
  }, [subject, message])

  const loadExample = () => {
    setSubject(EXAMPLE_SUBJECT)
    setMessage(`${EXAMPLE_MESSAGE} ${settings.brandName}`)
    setError(null)
    setResult(null)
  }

  const sendTest = async () => {
    if (validationError) {
      setError(validationError)
      return
    }
    if (!EMAIL_RE.test(testTo.trim())) {
      setError('Adresa de test nu este validă.')
      return
    }
    setSending('test')
    setError(null)
    setResult(null)
    try {
      const response = await newsletterService.sendTest(
        { subject: subject.trim(), message: message.trim() },
        testTo.trim(),
      )
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Emailul de test nu a putut fi trimis.')
    } finally {
      setSending(null)
    }
  }

  const sendCampaign = async () => {
    if (validationError) {
      setError(validationError)
      return
    }
    if (subscribers === 0) {
      setError('Nu există abonați la newsletter încă.')
      return
    }
    const ok = await confirm({
      title: 'Trimiți campania?',
      message: `Emailul „${subject.trim()}” va fi trimis către ${subscribers} ${
        subscribers === 1 ? 'abonat' : 'abonați'
      }. Trimiterea nu poate fi anulată.`,
      confirmLabel: `Trimite la ${subscribers}`,
      tone: 'danger',
    })
    if (!ok) return

    setSending('campaign')
    setError(null)
    setResult(null)
    try {
      const response = await newsletterService.sendCampaign({
        subject: subject.trim(),
        message: message.trim(),
      })
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Campania nu a putut fi trimisă.')
    } finally {
      setSending(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-ink/10 bg-paper-200/50 px-4 py-3">
        <p className="text-sm text-ink-muted">
          {loading
            ? 'Se încarcă lista de abonați…'
            : `${subscribers} ${subscribers === 1 ? 'abonat' : 'abonați'} la newsletter`}
        </p>
        <p className="text-xs text-ink-muted">
          Emailurile pleacă din contul SMTP configurat (SMTP_HOST / SMTP_USER).
        </p>
      </div>

      {loadError && (
        <div
          className="mb-6 border border-oxblood/30 bg-oxblood/5 px-4 py-3 text-sm text-oxblood"
          role="alert"
        >
          {loadError}{' '}
          <button
            type="button"
            onClick={() => void loadSubscribers()}
            className="underline underline-offset-2"
          >
            Reîncearcă
          </button>
        </div>
      )}

      {error && (
        <div
          className="mb-6 border border-oxblood/30 bg-oxblood/5 px-4 py-3 text-sm text-oxblood"
          role="alert"
        >
          {error}
        </div>
      )}

      {result && (
        <div className="mb-6 border border-brass/40 bg-brass/10 px-4 py-3 text-sm text-ink" role="status">
          {result.test ? (
            <p>
              Emailul de test a fost trimis către <strong>{result.to}</strong>. Verifică inboxul
              (și folderul Spam) înainte de trimiterea către toți abonații.
            </p>
          ) : (
            <p>
              Campania a fost trimisă: <strong>{result.sent}</strong> din {result.total} emailuri.
            </p>
          )}
          {!result.test && result.failed > 0 && (
            <p className="mt-1 text-oxblood">
              {result.failed} adrese nu au putut fi contactate
              {result.failures && result.failures.length > 0
                ? `: ${result.failures.join(', ')}`
                : '.'}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="border border-ink/10 bg-paper-50 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-2xl text-ink">Compune emailul de ofertă</h2>
            <button
              type="button"
              onClick={loadExample}
              className="text-xs uppercase tracking-wider text-brass-dark underline-offset-4 hover:underline"
            >
              Încarcă un exemplu
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <FormField
              label="Subiect"
              htmlFor="campaign-subject"
              required
              hint={`${subject.length}/${SUBJECT_MAX} caractere`}
            >
              <input
                id="campaign-subject"
                className="field"
                value={subject}
                maxLength={SUBJECT_MAX}
                onChange={(event) => {
                  setSubject(event.target.value)
                  setResult(null)
                }}
                placeholder="Ex: Trei cărți noi și 10% reducere pentru cititorii noștri"
              />
            </FormField>

            <FormField
              label="Mesajul ofertei"
              htmlFor="campaign-message"
              required
              hint={`${message.length}/${MESSAGE_MAX} caractere · un rând gol începe un paragraf nou`}
            >
              <textarea
                id="campaign-message"
                className="field min-h-[20rem] resize-y"
                value={message}
                maxLength={MESSAGE_MAX}
                onChange={(event) => {
                  setMessage(event.target.value)
                  setResult(null)
                }}
                placeholder={
                  'Bună,\n\nSăptămâna aceasta avem…\n\n• primul titlu — preț\n• al doilea titlu — preț\n\nSpor la citit,\nEchipa'
                }
              />
            </FormField>

            <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
              <button
                type="button"
                onClick={() => void sendCampaign()}
                disabled={sending !== null || loading || subscribers === 0}
                className="btn btn-primary px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending === 'campaign'
                  ? 'Se trimite…'
                  : `Trimite către ${subscribers || 0} ${subscribers === 1 ? 'abonat' : 'abonați'}`}
              </button>
              <button
                type="button"
                onClick={() => void sendTest()}
                disabled={sending !== null}
                className="btn btn-outline px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending === 'test' ? 'Se trimite testul…' : 'Trimite un test'}
              </button>
            </div>
            <p className="text-xs leading-relaxed text-ink-muted">
              Mesajul ajunge ca text simplu, cu diacritice, într-un plic cu identitatea librăriei.
              Trimite întâi un test către propria adresă.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border border-ink/10 bg-paper-100 p-4">
            <p className="eyebrow mb-3">Previzualizare</p>
            <div className="border border-paper-300 bg-paper-50">
              <div className="h-1 bg-oxblood" />
              <div className="p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-brass-dark">
                  {settings.brandName} · Newsletter
                </p>
                <h3 className="mt-2 font-serif text-xl leading-tight text-ink">
                  {subject.trim() || 'Subiectul emailului'}
                </h3>
                <div className="mt-4 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-ink-light">
                  {message.trim() || 'Textul ofertei apare aici, cu paragrafele lui.'}
                </div>
                <span className="mt-5 inline-block bg-oxblood px-4 py-2 text-xs text-paper-100">
                  Vezi librăria
                </span>
                <p className="mt-5 border-t border-ink/10 pt-3 text-[11px] leading-relaxed text-ink-muted">
                  Ai primit acest email pentru că te-ai abonat la newsletter-ul {settings.brandName}.
                  Te poți dezabona oricând printr-un simplu răspuns.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-ink/10 bg-paper-50 p-4">
            <h3 className="font-serif text-lg text-ink">Trimite o copie de test</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Verifică felul în care arată emailul înainte de a-l trimite tuturor abonaților.
            </p>
            <FormField label="Adresa de test" htmlFor="campaign-test-email" className="mt-3">
              <input
                id="campaign-test-email"
                type="email"
                className="field"
                value={testTo}
                onChange={(event) => setTestTo(event.target.value)}
                placeholder="adresa@email.ro"
              />
            </FormField>
            <button
              type="button"
              onClick={() => void sendTest()}
              disabled={sending !== null}
              className="btn btn-outline mt-3 w-full px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending === 'test' ? 'Se trimite…' : 'Trimite testul'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
