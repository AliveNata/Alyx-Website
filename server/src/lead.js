import { Router } from 'express'
import { query } from './db.js'
import { detectLeadCta } from './intent.js'
import { redact } from './redact.js'
import { sendMail } from './mailer.js'
import { groqChatOnce } from './groq.js'
import { buildDraftPrompt, asciiNormalize } from './prompts.js'

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

// Soft handoff (P3-4). On an email-channel submit the visitor's edited message
// (or a short notice when they left none) goes straight to Alief, with their
// email as reply-to so he can reply in one tap. This is the real handoff, so it
// REPLACES the generic hot-notify for the email channel: no double email. Fired
// after the row is committed and never awaited, so a mail failure cannot block or
// fail the lead write. Logs to the console when no recipient or no SMTP is set.
async function sendHandoff({ visitorEmail, message, summary, sessionId }) {
  const { rows: cfg } = await query('SELECT contact_email FROM chatbot_settings WHERE id = 1')
  const to = (cfg[0]?.contact_email || '').trim()
  if (!to) {
    console.log(`[lead] handoff skipped (no contact_email set); visitor ${visitorEmail}, session ${sessionId}`)
    return
  }

  const msg = (message || '').trim()
  const intro = msg
    ? 'A visitor used the Alyx chat to send you this message.'
    : 'A visitor left their email through the Alyx chat and would like to hear from you.'

  const textLines = [intro, '']
  if (msg) textLines.push(msg, '')
  else if (summary) textLines.push(`Context: ${summary}`, '')
  textLines.push(`Reply to: ${visitorEmail}`)
  const text = textLines.join('\n')

  const bodyBlock = msg
    ? `<div style="white-space:pre-wrap;background:#f1f5f9;border-radius:8px;padding:16px;color:#0a0f1c;line-height:1.6">${esc(msg)}</div>`
    : (summary ? `<p style="color:#475569;line-height:1.6"><strong>Context:</strong> ${esc(summary)}</p>` : '')

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0a0f1c">
      <h2 style="margin:0 0 8px">New message from the Alyx chat</h2>
      <p style="color:#475569;line-height:1.6">${esc(intro)}</p>
      ${bodyBlock}
      <p style="margin:20px 0 0;color:#475569;font-size:14px">Reply to: <a href="mailto:${esc(visitorEmail)}">${esc(visitorEmail)}</a></p>
    </div>`

  await sendMail({ to, subject: 'New message from the Alyx chat', text, html, replyTo: visitorEmail })
}

// Draft model config is server-authoritative, like /api/chat: the client can
// pick nothing. We reuse the admin's model + reasoning effort from
// chatbot_settings, but hold temperature low and the length short for the draft,
// since it is a brief, grounded handoff note rather than a conversational reply.
const DRAFT_SETTINGS_DEFAULTS = { model: 'openai/gpt-oss-20b', reasoning_effort: 'low' }
const DRAFT_USER_MSGS = 8     // recent user turns fed as the draft's only source
const DRAFT_TEMPERATURE = 0.3 // low, to keep the draft close to what was asked
const DRAFT_MAX_TOKENS = 300  // a handoff note is 2 to 4 sentences
const DRAFT_INPUT_MAX = 2000  // cap the visitor's message before it is emailed

async function loadDraftModel() {
  const { rows } = await query('SELECT model, reasoning_effort FROM chatbot_settings WHERE id = 1')
  return { ...DRAFT_SETTINGS_DEFAULTS, ...(rows[0] || {}) }
}

export const leadRouter = Router()

// Draft a handoff message (P3-4). Public, rate-limited by the leadLimiter mounted
// on /api/lead. Resolves the conversation itself and asks Groq for a short,
// first-person message FROM the visitor TO Alief, grounded only in the visitor's
// own questions. Portfolio funnel only: curhat/english are rejected, and a
// session with no conversation has no context to draft from. Fail-safe: any
// upstream problem returns 5xx so the client falls back to the plain form.
leadRouter.post('/draft', async (req, res) => {
  const body = req.body || {}
  const sessionId = typeof body.session_id === 'string' ? body.session_id.trim() : ''
  if (!sessionId) return res.status(400).json({ error: 'session_id is required' })

  const { rows: convRows } = await query(
    'SELECT id, mode FROM conversations WHERE session_id = $1',
    [sessionId],
  )
  const conv = convRows[0] || null
  // No conversation means no context to summarize (a canned-only session).
  if (!conv) return res.status(400).json({ error: 'no conversation to draft from' })
  // Portfolio-only funnel, same boundary as the lead write and detectLeadCta.
  if (conv.mode === 'curhat' || conv.mode === 'english') {
    return res.status(403).json({ error: 'draft not allowed for this conversation' })
  }

  // The visitor's own recent questions, already redacted when they were logged.
  // Oldest-first so the draft reads the thread in order.
  const { rows: msgRows } = await query(
    `SELECT content FROM messages
     WHERE conversation_id = $1 AND role = 'user' AND content IS NOT NULL
     ORDER BY id DESC LIMIT $2`,
    [conv.id, DRAFT_USER_MSGS],
  )
  const userMessages = msgRows.map((r) => r.content).reverse()
  if (!userMessages.length) return res.status(400).json({ error: 'no conversation to draft from' })

  const settings = await loadDraftModel()
  const payload = {
    model: settings.model || DRAFT_SETTINGS_DEFAULTS.model,
    reasoning_effort: settings.reasoning_effort || DRAFT_SETTINGS_DEFAULTS.reasoning_effort,
    temperature: DRAFT_TEMPERATURE,
    max_tokens: DRAFT_MAX_TOKENS,
    messages: [
      { role: 'system', content: buildDraftPrompt(userMessages) },
      { role: 'user', content: 'Write the message now.' },
    ],
  }

  // Stop draining Groq tokens if the visitor closes the box before it returns.
  const ac = new AbortController()
  req.on('close', () => ac.abort())

  let resp
  try {
    resp = await groqChatOnce(payload, ac.signal)
  } catch (err) {
    if (ac.signal.aborted) return // client left before the draft came back
    if (err.code === 'NO_KEY') return res.status(500).json({ error: 'drafting unavailable' })
    console.error('[lead] draft groq call failed:', err.message)
    return res.status(502).json({ error: 'draft_failed' })
  }
  if (resp.status < 200 || resp.status >= 300) {
    return res.status(502).json({ error: 'draft_failed' })
  }

  let draft = ''
  try {
    const data = await resp.json()
    draft = (data?.choices?.[0]?.message?.content || '').trim()
  } catch (err) {
    console.error('[lead] draft parse failed:', err.message)
    return res.status(502).json({ error: 'draft_failed' })
  }
  if (!draft) return res.status(502).json({ error: 'draft_failed' })

  // Fold the P3-4 ASCII nit server-side (P3-5, decision E): the visitor's draft
  // textarea gets plain ASCII without relying on the client render path.
  res.json({ draft: asciiNormalize(draft) })
})

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
  // The visitor's edited handoff message (P3-4), email channel only. It is the
  // body of the message Alief receives; optional, since an email-only lead still
  // works as before (P3-2). Capped before it is emailed.
  let handoffMessage = ''
  if (channel === 'email') {
    const candidate = typeof body.contact_value === 'string' ? body.contact_value.trim() : ''
    if (!isEmail(candidate)) return res.status(400).json({ error: 'a valid email is required' })
    contactValue = candidate
    handoffMessage = typeof body.message === 'string' ? body.message.trim().slice(0, DRAFT_INPUT_MAX) : ''
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

  // Fire-and-forget after the response so a mail failure never affects the lead
  // write. The email channel sends the soft handoff (P3-4): the visitor's message
  // reaches Alief directly, so it replaces the generic hot-notify there and avoids
  // a double email. Booking/sociabuzz keep the P3-3 hot-only notify.
  if (channel === 'email') {
    sendHandoff({ visitorEmail: contactValue, message: handoffMessage, summary, sessionId })
      .catch((err) => console.error('[lead] handoff send failed:', err.message))
  } else if (intentTier === 'hot') {
    notifyHotLead({ channel, intentTier, summary, contactValue, sessionId })
      .catch((err) => console.error('[lead] hot-lead notify failed:', err.message))
  }
})
