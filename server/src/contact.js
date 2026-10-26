import { Router } from 'express'
import { query } from './db.js'
import { sendMail } from './mailer.js'

// Contact form endpoint (PK-23). The site used to POST straight to the Google
// Apps Script with mode:'no-cors', so the response was opaque: the "sent" toast
// meant dispatched, not delivered, and a failing script could not be diagnosed.
// This endpoint puts the submission behind our own server so we can:
//   1. forward to the Apps Script (the durable Sheet log) with a normal fetch and
//      actually see its status;
//   2. email the owner (the reliable delivery, our SMTP) with the visitor's email
//      as reply-to so he can reply in one tap;
//   3. return a real success/failure the client surfaces honestly.
//
// Public but server-authoritative, same spirit as the lead funnel: a honeypot
// drops bots silently, lengths are capped, and the email body is HTML-escaped so
// a crafted message cannot inject markup into the owner's inbox.

// Pragmatic email shape check, same spirit as redact.js / lead.js: one local
// part, one domain with a dot. Not an RFC validator, just enough to reject junk.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Length caps. Generous enough for a real message, tight enough to bound abuse
// and keep the email readable.
const NAME_MAX = 200
const EMAIL_MAX = 320
const MESSAGE_MAX = 5000

// Apps Script can be slow or wedged; bound the forward so it cannot hang the
// request. The email is the primary signal, so a slow Sheet never blocks it long.
const SHEET_TIMEOUT_MS = 10000

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

// Pure validation so it can be unit-tested without a request. Returns either
// { error } (a client-safe 400 message) or the trimmed, accepted fields.
export function validateContact(body) {
  const b = body || {}
  const name = typeof b.name === 'string' ? b.name.trim() : ''
  const email = typeof b.email === 'string' ? b.email.trim() : ''
  const message = typeof b.message === 'string' ? b.message.trim() : ''

  if (!name || !email || !message) return { error: 'name, email and message are required' }
  if (name.length > NAME_MAX) return { error: 'name is too long' }
  if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) return { error: 'a valid email is required' }
  if (message.length > MESSAGE_MAX) return { error: 'message is too long' }

  return { name, email, message }
}

// Pure success decision (PK-23, decision B). The email to the owner is the
// reliable delivery, so it is the primary signal; the Sheet is the durable log
// and best-effort. ok = the email actually sent OR (when SMTP is unset/failed)
// the Sheet forward returned 2xx. Only when BOTH miss is it a failure.
export function decideContactStatus({ emailDelivered, sheetDelivered }) {
  return emailDelivered === true || sheetDelivered === true
}

// Forward to the Apps Script server-side with a normal fetch so we see the real
// status (no no-cors opacity). Best-effort: any failure resolves to false and is
// decided on by the caller, never thrown.
async function forwardToSheet(endpoint, { name, email, message }) {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), SHEET_TIMEOUT_MS)
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name, email, message }),
      signal: ac.signal,
    })
    return res.ok
  } finally {
    clearTimeout(timer)
  }
}

export const contactRouter = Router()

contactRouter.post('/', async (req, res) => {
  const body = req.body || {}

  // Honeypot: a hidden offscreen field a human never fills. A filled value is a
  // bot: answer 200 so it sees success and moves on, but send nothing.
  const honeypot = typeof body.honeypot === 'string' ? body.honeypot.trim() : ''
  if (honeypot) return res.status(200).json({ ok: true })

  const result = validateContact(body)
  if (result.error) return res.status(400).json({ error: result.error })
  const { name, email, message } = result

  // Config. contact_endpoint (the Sheet) lives in site_settings and is read by
  // the public GET /api/settings. contact_email (where the message lands) lives
  // in chatbot_settings, the same source the lead funnel emails, and is never
  // exposed by GET /api/settings. Blank endpoint -> skip the Sheet; blank email
  // -> skip the email; both blank -> the form is misconfigured.
  const { rows: siteRows } = await query('SELECT contact_endpoint FROM site_settings WHERE id = 1')
  const { rows: botRows } = await query('SELECT contact_email FROM chatbot_settings WHERE id = 1')
  const endpoint = (siteRows[0]?.contact_endpoint || '').trim()
  const to = (botRows[0]?.contact_email || '').trim()

  if (!endpoint && !to) {
    console.error('[contact] misconfigured: neither contact_endpoint nor contact_email is set')
    return res.status(500).json({ error: 'The contact form is not configured right now.' })
  }

  // Forward to the Sheet first (the durable log), then email the owner. Both are
  // attempted regardless of each other so a row and a mail are not coupled.
  let sheetDelivered = false
  if (endpoint) {
    try {
      sheetDelivered = await forwardToSheet(endpoint, { name, email, message })
      if (!sheetDelivered) console.error('[contact] sheet forward returned a non-2xx status')
    } catch (err) {
      console.error('[contact] sheet forward failed:', err.message)
    }
  }

  // Email the owner. sendMail returns { sent: true } on a real send and
  // { dev: true } when SMTP is unset (it only logs). Only a real send counts as
  // delivered; dev/unset falls back to the Sheet, per decision B.
  let emailDelivered = false
  if (to) {
    try {
      const sent = await sendMail({
        to,
        subject: 'New message from the site',
        replyTo: email,
        text: `${name} sent a message through the site contact form.\n\nName: ${name}\nEmail: ${email}\n\n${message}\n\nReply to: ${email}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0a0f1c">
            <h2 style="margin:0 0 8px">New message from the site</h2>
            <table style="border-collapse:collapse;color:#475569;line-height:1.7;font-size:14px">
              <tr><td style="padding-right:12px"><strong>Name</strong></td><td>${esc(name)}</td></tr>
              <tr><td style="padding-right:12px"><strong>Email</strong></td><td>${esc(email)}</td></tr>
            </table>
            <div style="white-space:pre-wrap;background:#f1f5f9;border-radius:8px;padding:16px;margin-top:16px;color:#0a0f1c;line-height:1.6">${esc(message)}</div>
            <p style="margin:20px 0 0;color:#475569;font-size:14px">Reply to: <a href="mailto:${esc(email)}">${esc(email)}</a></p>
          </div>`,
      })
      emailDelivered = sent?.sent === true
    } catch (err) {
      console.error('[contact] email send failed:', err.message)
    }
  }

  if (!decideContactStatus({ emailDelivered, sheetDelivered })) {
    // Both channels missed. Log already carries the real cause above; the client
    // gets a generic failure with no internals or PII.
    console.error('[contact] submission failed: neither email nor sheet accepted it')
    return res.status(500).json({ error: 'Could not send your message. Please try again.' })
  }

  res.json({ ok: true })
})
