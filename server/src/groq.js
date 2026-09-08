import { Router } from 'express'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
export const RL_HEADERS = [
  'x-ratelimit-limit-requests', 'x-ratelimit-remaining-requests',
  'x-ratelimit-limit-tokens', 'x-ratelimit-remaining-tokens',
  'x-ratelimit-reset-requests', 'x-ratelimit-reset-tokens',
]

export const groqRouter = Router()

// Proxies Groq chat completions so GROQ_API_KEY never reaches the browser.
// Forwards Groq's rate-limit headers so the chatbot can show live usage.
groqRouter.post('/', async (req, res) => {
  const key = process.env.GROQ_API_KEY
  if (!key) return res.status(500).json({ error: 'Missing GROQ_API_KEY on server' })

  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(req.body || {}),
  })
  const text = await resp.text()
  for (const h of RL_HEADERS) {
    const v = resp.headers.get(h)
    if (v) res.set(h, v)
  }
  res.status(resp.status).type('application/json').send(text)
})
