import { Router } from 'express'
import { requireAdmin } from '../auth.js'
import { getSettings, saveSettings } from '../settings.js'
import { serverError } from '../lib/errors.js'

export const settingsRouter = Router()

/** GET /api/settings — public storefront settings (brand, contact, legal). */
settingsRouter.get('/', async (_req, res) => {
  try {
    return res.json(await getSettings())
  } catch (err) {
    return serverError(res, err, 'get-settings')
  }
})

/** PUT /api/settings — replace the settings object, admin only. */
settingsRouter.put('/', requireAdmin, async (req, res) => {
  try {
    return res.json(await saveSettings(req.body))
  } catch (err) {
    return serverError(res, err, 'save-settings')
  }
})
