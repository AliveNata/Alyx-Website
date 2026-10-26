import { Router } from 'express'
import { query } from './db.js'
import { groqChatOnce } from './groq.js'
import { retrieveChunks } from './retrieve.js'
import { buildFitCheckPrompt, asciiNormalize } from './prompts.js'

// Fit-check (P3-5). A recruiter pastes a job description; the bot returns an
// honest, grounded read of how Alief fits: strengths tied to real portfolio
// evidence, and explicit gaps where the corpus has none. This is the highest
// fabrication-risk feature in the funnel, so the grounding lives in the prompt
// (buildFitCheckPrompt) and this endpoint only feeds it the retrieved evidence.
//
// Public but server-authoritative, same shape as POST /api/lead/draft: it
// resolves the conversation itself, rejects the companion/English modes (hiring
// is portfolio-only), caps and truncates the JD, retrieves read-only over the JD
// text, makes ONE low-temperature Groq call, and ASCII-normalizes the output
// before returning. Any upstream problem returns 5xx so the client shows its
// error state. Mounted behind the leadLimiter in index.js.

// The eight chat languages the frontend offers (ChatBot.jsx UI_TEXT). The client
// sends the selected uiLang so the grounded assessment comes back in the
// visitor's language; an unknown or missing value degrades to English.
const FIT_LANGS = new Set(['en', 'id', 'ja', 'zh', 'ko', 'fr', 'de', 'ar'])
const JD_MAX = 6000         // cap the pasted JD before retrieval / Groq (decision A)
const FIT_TOP_K = 8         // a JD spans several areas, so retrieve wider than chat
const FIT_TEMPERATURE = 0.3 // low, to keep the assessment close to the evidence
const FIT_MAX_TOKENS = 800  // a scannable assessment, not an essay
const FIT_SETTINGS_DEFAULTS = { model: 'openai/gpt-oss-20b', reasoning_effort: 'low' }

// Reuse the admin's model + reasoning effort (same as the draft path), but hold
// temperature low and output short: this is a grounded assessment, not a chat.
async function loadFitModel() {
  const { rows } = await query('SELECT model, reasoning_effort FROM chatbot_settings WHERE id = 1')
  return { ...FIT_SETTINGS_DEFAULTS, ...(rows[0] || {}) }
}

export const fitcheckRouter = Router()

fitcheckRouter.post('/', async (req, res) => {
  const body = req.body || {}
  const sessionId = typeof body.session_id === 'string' ? body.session_id.trim() : ''
  const jd = typeof body.jd === 'string' ? body.jd.trim().slice(0, JD_MAX) : ''
  const lang = typeof body.lang === 'string' && FIT_LANGS.has(body.lang) ? body.lang : 'en'
  if (!sessionId) return res.status(400).json({ error: 'session_id is required' })
  if (!jd) return res.status(400).json({ error: 'a job description is required' })

  // Portfolio-only funnel, the same boundary the lead endpoints enforce: a
  // companion or English conversation cannot run a hiring fit-check. A session
  // with no conversation is portfolio by construction, so it is allowed.
  const { rows: convRows } = await query(
    'SELECT mode FROM conversations WHERE session_id = $1',
    [sessionId],
  )
  const conv = convRows[0] || null
  if (conv && (conv.mode === 'curhat' || conv.mode === 'english')) {
    return res.status(403).json({ error: 'fit-check not allowed for this conversation' })
  }

  // Retrieve the portfolio evidence for the JD (read-only). A wider top-K than
  // chat, since a JD spans several areas. A retrieval failure is a 5xx: unlike
  // the chat path there is no legacy stuffing to fall back to, and guessing from
  // an empty context is exactly the fabrication this feature must avoid.
  let chunks
  try {
    chunks = await retrieveChunks(jd, FIT_TOP_K)
  } catch (err) {
    console.error('[fitcheck] retrieval failed:', err.message)
    return res.status(502).json({ error: 'fitcheck_failed' })
  }

  const settings = await loadFitModel()
  const payload = {
    model: settings.model || FIT_SETTINGS_DEFAULTS.model,
    reasoning_effort: settings.reasoning_effort || FIT_SETTINGS_DEFAULTS.reasoning_effort,
    temperature: FIT_TEMPERATURE,
    max_tokens: FIT_MAX_TOKENS,
    messages: [
      { role: 'system', content: buildFitCheckPrompt(jd, chunks, lang) },
      { role: 'user', content: 'Assess the fit now.' },
    ],
  }

  // Stop draining Groq tokens if the recruiter closes the box before it returns.
  const ac = new AbortController()
  req.on('close', () => ac.abort())

  let resp
  try {
    resp = await groqChatOnce(payload, ac.signal)
  } catch (err) {
    if (ac.signal.aborted) return // client left before the assessment came back
    if (err.code === 'NO_KEY') return res.status(500).json({ error: 'fit-check unavailable' })
    console.error('[fitcheck] groq call failed:', err.message)
    return res.status(502).json({ error: 'fitcheck_failed' })
  }
  if (resp.status < 200 || resp.status >= 300) {
    return res.status(502).json({ error: 'fitcheck_failed' })
  }

  let assessment = ''
  try {
    const data = await resp.json()
    assessment = (data?.choices?.[0]?.message?.content || '').trim()
  } catch (err) {
    console.error('[fitcheck] parse failed:', err.message)
    return res.status(502).json({ error: 'fitcheck_failed' })
  }
  if (!assessment) return res.status(502).json({ error: 'fitcheck_failed' })

  res.json({ assessment: asciiNormalize(assessment) })
})
