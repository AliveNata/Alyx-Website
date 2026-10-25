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

  // Resolve the conversation this session belongs to, if one exists. A canned-only
  // session (P3-2 gap fix) can engage an availability/contact chip without ever
  // POSTing to /api/chat, so it may have no conversation row yet. That is inherently
  // a portfolio lead: the client only produces a canned cta in portfolio mode (PK-4).
  // So no conversation is tolerated here rather than rejected; stricter hardening is
  // P3-3.
  const { rows: convRows } = await query(
    'SELECT id, mode FROM conversations WHERE session_id = $1',
    [sessionId],
  )
  const conv = convRows[0] || null

  // The funnel is portfolio-only. When a conversation exists, companion/English
  // chats are off-limits, the same boundary detectLeadCta enforces when it emits
  // the cta. A no-conversation session has no such mode to reject (it is portfolio
  // by construction).
  if (conv && (conv.mode === 'curhat' || conv.mode === 'english')) {
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

  // Intent tier is server-decided. With a conversation, recompute it from the last
  // stored user message (already redacted at log time, keywords survive) rather
  // than trusting the client. Without one, recompute from the client-sent context
  // (the canned path forwards the question). Either way the channel stays the one
  // the visitor clicked; only the warmth is reassessed, falling back to 'warm'.
  let lastUserText = ''
  if (conv) {
    const { rows: msgRows } = await query(
      `SELECT content FROM messages
       WHERE conversation_id = $1 AND role = 'user' AND content IS NOT NULL
       ORDER BY id DESC LIMIT 1`,
      [conv.id],
    )
    lastUserText = msgRows[0]?.content || ''
  }
  const tierBasis = lastUserText || (typeof body.context === 'string' ? body.context : '')
  const recomputed = detectLeadCta(tierBasis, conv?.mode || 'portfolio', [])
  const intentTier = recomputed?.tier || 'warm'

  // Context summary: a short, redacted note, never the raw transcript. Built from
  // the last stored user message plus the visitor's optional one-line note from
  // the email form, both run through redact() defensively. A canned session has no
  // stored message, so the client-sent context is the only basis.
  const parts = []
  if (lastUserText) parts.push(lastUserText)
  if (typeof body.context === 'string' && body.context.trim()) parts.push(body.context.trim())
  const summary = parts.length ? redact(parts.join(' | ')).slice(0, CONTEXT_MAX) : null

  await query(
    `INSERT INTO leads (conversation_id, session_id, channel, intent_tier, context_summary, contact_value, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'new')`,
    [conv?.id || null, sessionId, channel, intentTier, summary, contactValue],
  )

  res.status(201).json({ ok: true })
})
