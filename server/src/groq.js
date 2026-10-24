import { Router } from 'express'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
export const RL_HEADERS = [
  'x-ratelimit-limit-requests', 'x-ratelimit-remaining-requests',
  'x-ratelimit-limit-tokens', 'x-ratelimit-remaining-tokens',
  'x-ratelimit-reset-requests', 'x-ratelimit-reset-tokens',
]

// The single place that talks to Groq. Returns the raw body (the legacy proxy
// forwards it verbatim), the parsed JSON, the rate-limit headers, and `model`
// (the model that actually answered, so telemetry records a fallback correctly).
// Throws with code 'NO_KEY' when GROQ_API_KEY is missing so callers map it to 500.
export async function groqChat(payload) {
  const key = process.env.GROQ_API_KEY
  if (!key) {
    const err = new Error('Missing GROQ_API_KEY on server')
    err.code = 'NO_KEY'
    throw err
  }

  const callOnce = async (body) => {
    const resp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body || {}),
    })
    const text = await resp.text()
    const rlHeaders = {}
    for (const h of RL_HEADERS) {
      const v = resp.headers.get(h)
      if (v) rlHeaders[h] = v
    }
    let json = null
    try { json = JSON.parse(text) } catch {}
    return { status: resp.status, text, json, rlHeaders, retryAfter: resp.headers.get('retry-after'), model: body?.model }
  }

  let result = await callOnce(payload)

  // One fallback hop: Groq per-model limits differ, so a 429 on the primary may
  // still succeed on a lighter model. No loop, no queue. Empty env disables it.
  const fallback = process.env.GROQ_FALLBACK_MODEL
  if (result.status === 429 && fallback && fallback !== payload?.model) {
    result = await callOnce({ ...payload, model: fallback })
  }
  return result
}

// Streaming variant for /api/chat: calls Groq with stream:true and returns the
// upstream Response so the caller pipes its SSE body to the browser. The P1-6
// 429 fallback applies to the INITIAL response, before any bytes are streamed.
// One hop. Returns { resp, model } where model is the model actually requested.
// `signal` lets the caller abort the Groq fetch when the browser disconnects, so
// we stop draining tokens for a client that is gone.
export async function groqChatStream(payload, signal) {
  const key = process.env.GROQ_API_KEY
  if (!key) {
    const err = new Error('Missing GROQ_API_KEY on server')
    err.code = 'NO_KEY'
    throw err
  }

  const callOnce = (body) => fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ ...body, stream: true, stream_options: { include_usage: true } }),
    signal,
  })

  let resp = await callOnce(payload)
  let model = payload?.model
  const fallback = process.env.GROQ_FALLBACK_MODEL
  if (resp.status === 429 && fallback && fallback !== payload?.model) {
    resp = await callOnce({ ...payload, model: fallback })
    model = fallback
  }
  return { resp, model }
}

export const groqRouter = Router()

// Legacy proxy: forwards the client body to Groq verbatim so GROQ_API_KEY never
// reaches the browser. KEEP until S0-4 retires it; /api/chat is the replacement.
groqRouter.post('/', async (req, res) => {
  let result
  try {
    result = await groqChat(req.body || {})
  } catch (err) {
    if (err.code === 'NO_KEY') return res.status(500).json({ error: 'Missing GROQ_API_KEY on server' })
    throw err
  }
  for (const [h, v] of Object.entries(result.rlHeaders)) res.set(h, v)
  res.status(result.status).type('application/json').send(result.text)
})
