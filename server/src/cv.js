import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { requireAuth } from './auth.js'
import { query } from './db.js'
import { hashValue } from './redact.js'
import { UPLOAD_DIR, CV_PRIVATE_DIR } from './upload.js'
import { renderCvPreview } from './cvRender.js'

// CV / resume management (PK-18 + PK-25). Three concerns, three routers:
//   - cvAdminRouter:    admin-only PDF upload. Renders a page-1 PNG teaser, moves
//                       the full PDF to the private store, records both.
//   - cvDownloadRouter: public. GET streams the full PDF as an attachment (the
//                       only public path to it) and logs a hashed download row;
//                       POST logs a hashed view/download signal (the view beacon).
//   - cvAdminFileRouter: admin-only. Streams the full PDF inline for the preview.
//
// The PDF filter lives HERE, not in upload.js: the image allowlist (PK-12) stays
// images-only on purpose. A CV is a different, admin-owned asset with its own
// filter (PDF only) and its own larger cap.

const CV_MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const CV_DOWNLOAD_NAME = 'Curriculum Vitae - Alief Akbar.pdf'

const storage = multer.diskStorage({
  // The upload lands in UPLOAD_DIR first; on a successful render it is MOVED to
  // the private store. On a render failure it stays here and keeps the old
  // public-URL behavior (fallback), so a failed render never bricks the upload.
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

// Best-effort unlink: cleanup of a replaced CV must never fail the request.
const tryUnlink = (p) => { try { if (p) fs.unlinkSync(p) } catch { /* already gone */ } }

// Delete the previously-managed CV assets so a replace does not leave the old
// files behind. Covers both shapes: a prior private PDF (cv_file) + its public
// PNG (cv_preview_url), and a prior public PDF (an old PK-18 cv_url in UPLOAD_DIR
// or a failed-render fallback), whose guessable URL must stop resolving.
function cleanupOldCv(prev) {
  if (!prev) return
  if (prev.cv_file) tryUnlink(path.join(CV_PRIVATE_DIR, path.basename(prev.cv_file)))
  for (const url of [prev.cv_preview_url, prev.cv_url]) {
    const name = urlToUploadName(url)
    if (name) tryUnlink(path.join(UPLOAD_DIR, name))
  }
}

// Pull the stored filename out of a /uploads/<name> URL so we can delete the file
// it points at. Returns null for anything that is not an /uploads asset (e.g. a
// static or external URL), and basename-guards against any path traversal.
function urlToUploadName(url) {
  if (!url) return null
  const m = String(url).match(/\/uploads\/([^/?#]+)$/)
  return m ? path.basename(m[1]) : null
}

export const cvAdminRouter = Router()

// Upload/replace the managed CV. Auth-gated and rate-limited (index.js).
//   Success: render page 1 -> PNG in UPLOAD_DIR (public teaser), move the PDF to
//   the private store, set cv_file + cv_preview_url + cv_pages, and clear cv_url
//   so no public full-PDF URL lingers. The gated viewer takes over.
//   Render failure: leave the PDF in UPLOAD_DIR and set cv_url to its /uploads
//   URL (the PK-18 behavior), with cv_preview_url blank so the client falls back
//   to the ungated path. The upload is never bricked by a bad render.
cvAdminRouter.post('/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })

  const { rows: prevRows } = await query(
    'SELECT cv_file, cv_preview_url, cv_url FROM site_settings WHERE id = 1',
  )
  const prev = prevRows[0] || null

  const base = (process.env.PUBLIC_URL || '').replace(/\/$/, '')
  const uuid = path.basename(req.file.filename, '.pdf')
  const uploadedPdf = path.join(UPLOAD_DIR, req.file.filename)

  try {
    const { pngBuffer, pages } = await renderCvPreview(uploadedPdf)

    // Page-1 PNG is the only public CV asset; write it into the served dir.
    const pngName = `${uuid}.png`
    fs.writeFileSync(path.join(UPLOAD_DIR, pngName), pngBuffer)
    // Move the full PDF out of the public dir into the private store.
    const privateName = `${uuid}.pdf`
    fs.renameSync(uploadedPdf, path.join(CV_PRIVATE_DIR, privateName))

    const previewUrl = `${base}/uploads/${pngName}`
    await query(
      `INSERT INTO site_settings (id, cv_file, cv_preview_url, cv_pages, cv_url)
       VALUES (1, $1, $2, $3, '')
       ON CONFLICT (id) DO UPDATE
         SET cv_file = $1, cv_preview_url = $2, cv_pages = $3, cv_url = ''`,
      [privateName, previewUrl, pages],
    )
    cleanupOldCv(prev)
    return res.status(201).json({ cv_preview_url: previewUrl, cv_pages: pages, cv_url: '' })
  } catch (err) {
    // Fallback (decision E): keep the PDF public and behave like PK-18 so the
    // upload still works; the client renders the ungated view. Log the cause.
    console.error('[cv] page-1 render failed, falling back to ungated CV:', err.message)
    const url = `${base}/uploads/${req.file.filename}`
    await query(
      `INSERT INTO site_settings (id, cv_url, cv_file, cv_preview_url, cv_pages)
       VALUES (1, $1, '', '', 0)
       ON CONFLICT (id) DO UPDATE
         SET cv_url = $1, cv_file = '', cv_preview_url = '', cv_pages = 0`,
      [url],
    )
    // Drop ALL previous assets (private PDF, preview PNG, and any old public PDF);
    // the new PDF has a fresh uuid, so this never touches the file just uploaded.
    // Same cleanup as the success path, so a prior public CV cannot be orphaned.
    cleanupOldCv(prev)
    return res.status(201).json({ cv_url: url, cv_preview_url: '', cv_pages: 0 })
  }
})

// --- Admin preview: stream the full PDF inline, auth-gated (decision C) ---
// The full PDF is no longer public, so the admin preview cannot iframe a public
// URL. The admin panel fetches this with its Bearer token and shows the blob, so
// the preview stays full and multi-page while the file stays private.
export const cvAdminFileRouter = Router()
cvAdminFileRouter.get('/', requireAuth, async (_req, res) => {
  const { rows } = await query('SELECT cv_file FROM site_settings WHERE id = 1')
  const file = rows[0]?.cv_file
  if (!file) return res.status(404).json({ error: 'No managed CV' })
  const full = path.join(CV_PRIVATE_DIR, path.basename(file))
  if (!fs.existsSync(full)) return res.status(404).json({ error: 'CV file missing' })
  res.set('Content-Type', 'application/pdf')
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('Content-Disposition', `inline; filename="${CV_DOWNLOAD_NAME}"`)
  fs.createReadStream(full).pipe(res)
})

export const cvDownloadRouter = Router()

const ACTIONS = new Set(['view', 'download'])

// One hashed row per view/download. No raw ip/ua: hashValue is HMAC-SHA256 keyed
// by LOG_HASH_SALT (NULL when unset), the same primitive the chat logging uses.
async function logCvAction(req, action) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || ''
  const ua = req.headers['user-agent'] || ''
  const referrerRaw = req.headers.referer || ''
  const referrer = referrerRaw ? String(referrerRaw).slice(0, 300) : null
  await query(
    `INSERT INTO cv_downloads (ip_hash, ua_hash, referrer, action)
     VALUES ($1, $2, $3, $4)`,
    [hashValue(ip), hashValue(ua), referrer, action],
  )
}

// Public, rate-limited (index.js). The ONLY public path to the full PDF: streams
// the private file as an attachment and logs a hashed 'download' row. A download
// still yields the full PDF (this is friction + tracking, not DRM), but the raw
// UUID URL no longer resolves, so page 1 can be shared without leaking the rest.
cvDownloadRouter.get('/', async (req, res) => {
  const { rows } = await query('SELECT cv_file FROM site_settings WHERE id = 1')
  const file = rows[0]?.cv_file
  if (!file) return res.status(404).json({ error: 'No managed CV' })
  const full = path.join(CV_PRIVATE_DIR, path.basename(file))
  if (!fs.existsSync(full)) return res.status(404).json({ error: 'CV file missing' })
  await logCvAction(req, 'download')
  res.set('Content-Type', 'application/pdf')
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('Content-Disposition', `attachment; filename="${CV_DOWNLOAD_NAME}"`)
  fs.createReadStream(full).pipe(res)
})

// Public, rate-limited. The client's view/download beacon (PK-18): logs a hashed
// signal row. Kept for the 'view' event the gated viewer fires on open; the
// download count comes from the GET stream above, so the client does not double-log.
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
