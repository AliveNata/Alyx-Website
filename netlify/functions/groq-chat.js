// Server-side proxy for Groq chat completions.
// Keeps GROQ_API_KEY on the server so it never ships to the browser bundle.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const RL_HEADERS = [
  'x-ratelimit-limit-requests', 'x-ratelimit-remaining-requests',
  'x-ratelimit-limit-tokens', 'x-ratelimit-remaining-tokens',
  'x-ratelimit-reset-requests', 'x-ratelimit-reset-tokens',
]

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }
  const key = process.env.GROQ_API_KEY
  if (!key) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing GROQ_API_KEY on server' }) }
  }

  let payload
  try { payload = JSON.parse(event.body || '{}') }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) } }

  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify(payload),
  })

  const text = await resp.text()

  // Forward Groq's rate-limit headers so the client can keep showing usage.
  const headers = { 'Content-Type': 'application/json' }
  for (const h of RL_HEADERS) {
    const v = resp.headers.get(h)
    if (v) headers[h] = v
  }

  return { statusCode: resp.status, headers, body: text }
}
