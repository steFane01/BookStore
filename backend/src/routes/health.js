import { Router } from 'express'
import { pingDatabase } from '../db.js'

export const healthRouter = Router()

/**
 * GET /api/health
 * Liveness + DB connectivity check. Used by Docker healthchecks and smoke tests.
 */
healthRouter.get('/', async (_req, res) => {
  try {
    const db = await pingDatabase()
    res.json({ status: 'ok', service: 'libraria-backend', database: db })
  } catch (err) {
    res.status(503).json({ status: 'degraded', error: err.message })
  }
})
