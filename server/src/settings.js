import { Router } from 'express'
import { query } from './db.js'
import { requireAuth } from './auth.js'

const FIELDS = ['contact_endpoint', 'telegram_chat_id']

export const settingsRouter = Router()

// Public: the contact form reads contact_endpoint; cv-notify reads the chat id.
// Neither is a secret (a URL and a chat id), so a public GET is fine.
settingsRouter.get('/', async (_req, res) => {
  const { rows } = await query('SELECT contact_endpoint, telegram_chat_id FROM site_settings WHERE id = 1')
  res.json(rows[0] || { contact_endpoint: '', telegram_chat_id: '' })
})

settingsRouter.put('/', requireAuth, async (req, res) => {
  const body = req.body || {}
  const values = FIELDS.map((f) => (body[f] ?? '').trim())
  const assignments = FIELDS.map((f, i) => `${f} = $${i + 1}`).join(', ')
  const cols = FIELDS.join(', ')
  const placeholders = FIELDS.map((_, i) => `$${i + 1}`).join(', ')
  const { rows } = await query(
    `INSERT INTO site_settings (id, ${cols}) VALUES (1, ${placeholders})
     ON CONFLICT (id) DO UPDATE SET ${assignments} RETURNING contact_endpoint, telegram_chat_id`,
    values,
  )
  res.json(rows[0])
})
