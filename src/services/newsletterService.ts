import { api, getToken } from './http'

export interface Subscriber {
  email: string
  source: string
  createdAt: string
}

export interface CampaignInput {
  subject: string
  message: string
}

export interface CampaignResult {
  ok: true
  /** Present when the request was a preview sent to a single address. */
  test?: boolean
  total: number
  sent: number
  failed: number
  /** First few addresses that could not be reached (campaign sends). */
  failures?: string[]
  to?: string
}

/** Newsletter subscriber list (admin). */
export const newsletterService = {
  async list(): Promise<Subscriber[]> {
    return api<Subscriber[]>('/newsletter')
  },

  async remove(email: string): Promise<void> {
    await api(`/newsletter/${encodeURIComponent(email)}`, { method: 'DELETE' })
  },

  /** Send the composed offer email to every newsletter subscriber (admin). */
  async sendCampaign(input: CampaignInput): Promise<CampaignResult> {
    return api<CampaignResult>('/newsletter/send', { method: 'POST', body: input })
  },

  /** Send a single preview copy to `to` before the real campaign. */
  async sendTest(input: CampaignInput, to: string): Promise<CampaignResult> {
    return api<CampaignResult>('/newsletter/send', {
      method: 'POST',
      body: { ...input, testTo: to },
    })
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
