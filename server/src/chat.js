import { Router } from 'express'
import { query } from './db.js'
import { groqChat } from './groq.js'
import { getPortfolio } from './portfolio.js'
import { CURHAT_PROMPT, ENGLISH_PROMPT, buildPortfolioPrompt, languageNudge } from './prompts.js'

const MESSAGE_MAX = 2000        // reject oversized input before it reaches Groq
const HISTORY_TURNS = 8         // recent turns kept for context
const HISTORY_CHAR_BUDGET = 6000
const VALID_MODES = new Set(['portfolio', 'curhat', 'english'])

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

  let result
  try {
    result = await groqChat(payload)
  } catch (err) {
    if (err.code === 'NO_KEY') return res.status(500).json({ error: 'Missing GROQ_API_KEY on server' })
    // Network/fetch failure reaching Groq: surface as an upstream error, not a generic 500.
    console.error('[chat] groq call failed:', err.message)
    return res.status(502).json({ error: 'upstream_error' })
  }

  // Relay Groq rate-limit headers so the client usage UI keeps working.
  for (const [h, v] of Object.entries(result.rlHeaders)) res.set(h, v)
  const rateLimit = Object.keys(result.rlHeaders).length ? result.rlHeaders : null

  if (result.status === 429) {
    const retryAfter = Number(result.retryAfter) || undefined
    return res.status(429).json({ error: 'rate_limited', retryAfter })
  }
  if (result.status < 200 || result.status >= 300 || !result.json) {
    return res.status(502).json({ error: 'upstream_error' })
  }

  const choice = result.json.choices?.[0]
  res.json({
    reply: choice?.message?.content || '',
    mode,
    meta: {
      model: payload.model,
      finish_reason: choice?.finish_reason || null,
      rateLimit,
    },
  })
})
