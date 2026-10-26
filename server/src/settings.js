import { Router } from 'express'
import { query } from './db.js'
import { requireAuth } from './auth.js'

// Text fields the admin edits here. cv_url is NOT in this set: it is set only by
// the dedicated upload endpoint (POST /api/admin/cv), never typed in by hand.
const TEXT_FIELDS = ['contact_endpoint', 'telegram_chat_id']

export const settingsRouter = Router()

// Public: the contact form endpoint plus the managed CV (PK-18). cv_url lets the
// public get_cv serve the managed CV (blank -> the client's static fallback), and
// cv_lead_capture tells the client whether to show the optional post-download
// capture. The telegram chat id is NOT exposed here; cv-notify reads it from the
// DB directly.
settingsRouter.get('/', async (_req, res) => {
  const { rows } = await query('SELECT contact_endpoint, cv_url, cv_lead_capture FROM site_settings WHERE id = 1')
  res.json(rows[0] || { contact_endpoint: '', cv_url: '', cv_lead_capture: false })
})

// Admin-only: full settings for the Settings panel.
settingsRouter.get('/all', requireAuth, async (_req, res) => {
  const { rows } = await query('SELECT contact_endpoint, telegram_chat_id, cv_url, cv_lead_capture FROM site_settings WHERE id = 1')
  res.json(rows[0] || { contact_endpoint: '', telegram_chat_id: '', cv_url: '', cv_lead_capture: false })
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
