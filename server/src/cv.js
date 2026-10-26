import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import crypto from 'node:crypto'
import { requireAuth } from './auth.js'
import { query } from './db.js'
import { hashValue } from './redact.js'
import { UPLOAD_DIR } from './upload.js'

// CV / resume management (PK-18). Two separate concerns, two routers:
//   - cvAdminRouter: admin-only PDF upload that sets site_settings.cv_url
//   - cvDownloadRouter: public, hashed view/download logging
//
// The PDF filter lives HERE, not in upload.js: the image allowlist (PK-12) stays
// images-only on purpose. A CV is a different, admin-owned asset with its own
// filter (PDF only) and its own larger cap, so widening the image upload would be
// the wrong move. Stored files share the same UPLOAD_DIR + /uploads static route,
// which already sends X-Content-Type-Options: nosniff (PK-14).

const CV_MAX_BYTES = 8 * 1024 * 1024 // 8 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  // Always .pdf: the filter below guarantees the payload is a PDF, and a fixed
  // extension keeps a crafted originalname from steering the stored name.
  filename: (_req, _file, cb) => cb(null, `${crypto.randomUUID()}.pdf`),
})

// PDF only, by BOTH the declared mime type and the extension. The message is
// phrased so the central error handler (index.js) classifies it as a 4xx.
const upload = multer({
  storage,
  limits: { fileSize: CV_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext !== '.pdf' || file.mimetype !== 'application/pdf') {
      return cb(new Error('Only a PDF file is allowed'))
    }
    cb(null, true)
  },
})

export const cvAdminRouter = Router()

// Upload/replace the managed CV. Auth-gated and rate-limited (index.js). On
// success the new /uploads URL is written to site_settings.cv_url and returned,
// so the admin preview and the public get_cv both pick it up immediately.
cvAdminRouter.post('/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  const base = (process.env.PUBLIC_URL || '').replace(/\/$/, '')
  const url = `${base}/uploads/${req.file.filename}`
  await query(
    `INSERT INTO site_settings (id, cv_url) VALUES (1, $1)
     ON CONFLICT (id) DO UPDATE SET cv_url = $1`,
    [url],
  )
  res.status(201).json({ cv_url: url })
})

export const cvDownloadRouter = Router()

const ACTIONS = new Set(['view', 'download'])

// Public, rate-limited (index.js). Logs one hashed row per view/download. Never
// stores raw ip/ua: hashValue is HMAC-SHA256 keyed by LOG_HASH_SALT (NULL when
// unset), the same primitive the chat logging uses. Honest by construction: this
// is a client-fired signal, not a verified-download audit.
cvDownloadRouter.post('/', async (req, res) => {
  const body = req.body || {}
  const action = ACTIONS.has(body.action) ? body.action : 'download'
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || ''
  const ua = req.headers['user-agent'] || ''
  const referrerRaw = typeof body.referrer === 'string' && body.referrer
    ? body.referrer
    : (req.headers.referer || '')
  const referrer = referrerRaw ? String(referrerRaw).slice(0, 300) : null

  await query(
    `INSERT INTO cv_downloads (ip_hash, ua_hash, referrer, action)
     VALUES ($1, $2, $3, $4)`,
    [hashValue(ip), hashValue(ua), referrer, action],
  )
  res.status(201).json({ ok: true })
})
