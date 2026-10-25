import { Router } from 'express'
import { query } from './db.js'
import { detectLeadCta } from './intent.js'
import { redact } from './redact.js'
import { sendMail } from './mailer.js'

// Lead capture (P3-2 + P3-3). A lead is written only when a visitor actively
// engages a CTA chip in the chat: clicks the booking/mentoring link, or submits
// their email. This endpoint is public but server-authoritative: it resolves the
// conversation itself, recomputes the intent tier from the stored message (never
// trusts a client-sent tier), redacts the context note, and keeps a raw contact
// value only for the email channel where the visitor volunteered it.
//
// P3-3 adds the anti-abuse layer that sits on top of the per-IP leadLimiter:
//   - honeypot: a hidden form field a bot fills and a human never sees
//   - earned-cta: the session must actually show lead intent (no "hello" spam)
//   - row dedup: one lead per (session, channel) inside DEDUP_HOURS
//   - hot-only notify: one email per hot lead, deduped per session

const CHANNELS = new Set(['booking', 'sociabuzz', 'email'])
const CONTEXT_MAX = 300

// Pragmatic email shape check, same spirit as redact.js: one local part, one
// domain with a dot. Not an RFC validator, just enough to reject junk before we
// store a value whose whole purpose is to be reachable.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isEmail = (v) => typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v)

// Optional env knobs; fall back to the spec defaults when unset or invalid.
const envInt = (v, d) => { const n = Number.parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : d }
const DEDUP_HOURS = envInt(process.env.DEDUP_HOURS, 24)
const NOTIFY_DEDUP_MIN = envInt(process.env.NOTIFY_DEDUP_MIN, 10)

const appUrl = () => (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

// Hot-only notification, best-effort. Fired after the row is committed and never
// awaited by the request, so it can neither block nor fail the lead write. The
// per-session dedup counts the row we just wrote: exactly one hot lead in the
// window means this is the first, so notify; more than one means an earlier hot
// lead already sent the email for this burst.
async function notifyHotLead({ channel, intentTier, summary, contactValue, sessionId }) {
  const { rows } = await query(
    `SELECT count(*)::int AS n FROM leads
      WHERE session_id = $1 AND intent_tier = 'hot'
        AND created_at > now() - make_interval(mins => $2::int)`,
    [sessionId, NOTIFY_DEDUP_MIN],
  )
  if ((rows[0]?.n || 0) > 1) return

  const { rows: cfg } = await query('SELECT contact_email FROM chatbot_settings WHERE id = 1')
  const to = (cfg[0]?.contact_email || '').trim()
  if (!to) return // nowhere to send; mailer would have no recipient

  const link = `${appUrl()}/admin/leads`
  const fields = [
    `Channel: ${channel}`,
    `Intent: ${intentTier}`,
    contactValue ? `Contact: ${contactValue}` : null,
    summary ? `Context: ${summary}` : null,
  ].filter(Boolean)

  const text = `A hot lead just came in from the Alyx chat.\n\n${fields.join('\n')}\n\nOpen the leads panel to follow up: ${link}`
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0a0f1c">
      <h2 style="margin:0 0 8px">New hot lead from the Alyx chat</h2>
      <table style="border-collapse:collapse;color:#475569;line-height:1.7;font-size:14px">
        <tr><td style="padding-right:12px"><strong>Channel</strong></td><td>${esc(channel)}</td></tr>
        <tr><td style="padding-right:12px"><strong>Intent</strong></td><td>${esc(intentTier)}</td></tr>
        ${contactValue ? `<tr><td style="padding-right:12px"><strong>Contact</strong></td><td>${esc(contactValue)}</td></tr>` : ''}
        ${summary ? `<tr><td style="padding-right:12px;vertical-align:top"><strong>Context</strong></td><td>${esc(summary)}</td></tr>` : ''}
      </table>
      <p style="margin:24px 0">
        <a href="${esc(link)}" style="background:#00d4ff;color:#0a0f1c;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;display:inline-block">Open the leads panel</a>
      </p>
    </div>`

  await sendMail({ to, subject: `New hot lead (${channel}) - Alyx`, text, html })
}

export const leadRouter = Router()

leadRouter.post('/', async (req, res) => {
  const body = req.body || {}

  // Honeypot (P3-3, decision C). The field is hidden and offscreen in the form,
  // so a human never fills it. A filled value is a bot: answer 200 so it sees
  // success and moves on, but write nothing.
  const honeypot = typeof body.honeypot === 'string' ? body.honeypot.trim() : ''
  if (honeypot) return res.status(200).json({ ok: true })

  const channel = typeof body.channel === 'string' ? body.channel : ''
  const sessionId = typeof body.session_id === 'string' ? body.session_id.trim() : ''

  if (!CHANNELS.has(channel)) return res.status(400).json({ error: 'invalid channel' })
  if (!sessionId) return res.status(400).json({ error: 'session_id is required' })

  // Resolve the conversation this session belongs to, if one exists. A canned-only
  // session (P3-2 gap fix) can engage an availability/contact chip without ever
  // POSTing to /api/chat, so it may have no conversation row yet. That is inherently
  // a portfolio lead: the client only produces a canned cta in portfolio mode (PK-4).
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

  // Intent basis (P3-3 BUG2): the question that actually earned the chip, which the
  // client now forwards as `context` for every channel (the user message the chip's
  // answer was claimed under). It is the authoritative basis: the chip is anchored
  // to its host turn, so a later message ("thanks") must not override it. Falls back
  // to the last stored user message when no context is sent (older clients), then to
  // nothing. Never trust a client-sent tier; only the keywords in this text matter.
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
  const clientContext = typeof body.context === 'string' ? body.context.trim() : ''
  const tierBasis = clientContext || lastUserText

  // Earned-cta guard (P3-3, decision D). Recompute the cta over the intent basis:
  // a session that never showed lead intent (a direct POST with "hello" or empty
  // context) produces no cta, so there is nothing to capture. This is the real fix
  // for the no-conv spam hole. The channel stays the validated one the client sent;
  // only the warmth is reassessed.
  const recomputed = detectLeadCta(tierBasis, conv?.mode || 'portfolio', [])
  if (!recomputed) return res.status(400).json({ error: 'no lead intent in this session' })
  const intentTier = recomputed.tier

  // Context summary: a short, redacted note, never the raw transcript. Built from
  // the last stored user message plus the visitor's optional one-line note from
  // the email form, both run through redact() defensively.
  const parts = []
  if (lastUserText) parts.push(lastUserText)
  if (typeof body.context === 'string' && body.context.trim()) parts.push(body.context.trim())
  const summary = parts.length ? redact(parts.join(' | ')).slice(0, CONTEXT_MAX) : null

  // Row dedup (P3-3, decision E). Reopening the chat in a new tab and re-engaging
  // the same channel should not pile up rows. One lead per (session, channel) in
  // the window is enough; a repeat is a no-op success (idempotent).
  const { rows: dupRows } = await query(
    `SELECT 1 FROM leads
      WHERE session_id = $1 AND channel = $2
        AND created_at > now() - make_interval(hours => $3::int)
      LIMIT 1`,
    [sessionId, channel, DEDUP_HOURS],
  )
  if (dupRows.length) return res.status(200).json({ ok: true, deduped: true })

  await query(
    `INSERT INTO leads (conversation_id, session_id, channel, intent_tier, context_summary, contact_value, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'new')`,
    [conv?.id || null, sessionId, channel, intentTier, summary, contactValue],
  )

  res.status(201).json({ ok: true })

  // Hot-only notify (P3-3, decision B), fire-and-forget after the response so a
  // mail failure never affects the lead write. Warm leads sit in the inbox.
  if (intentTier === 'hot') {
    notifyHotLead({ channel, intentTier, summary, contactValue, sessionId })
      .catch((err) => console.error('[lead] hot-lead notify failed:', err.message))
  }
})
