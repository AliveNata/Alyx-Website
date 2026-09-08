import { Router } from 'express'
import { query } from './db.js'
import { requireAuth } from './auth.js'

const FIELDS = ['name', 'nickname', 'title', 'tagline', 'email', 'github', 'linkedin', 'bio']

export const personalRouter = Router()

personalRouter.get('/', async (_req, res) => {
  const { rows } = await query('SELECT * FROM personal_info WHERE id = 1')
  res.json(rows[0] || {})
})

personalRouter.put('/', requireAuth, async (req, res) => {
  const body = req.body || {}
  const values = FIELDS.map((f) => body[f] ?? '')
  const assignments = FIELDS.map((f, i) => `${f} = $${i + 1}`).join(', ')
  const cols = FIELDS.join(', ')
  const placeholders = FIELDS.map((_, i) => `$${i + 1}`).join(', ')
  // Upsert the singleton row.
  const { rows } = await query(
    `INSERT INTO personal_info (id, ${cols}) VALUES (1, ${placeholders})
     ON CONFLICT (id) DO UPDATE SET ${assignments} RETURNING *`,
    values,
  )
  res.json(rows[0])
})
