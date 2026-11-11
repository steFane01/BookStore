import { api, getToken } from './http'

export interface Subscriber {
  email: string
  source: string
  createdAt: string
}

/** Newsletter subscriber list (admin). */
export const newsletterService = {
  async list(): Promise<Subscriber[]> {
    return api<Subscriber[]>('/newsletter')
  },

  async remove(email: string): Promise<void> {
    await api(`/newsletter/${encodeURIComponent(email)}`, { method: 'DELETE' })
  },

  /** Download the CSV export through the API (keeps the admin token). */
  async downloadCsv(): Promise<void> {
    const token = getToken()
    const res = await fetch('/api/newsletter/export', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error('Exportul nu a putut fi descărcat.')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'abonati-newsletter.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}
