import { Router } from 'express'
import { query } from './db.js'
import { requireAuth } from './auth.js'

// Build a REST router for one resource from its RESOURCES config.
// GET is public (the site reads it); writes require a valid admin token.
export function crudRouter({ table, fields, jsonFields }) {
  const router = Router()
  const jsonSet = new Set(jsonFields)

  // Turn an incoming body into an ordered [values] array matching `fields`,
  // stringifying JSON columns so Postgres stores valid JSONB.
  const toValues = (body) => fields.map((f) => {
    const v = body[f]
    if (jsonSet.has(f)) return v == null ? null : JSON.stringify(v)
    if (f === 'sort_order' || f === 'level') return v == null || v === '' ? 0 : Number(v)
    return v ?? ''
  })

  router.get('/', async (_req, res) => {
    const { rows } = await query(`SELECT * FROM ${table} ORDER BY sort_order ASC, id ASC`)
    res.json(rows)
  })

  router.post('/', requireAuth, async (req, res) => {
    const cols = fields.join(', ')
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ')
    const { rows } = await query(
      `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`,
      toValues(req.body || {}),
    )
    res.status(201).json(rows[0])
  })

  router.put('/:id', requireAuth, async (req, res) => {
    const assignments = fields.map((f, i) => `${f} = $${i + 1}`).join(', ')
    const values = toValues(req.body || {})
    values.push(req.params.id)
    const { rows } = await query(
      `UPDATE ${table} SET ${assignments} WHERE id = $${fields.length + 1} RETURNING *`,
      values,
    )
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  })

  router.delete('/:id', requireAuth, async (req, res) => {
    const { rowCount } = await query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id])
    if (!rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  })

  // Persist a new ordering: body = { ids: [3, 1, 2] } → sort_order 0,1,2.
  router.put('/reorder/all', requireAuth, async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : []
    await Promise.all(ids.map((id, i) => query(`UPDATE ${table} SET sort_order = $1 WHERE id = $2`, [i, id])))
    res.json({ ok: true })
  })

  return router
}
