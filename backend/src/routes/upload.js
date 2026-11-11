import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import multer from 'multer'
import { Router } from 'express'
import { requireAdmin } from '../auth.js'

/**
 * Admin image upload (book covers + gallery photos).
 *
 * Files are stored under UPLOAD_DIR with random names — never user-supplied
 * filenames — and served through the static `/uploads` mount. A content sniff
 * (magic bytes) runs after the upload, so a renamed executable can't pass as an
 * image even if the browser sends a forged Content-Type.
 */
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.png'
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 }, // 12 MB cap
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true)
    cb(new Error('Format neacceptat. Încarcă o imagine JPEG, PNG, WebP sau GIF.'))
  },
})

/** Detect the real image format from the file header. */
function sniffImage(filePath) {
  let fd
  try {
    fd = fs.openSync(filePath, 'r')
    const buffer = Buffer.alloc(12)
    const bytes = fs.readSync(fd, buffer, 0, 12, 0)
    if (bytes < 12) return null
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return 'image/png'
    }
    if (buffer.subarray(0, 4).toString('ascii') === 'GIF8') return 'image/gif'
    if (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'image/webp'
    }
    return null
  } catch {
    return null
  } finally {
    if (fd !== undefined) fs.closeSync(fd)
  }
}

export const uploadRouter = Router()

uploadRouter.post('/', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(422).json({ error: 'Nicio imagine trimisă.' })
  }
  const realType = sniffImage(req.file.path)
  if (!realType) {
    fs.promises.unlink(req.file.path).catch(() => {})
    return res.status(400).json({ error: 'Fișierul nu este o imagine validă (JPEG/PNG/WebP/GIF).' })
  }
  const prefix = (process.env.UPLOADS_URL_PREFIX || '/uploads').replace(/\/+$/, '')
  return res.status(201).json({ url: `${prefix}/${req.file.filename}` })
})

uploadRouter.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Imaginea este prea mare (maxim 12 MB).' })
    }
    return res.status(400).json({ error: `Upload eșuat: ${err.message}` })
  }
  return res.status(400).json({ error: err.message || 'Upload eșuat.' })
})
