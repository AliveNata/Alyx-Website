import { Router } from 'express'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
export const RL_HEADERS = [
  'x-ratelimit-limit-requests', 'x-ratelimit-remaining-requests',
  'x-ratelimit-limit-tokens', 'x-ratelimit-remaining-tokens',
  'x-ratelimit-reset-requests', 'x-ratelimit-reset-tokens',
]

// The single place that talks to Groq. Returns the raw body (the legacy proxy
// forwards it verbatim), the parsed JSON when the body is JSON, and the
// rate-limit headers so callers can relay live usage to the browser.
// Throws with code 'NO_KEY' when GROQ_API_KEY is missing so callers map it to 500.
export async function groqChat(payload) {
  const key = process.env.GROQ_API_KEY
  if (!key) {
    const err = new Error('Missing GROQ_API_KEY on server')
    err.code = 'NO_KEY'
    throw err
  }

  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(payload || {}),
  })
  const text = await resp.text()
  const rlHeaders = {}
  for (const h of RL_HEADERS) {
    const v = resp.headers.get(h)
    if (v) rlHeaders[h] = v
  }
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: resp.status, text, json, rlHeaders, retryAfter: resp.headers.get('retry-after') }
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
