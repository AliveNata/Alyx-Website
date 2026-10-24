import { Router } from 'express'
import { query, pool } from './db.js'
import { groqChatStream, RL_HEADERS } from './groq.js'
import { getPortfolio } from './portfolio.js'
import { CURHAT_PROMPT, ENGLISH_PROMPT, buildPortfolioPrompt, languageNudge } from './prompts.js'
import { redact, hashValue } from './redact.js'

const MESSAGE_MAX = 2000        // reject oversized input before it reaches Groq
const HISTORY_TURNS = 8         // recent turns kept for context
const HISTORY_CHAR_BUDGET = 6000
const VALID_MODES = new Set(['portfolio', 'curhat', 'english'])

// Daily token caps (P1-6). 0 or unset disables that check.
const SESSION_CAP = Number.parseInt(process.env.BUDGET_TOKENS_PER_SESSION_DAY, 10) || 0
const IP_CAP = Number.parseInt(process.env.BUDGET_TOKENS_PER_IP_DAY, 10) || 0

// Seconds until the next local midnight, when the daily budget resets. Matches
// PG's date_trunc('day', now()) when the app and DB share a timezone.
function secondsToMidnight() {
  const now = new Date()
  const mid = new Date(now)
  mid.setHours(24, 0, 0, 0)
  return Math.max(1, Math.round((mid - now) / 1000))
}

export const chatRouter = Router()

// Defaults matching schema.sql, so a missing row never leaves a field undefined
// (notably enable_companion, which the curhat gate reads as a boolean).
const SETTINGS_DEFAULTS = {
  model: 'openai/gpt-oss-20b',
  reasoning_effort: 'low',
  temperature: 0.7,
  max_tokens: 700,
  enable_companion: true,
}

// Short-lived cache of the single settings row. One DB hit at most every 30s,
// so admin edits still land quickly.
let settingsCache = { at: 0, row: null }
async function loadSettings() {
  if (settingsCache.row && Date.now() - settingsCache.at < 30_000) return settingsCache.row
  const { rows } = await query('SELECT * FROM chatbot_settings WHERE id = 1')
  settingsCache = { at: Date.now(), row: { ...SETTINGS_DEFAULTS, ...(rows[0] || {}) } }
  return settingsCache.row
}

// The server, not the client, decides how much history to keep: last N turns
// within a char budget, trimmed oldest-first.
function capHistory(history) {
  const clean = (Array.isArray(history) ? history : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-HISTORY_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MESSAGE_MAX) }))
  let budget = HISTORY_CHAR_BUDGET
  const kept = []
  for (let i = clean.length - 1; i >= 0; i--) {
    budget -= clean[i].content.length
    if (budget < 0) break
    kept.unshift(clean[i])
  }
  return kept
}

// Best-effort logging (P1-1). A failure here is logged and swallowed so the
// visitor always gets their reply. Content gating: curhat and opted-out store
// metadata only (content NULL); otherwise content is redacted first. The P1-2
// telemetry object (tokens, model, latency, rate-limit snapshot) lands on the
// assistant row only; the user row leaves those columns null.
async function logTurn({ sessionId, lang, mode, consent, ip, ua, userText, replyText, telemetry }) {
  if (!sessionId) return
  const optedOut = consent === false
  const consentState = optedOut ? 'opted_out' : 'notice_default'
  const storeContent = mode !== 'curhat' && !optedOut
  const userContent = storeContent ? redact(userText) : null
  const assistantContent = storeContent ? redact(replyText) : null

  const t = telemetry || {}
  const rlSnapshot = t.rate_limit_snapshot ? JSON.stringify(t.rate_limit_snapshot) : null

  // One transaction so the upsert and both message inserts commit together:
  // a partial failure must not leave a conversation with zero messages.
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      `INSERT INTO conversations (session_id, lang, mode, consent_state, ip_hash, ua_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (session_id) DO UPDATE SET
         lang = EXCLUDED.lang, mode = EXCLUDED.mode, consent_state = EXCLUDED.consent_state,
         ip_hash = EXCLUDED.ip_hash, ua_hash = EXCLUDED.ua_hash
       RETURNING id`,
      [sessionId, lang, mode, consentState, hashValue(ip), hashValue(ua)],
    )
    await client.query(
      `INSERT INTO messages
         (conversation_id, role, content, tokens_in, tokens_out, model, latency_ms, cache_hit, rate_limit_snapshot)
       VALUES
         ($1, 'user', $2, NULL, NULL, NULL, NULL, NULL, NULL),
         ($1, 'assistant', $3, $4, $5, $6, $7, $8, $9::jsonb)`,
      [
        rows[0].id, userContent, assistantContent,
        t.tokens_in ?? null, t.tokens_out ?? null, t.model ?? null,
        t.latency_ms ?? null, t.cache_hit ?? null, rlSnapshot,
      ],
    )
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

chatRouter.post('/', async (req, res) => {
  const body = req.body || {}
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) return res.status(400).json({ error: 'message is required' })
  if (message.length > MESSAGE_MAX) return res.status(400).json({ error: `message exceeds ${MESSAGE_MAX} characters` })

  const mode = VALID_MODES.has(body.mode) ? body.mode : 'portfolio'
  const lang = typeof body.lang === 'string' ? body.lang : null
  const settings = await loadSettings()

  // Companion is admin-gated. Off returns a plain reply, not an error, so the
  // chat UI shows it as a normal message.
  if (mode === 'curhat' && settings.enable_companion === false) {
    return res.json({
      reply: lang === 'en'
        ? "Companion mode is off right now. I can still help with Alief's skills, experience, or projects."
        : 'Mode teman ngobrol lagi dimatikan. Aku masih bisa bantu soal skill, pengalaman, atau proyek Alief.',
      mode,
      meta: { model: null, finish_reason: 'disabled', rateLimit: null },
    })
  }

  let systemPrompt
  if (mode === 'curhat') systemPrompt = CURHAT_PROMPT
  else if (mode === 'english') systemPrompt = ENGLISH_PROMPT
  else systemPrompt = buildPortfolioPrompt(settings.system_prompt, await getPortfolio())
  systemPrompt += `\n\n${languageNudge(lang, mode)}`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...capHistory(body.history),
    { role: 'user', content: message },
  ]

  // Model and limits are server-owned. Any model/max_tokens/temperature/
  // system_prompt/messages in the client body are ignored by construction.
  const payload = {
    model: settings.model || 'openai/gpt-oss-20b',
    reasoning_effort: settings.reasoning_effort || 'low',
    temperature: settings.temperature != null ? Number(settings.temperature) : 0.7,
    max_tokens: settings.max_tokens ? Number(settings.max_tokens) : 700,
    messages,
  }

  // Daily token budget (P1-6): reject an over-cap session/IP before spending any
  // Groq quota. Sums today's tokens from the P1-1/P1-2 logs; matches on ip_hash
  // only (never the raw IP). Fail-open: a counting error allows the turn.
  const sessionId = typeof body.session_id === 'string' ? body.session_id : null
  const ipHash = hashValue(req.ip)
  if ((SESSION_CAP > 0 || IP_CAP > 0) && (sessionId || ipHash)) {
    try {
      const { rows } = await query(
        `SELECT
           coalesce(sum(m.tokens_in) FILTER (WHERE c.session_id = $1), 0)
             + coalesce(sum(m.tokens_out) FILTER (WHERE c.session_id = $1), 0) AS session_tokens,
           coalesce(sum(m.tokens_in) FILTER (WHERE c.ip_hash = $2), 0)
             + coalesce(sum(m.tokens_out) FILTER (WHERE c.ip_hash = $2), 0) AS ip_tokens
         FROM messages m
         JOIN conversations c ON c.id = m.conversation_id
         WHERE m.created_at >= date_trunc('day', now())
           AND (c.session_id = $1 OR c.ip_hash = $2)`,
        [sessionId, ipHash],
      )
      const sessionTokens = Number(rows[0]?.session_tokens) || 0
      const ipTokens = Number(rows[0]?.ip_tokens) || 0
      if ((SESSION_CAP > 0 && sessionTokens >= SESSION_CAP) || (IP_CAP > 0 && ipTokens >= IP_CAP)) {
        return res.status(429).json({ error: 'budget_exceeded', retryAfter: secondsToMidnight() })
      }
    } catch (err) {
      console.error('[chat] budget check failed (allowing turn):', err.message)
    }
  }

  // Abort the Groq fetch when the browser disconnects, so we stop draining tokens
  // (and skip logging) for a client that is gone.
  const ac = new AbortController()
  req.on('close', () => ac.abort())

  let resp, streamModel
  const startedAt = Date.now()
  try {
    ({ resp, model: streamModel } = await groqChatStream(payload, ac.signal))
  } catch (err) {
    if (err.code === 'NO_KEY') return res.status(500).json({ error: 'Missing GROQ_API_KEY on server' })
    if (ac.signal.aborted) return // client left before the stream opened
    // Network/fetch failure reaching Groq: surface as an upstream error, not a generic 500.
    console.error('[chat] groq call failed:', err.message)
    return res.status(502).json({ error: 'upstream_error' })
  }

  // Rate-limit headers and pre-stream errors are resolved as normal JSON, before
  // any SSE bytes, so the client can still branch on status / content-type.
  const rlHeaders = {}
  for (const h of RL_HEADERS) { const v = resp.headers.get(h); if (v) rlHeaders[h] = v }
  const rateLimit = Object.keys(rlHeaders).length ? rlHeaders : null
  for (const [h, v] of Object.entries(rlHeaders)) res.set(h, v)

  if (resp.status === 429) {
    const retryAfter = Number(resp.headers.get('retry-after')) || undefined
    return res.status(429).json({ error: 'rate_limited', retryAfter })
  }
  if (resp.status < 200 || resp.status >= 300 || !resp.body) {
    return res.status(502).json({ error: 'upstream_error' })
  }

  // Open the SSE channel. X-Accel-Buffering: no asks nginx not to buffer.
  res.status(200).set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders?.()
  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`)

  let reply = ''
  let usage = null
  let finishReason = null
  let answeredModel = streamModel || payload.model
  let aborted = false

  try {
    // Parse Groq's SSE: `data: {json}` lines, delta content in choices[0].delta,
    // a final include_usage chunk with totals, and a terminal `data: [DONE]`.
    const decoder = new TextDecoder()
    let buf = ''
    for await (const chunk of resp.body) {
      buf += decoder.decode(chunk, { stream: true })
      let nl
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim()
        buf = buf.slice(nl + 1)
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (data === '[DONE]') continue
        let evt
        try { evt = JSON.parse(data) } catch { continue }
        if (evt.model) answeredModel = evt.model
        if (evt.usage) usage = evt.usage
        const ch = evt.choices?.[0]
        if (ch?.finish_reason) finishReason = ch.finish_reason
        const delta = ch?.delta?.content
        if (delta) { reply += delta; send({ type: 'delta', text: delta }) }
      }
    }
    send({ type: 'done', meta: { model: answeredModel, finish_reason: finishReason, rateLimit } })
  } catch (err) {
    if (ac.signal.aborted || err.name === 'AbortError') {
      aborted = true // client disconnected: stop quietly, nothing to send
    } else {
      // The client keeps whatever text already arrived; just signal the break.
      console.error('[chat] stream error:', err.message)
      if (!res.writableEnded) send({ type: 'error', error: 'stream_interrupted' })
    }
  }
  if (!res.writableEnded) res.end()

  if (aborted) return // do not log an incomplete turn for a client that left

  // Log once, after the stream, with the accumulated reply + final usage.
  const latencyMs = Date.now() - startedAt
  try {
    await logTurn({
      sessionId,
      lang, mode, consent: body.consent,
      ip: req.ip, ua: req.headers['user-agent'] || '',
      userText: message, replyText: reply,
      telemetry: {
        tokens_in: usage?.prompt_tokens ?? null,
        tokens_out: usage?.completion_tokens ?? null,
        model: answeredModel,
        latency_ms: latencyMs,
        cache_hit: false, // no server cache yet; P2-6 owns that
        rate_limit_snapshot: rateLimit,
      },
    })
  } catch (err) {
    console.error('[chat] logging failed:', err.message)
  }
})
