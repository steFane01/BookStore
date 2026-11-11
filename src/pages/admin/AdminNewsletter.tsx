import { useCallback, useEffect, useState } from 'react'
import { newsletterService, type Subscriber } from '../../services/newsletterService'

/** Newsletter subscriber list with CSV export and removal. */
export function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setSubscribers(await newsletterService.list())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lista nu a putut fi încărcată.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const remove = async (email: string) => {
    if (!window.confirm(`Ștergi abonatul ${email}?`)) return
    setBusy(email)
    setError(null)
    try {
      await newsletterService.remove(email)
      setSubscribers((current) => current.filter((subscriber) => subscriber.email !== email))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Abonatul nu a putut fi șters.')
    } finally {
      setBusy(null)
    }
  }

  const download = async () => {
    setError(null)
    try {
      await newsletterService.downloadCsv()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Exportul nu a putut fi descărcat.')
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {subscribers.length} abonați la newsletter
        </p>
        <button
          type="button"
          onClick={() => void download()}
          disabled={subscribers.length === 0}
          className="btn btn-outline px-5 py-2.5 text-sm disabled:opacity-50"
        >
          Descarcă CSV
        </button>
      </div>

      {error && (
        <div className="mb-6 border border-oxblood/30 bg-oxblood/5 px-4 py-3 text-sm text-oxblood" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink-muted">Se încarcă…</p>
      ) : subscribers.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Nu există abonați încă. Formularul din pagina principală adaugă automat adresele aici.
        </p>
      ) : (
        <div className="overflow-x-auto border border-ink/10">
          <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-paper-200/50 text-xs uppercase tracking-wider text-ink-muted">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Sursă</th>
                <th className="px-4 py-3">Abonat la</th>
                <th className="px-4 py-3 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {subscribers.map((subscriber) => (
                <tr key={subscriber.email} className="text-ink">
                  <td className="px-4 py-3">{subscriber.email}</td>
                  <td className="px-4 py-3 text-ink-muted">{subscriber.source}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {new Date(subscriber.createdAt).toLocaleDateString('ro-RO')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void remove(subscriber.email)}
                      disabled={busy === subscriber.email}
                      className="text-oxblood underline-offset-2 hover:underline disabled:opacity-40"
                    >
                      Șterge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
