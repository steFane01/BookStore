import { Router } from 'express'
import { getLockers, isSamedayConfigured } from '../sameday.js'

/**
 * SameDay EasyBox pickup points.
 *
 *   GET /api/easyboxes        -> { boxes: [...], source: 'sameday' | 'static' }
 *   GET /api/easyboxes/status -> { configured: boolean }
 */
export const easyboxesRouter = Router()

easyboxesRouter.get('/', async (_req, res) => {
  try {
    const result = await getLockers()
    return res.json(result)
  } catch (err) {
    console.error('[libraria] easyboxes unavailable:', err.message)
    return res.status(502).json({
      error: 'Lista EasyBox nu este disponibilă momentan. Încearcă din nou în câteva minute.',
    })
  }
})

easyboxesRouter.get('/status', (_req, res) => {
  return res.json({ configured: isSamedayConfigured() })
})
