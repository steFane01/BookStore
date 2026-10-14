import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import multer from 'multer'
import { Router } from 'express'
import { requireAdmin } from '../auth.js'

/**
 * Librăria image upload endpooint.
 *
 * The admin catalog lets the owner add book covers and interior (gallery)
 * photos by browsing a local file (JPEG/PNG). Those files are uploaded here,
 * stored under the backend's `uploads/` directory, and exposed through the
 * static `/uploads` mount so the returned URL can be stored on the `books`
 * row (`cover_src`, `gallery`).
 *
 *   POST /api/upload   (admin only)  -> { url: "/uploads/<file>.png" }
 *
 * Only images (image/jpeg, image/png, image/webp, image/gif) are accepted and
 * every filename is regenerated to a random public id so the filesystem and the
 * database never contain unsafe user-supplied filenames.
 */

// Ensure the upload directory exists (matters when the container starts fresh).
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.png'
    // Random 16-hex id — never trust the original filename.
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 }, // 12 MB cap
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true)
    cb(new Error('Format neacceptat. Încarcă o imagine JPEG sau PNG.'))
  },
})

export const uploadRouter = Router()

uploadRouter.post('/', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(422).json({ error: 'Nicio imagine trimisă.' })
  }
  // Public URL the frontend stores on the book. Uses UPLOADS_URL_PREFIX so a
  // custom CDN/domain can be configured; otherwise a root-relative path that
  // nginx (or the dev proxy) routes to the backend.
  const prefix = (process.env.UPLOADS_URL_PREFIX || '/uploads').replace(/\/+$/, '')
  return res.status(201).json({ url: `${prefix}/${req.file.filename}` })
})

// A fileFilter error surfaces as a MulterError wrapped by the error handler.
uploadRouter.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Imaginea este prea mare (maxim 12 MB).' })
    }
    return res.status(400).json({ error: `Upload eșuat: ${err.message}` })
  }
  return res.status(400).json({ error: err.message || 'Upload eșuat.' })
})
