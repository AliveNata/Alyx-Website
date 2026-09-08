import { Router } from 'express'
import { query } from './db.js'
import { requireAuth } from './auth.js'

const FIELDS = ['model', 'reasoning_effort', 'temperature', 'max_tokens', 'system_prompt', 'greeting', 'enable_companion', 'enable_voice', 'enable_site_actions']

export const chatbotRouter = Router()

// Public: the site reads chatbot config at load (no secrets here).
chatbotRouter.get('/', async (_req, res) => {
  const { rows } = await query('SELECT * FROM chatbot_settings WHERE id = 1')
  res.json(rows[0] || {})
})

chatbotRouter.put('/', requireAuth, async (req, res) => {
  const body = req.body || {}
  const values = FIELDS.map((f) => {
    if (f === 'temperature') return Number(body[f] ?? 0.7)
    if (f === 'max_tokens') return Number(body[f] ?? 700)
    if (f.startsWith('enable_')) return body[f] !== false
    return body[f] ?? ''
  })
  const assignments = FIELDS.map((f, i) => `${f} = $${i + 1}`).join(', ')
  const cols = FIELDS.join(', ')
  const placeholders = FIELDS.map((_, i) => `$${i + 1}`).join(', ')
  const { rows } = await query(
    `INSERT INTO chatbot_settings (id, ${cols}) VALUES (1, ${placeholders})
     ON CONFLICT (id) DO UPDATE SET ${assignments} RETURNING *`,
    values,
  )
  res.json(rows[0])
})
