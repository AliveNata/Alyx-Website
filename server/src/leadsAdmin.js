import { Router } from 'express'
import { query } from './db.js'
import { requireAuth } from './auth.js'

// Admin-only lead management (P3-3). Lists captured leads, serves a lead's
// redacted transcript for context, and moves a lead through its status. All
// routes require a valid admin token; every query is parameterized.

const STATUSES = new Set(['new', 'contacted', 'closed'])
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const leadsAdminRouter = Router()

// GET /api/admin/leads - newest first. Optional ?status filter (allowlist) and
// ?limit (1..500, default 100). Returns the list plus per-status counts for the
// header, computed over all leads so the counts are stable under a filter.
leadsAdminRouter.get('/', requireAuth, async (req, res) => {
  const status = typeof req.query.status === 'string' && STATUSES.has(req.query.status) ? req.query.status : null
  const rawLimit = Number.parseInt(req.query.limit, 10)
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 500) : 100

  const { rows } = await query(
    `SELECT id, conversation_id, channel, intent_tier, status,
            contact_value, context_summary, created_at, updated_at
       FROM leads
      WHERE ($1::text IS NULL OR status = $1)
      ORDER BY created_at DESC
      LIMIT $2`,
    [status, limit],
  )

  const { rows: countRows } = await query(
    `SELECT status, count(*)::int AS n FROM leads GROUP BY status`,
  )
  const counts = { new: 0, contacted: 0, closed: 0 }
  for (const r of countRows) if (r.status in counts) counts[r.status] = r.n

  res.json({ rows, counts })
})

// GET /api/admin/leads/:id/transcript - the conversation's messages, already
// redacted at log time. A lead whose conversation was purged (or never had one)
// has no transcript, so the context summary is all that remains.
leadsAdminRouter.get('/:id/transcript', requireAuth, async (req, res) => {
  const { id } = req.params
  if (!UUID_RE.test(id)) return res.status(400).json({ error: 'invalid lead id' })

  const { rows: leadRows } = await query(
    'SELECT conversation_id, context_summary FROM leads WHERE id = $1',
    [id],
  )
  const lead = leadRows[0]
  if (!lead) return res.status(404).json({ error: 'lead not found' })

  if (!lead.conversation_id) {
    return res.json({ conversation_id: null, context_summary: lead.context_summary, messages: [] })
  }

  const { rows: messages } = await query(
    `SELECT role, content, created_at FROM messages
      WHERE conversation_id = $1
      ORDER BY id ASC
      LIMIT 200`,
    [lead.conversation_id],
  )
  res.json({ conversation_id: lead.conversation_id, context_summary: lead.context_summary, messages })
})

// PATCH /api/admin/leads/:id - move a lead's status (allowlist) and stamp
// updated_at. Returns the updated row; 404 if the id is unknown.
leadsAdminRouter.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  if (!UUID_RE.test(id)) return res.status(400).json({ error: 'invalid lead id' })

  const status = typeof req.body?.status === 'string' ? req.body.status : ''
  if (!STATUSES.has(status)) return res.status(400).json({ error: 'invalid status' })

  const { rows } = await query(
    `UPDATE leads SET status = $1, updated_at = now()
      WHERE id = $2
      RETURNING id, status, updated_at`,
    [status, id],
  )
  if (!rows[0]) return res.status(404).json({ error: 'lead not found' })
  res.json(rows[0])
})
