import { Router } from 'express'
import { getLockers, isSamedayConfigured } from '../sameday.js'

/**
 * SameDay EasyBox endpoints.
 *
 *   GET /api/easyboxes
 *
 * Returns the pickup points the checkout uses to populate the EasyBox dropdown:
 *
 *   { boxes: [{ id, city, name, address }], source: 'sameday' | 'static' }
 *
 * The list comes from the live SameDay Courier API when credentials are
 * configured (SAMEDAY_USERNAME / SAMEDAY_PASSWORD), otherwise the bundled demo
 * list is served with `source: 'static'` so checkout still works in dev.
 */
export const easyboxesRouter = Router()

easyboxesRouter.get('/', async (_req, res) => {
  try {
    const result = await getLockers()
    return res.json(result)
  } catch (err) {
    // When Sameday is configured but unreachable / rejected us, surface the
    // reason so the owner can fix the credentials instead of silently shipping
    // the static list to customers.
    return res.status(502).json({ error: err.message })
  }
})

// A small status probe used by the admin panel / diagnostics.
easyboxesRouter.get('/status', (_req, res) => {
  return res.json({ configured: isSamedayConfigured() })
})
