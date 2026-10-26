import { Router } from 'express'
import { query } from './db.js'
import { requireAuth } from './auth.js'

// Text fields the admin edits here. cv_url is NOT in this set: it is set only by
// the dedicated upload endpoint (POST /api/admin/cv), never typed in by hand.
const TEXT_FIELDS = ['contact_endpoint', 'telegram_chat_id']

export const settingsRouter = Router()

// Public: the contact form endpoint plus the managed CV (PK-18 + PK-25).
// cv_preview_url (page-1 PNG) + cv_pages drive the gated viewer; when they are
// set the client never fetches the full PDF directly (it streams via the tracked
// GET /api/cv-download). cv_url is still exposed for the un-migrated fallback
// (old upload / static), but it is blank once a gated CV is in place, so no
// public full-PDF URL is advertised. cv_file (the private PDF) is NEVER exposed.
// cv_lead_capture tells the client whether to show the optional post-download
// capture. The telegram chat id is NOT exposed here; cv-notify reads it directly.
settingsRouter.get('/', async (_req, res) => {
  const { rows } = await query('SELECT contact_endpoint, cv_url, cv_preview_url, cv_pages, cv_lead_capture FROM site_settings WHERE id = 1')
  res.json(rows[0] || { contact_endpoint: '', cv_url: '', cv_preview_url: '', cv_pages: 0, cv_lead_capture: false })
})

// Admin-only: full settings for the Settings panel. cv_preview_url signals the
// admin UI that a gated CV exists, so it previews via the authed file stream
// instead of a public URL; cv_file itself is still not sent to the client.
settingsRouter.get('/all', requireAuth, async (_req, res) => {
  const { rows } = await query('SELECT contact_endpoint, telegram_chat_id, cv_url, cv_preview_url, cv_pages, cv_lead_capture FROM site_settings WHERE id = 1')
  res.json(rows[0] || { contact_endpoint: '', telegram_chat_id: '', cv_url: '', cv_preview_url: '', cv_pages: 0, cv_lead_capture: false })
})

settingsRouter.put('/', requireAuth, async (req, res) => {
  const body = req.body || {}
  // Text fields first, then the cv_lead_capture boolean as the final value. cv_url
  // is intentionally never written here (the upload endpoint owns it).
  const values = TEXT_FIELDS.map((f) => (body[f] ?? '').trim())
  values.push(body.cv_lead_capture === true || body.cv_lead_capture === 'true')
  const cols = [...TEXT_FIELDS, 'cv_lead_capture']
  const assignments = cols.map((f, i) => `${f} = $${i + 1}`).join(', ')
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
  const { rows } = await query(
    `INSERT INTO site_settings (id, ${cols.join(', ')}) VALUES (1, ${placeholders})
     ON CONFLICT (id) DO UPDATE SET ${assignments} RETURNING contact_endpoint, telegram_chat_id, cv_url, cv_lead_capture`,
    values,
  )
  res.json(rows[0])
})
