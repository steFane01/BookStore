import { Router } from 'express'
import { pingDatabase } from '../db.js'

export const healthRouter = Router()

/**
 * GET /api/health
 * Liveness + DB connectivity check. Used by Docker healthchecks and smoke tests.
 * Never exposes connection details or driver errors to the caller.
 */
healthRouter.get('/', async (_req, res) => {
  try {
    const db = await pingDatabase()
    res.json({ status: 'ok', service: 'libraria-backend', database: db })
  } catch (err) {
    console.error('[libraria] health check failed:', err.message)
    res.status(503).json({ status: 'degraded' })
  }
})
