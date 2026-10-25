import { Router } from 'express'
import { query } from './db.js'
import { detectLeadCta } from './intent.js'
import { redact } from './redact.js'

// Lead capture (P3-2). A lead is written only when a visitor actively engages a
// CTA chip in the chat: clicks the booking/mentoring link, or submits their
// email. This endpoint is public but server-authoritative: it resolves the
// conversation itself, recomputes the intent tier from the stored message (never
// trusts a client-sent tier), redacts the context note, and keeps a raw contact
// value only for the email channel where the visitor volunteered it. The heavier
// anti-abuse (honeypot, hot-only notify) is P3-3; this ships a light guard.

const CHANNELS = new Set(['booking', 'sociabuzz', 'email'])
const CONTEXT_MAX = 300

// Pragmatic email shape check, same spirit as redact.js: one local part, one
// domain with a dot. Not an RFC validator, just enough to reject junk before we
// store a value whose whole purpose is to be reachable.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isEmail = (v) => typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v)

export const leadRouter = Router()

leadRouter.post('/', async (req, res) => {
  const body = req.body || {}
  const channel = typeof body.channel === 'string' ? body.channel : ''
  const sessionId = typeof body.session_id === 'string' ? body.session_id.trim() : ''

  if (!CHANNELS.has(channel)) return res.status(400).json({ error: 'invalid channel' })
  if (!sessionId) return res.status(400).json({ error: 'session_id is required' })

  // Resolve the conversation this session belongs to. No conversation means no
  // grounded portfolio context exists, so there is nothing to turn into a lead.
  const { rows: convRows } = await query(
    'SELECT id, mode FROM conversations WHERE session_id = $1',
    [sessionId],
  )
  const conv = convRows[0]
  if (!conv) return res.status(400).json({ error: 'no matching conversation' })

  // The funnel is portfolio-only. Companion/English chats are off-limits, the
  // same boundary detectLeadCta enforces when it emits the cta in the first place.
  if (conv.mode === 'curhat' || conv.mode === 'english') {
    return res.status(403).json({ error: 'lead not allowed for this conversation' })
  }

  // Email is the only channel that carries a contact. Store it as-is (consent by
  // action) but reject a malformed address before it lands in the table.
  let contactValue = null
  if (channel === 'email') {
    const candidate = typeof body.contact_value === 'string' ? body.contact_value.trim() : ''
    if (!isEmail(candidate)) return res.status(400).json({ error: 'a valid email is required' })
    contactValue = candidate
  }

  // Intent tier is server-decided. Recompute it from the last stored user message
  // (already redacted at log time, keywords survive) rather than trusting the
  // client. The channel stays the one the visitor actually clicked; only the
  // warmth is reassessed here. A message with no keyword left (e.g. the cta came
  // from an earlier turn) falls back to 'warm'.
  const { rows: msgRows } = await query(
    `SELECT content FROM messages
     WHERE conversation_id = $1 AND role = 'user' AND content IS NOT NULL
     ORDER BY id DESC LIMIT 1`,
    [conv.id],
  )
  const lastUserText = msgRows[0]?.content || ''
  const recomputed = detectLeadCta(lastUserText, conv.mode || 'portfolio', [])
  const intentTier = recomputed?.tier || 'warm'

  // Context summary: a short, redacted note, never the raw transcript. Built from
  // the last stored user message plus the visitor's optional one-line note from
  // the email form, both run through redact() defensively.
  const parts = []
  if (lastUserText) parts.push(lastUserText)
  if (typeof body.context === 'string' && body.context.trim()) parts.push(body.context.trim())
  const summary = parts.length ? redact(parts.join(' | ')).slice(0, CONTEXT_MAX) : null

  await query(
    `INSERT INTO leads (conversation_id, session_id, channel, intent_tier, context_summary, contact_value, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'new')`,
    [conv.id, sessionId, channel, intentTier, summary, contactValue],
  )

  res.status(201).json({ ok: true })
})
