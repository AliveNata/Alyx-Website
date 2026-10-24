const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
export const RL_HEADERS = [
  'x-ratelimit-limit-requests', 'x-ratelimit-remaining-requests',
  'x-ratelimit-limit-tokens', 'x-ratelimit-remaining-tokens',
  'x-ratelimit-reset-requests', 'x-ratelimit-reset-tokens',
]

// Calls Groq with stream:true and returns the
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
