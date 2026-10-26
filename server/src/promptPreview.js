import { Router } from 'express'
import { groqChatOnce } from './groq.js'
import { retrieveChunks } from './retrieve.js'
import { buildRetrievalPrompt, notSureReply } from './prompts.js'
import { requireAuth } from './auth.js'

// Prompt playground (PK-1). Runs the REAL portfolio pipeline against a CANDIDATE
// config (the admin's unsaved prompt + tuning) and a sample question, so the
// admin can see how an edit behaves BEFORE saving it live.
//
// ZERO side effects by design: it does NOT read or write chatbot_settings, does
// NOT log a turn, does NOT touch the token budget, and does NOT read or write the
// answer cache. It only retrieves (read-only) and makes one non-streaming Groq
// call with the candidate config. That isolation is why none of chat.js's
// logTurn / cache / budget helpers are imported here (guarded by
// promptPreview.test.js). The live chat pipeline is untouched.

const MESSAGE_MAX = 2000 // same cap as POST /api/chat, before anything reaches Groq
const PREVIEW_MAX_TOKENS = 1200 // hard ceiling so a bad candidate can't run away

// RAG knobs, read the same way chat.js reads them, so the playground grounds on
// the identical threshold the live bot uses. Duplicated (not imported) to keep
// chat.js's hot path untouched.
const RAG_TOP_K = Number.parseInt(process.env.RAG_TOP_K, 10) || 5
const RAG_MIN_SIM = Number.isFinite(Number.parseFloat(process.env.RAG_MIN_SIM))
  ? Number.parseFloat(process.env.RAG_MIN_SIM)
  : 0.78

// Section-level citation allowlist, mirrored from chat.js (kept local so the
// live handler is not modified). A citation is emitted only for a retrieved
// chunk whose anchor resolves to a real rendered section.
const CITED_SECTIONS = new Set(['about', 'projects', 'skills', 'experience', 'recognition'])
const CITATION_CAP = 3

// Chunks arrive nearest-first, so first-seen order is best-similarity order:
// dedupe by section, drop anything outside the allowlist, cap the count.
function buildCitations(chunks) {
  const seen = new Set()
  const out = []
  for (const c of Array.isArray(chunks) ? chunks : []) {
    const section = c && c.anchor ? String(c.anchor).replace(/^#/, '') : ''
    if (!CITED_SECTIONS.has(section) || seen.has(section)) continue
    seen.add(section)
    out.push({ anchor: `#${section}`, section })
    if (out.length >= CITATION_CAP) break
  }
  return out
}

export const promptPreviewRouter = Router()

// POST /api/admin/prompt-preview - admin only (requireAuth, inline, like
// promptVersions.js) and rate-limited by previewLimiter in index.js. requireAuth
// runs first so an unauthenticated request is rejected 401 before any retrieval
// or Groq call; the limiter is defense-in-depth on top, never the gate. Body:
// { system_prompt, model, reasoning_effort, temperature, max_tokens, message,
// lang? }. Returns { reply, citations, grounded, usedSections }.
promptPreviewRouter.post('/', requireAuth, async (req, res) => {
  const body = req.body || {}
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) return res.status(400).json({ error: 'message is required' })
  if (message.length > MESSAGE_MAX) {
    return res.status(400).json({ error: `message exceeds ${MESSAGE_MAX} characters` })
  }

  const lang = typeof body.lang === 'string' ? body.lang : null

  // Retrieve over the raw sample question (read-only). Unlike the live chat path
  // there is no legacy whole-portfolio stuffing fallback: the playground tests
  // the grounded RAG behavior, so a retrieval failure is a 502, not a silent
  // fallback that would mislead the admin about how the prompt performs.
  let chunks
  try {
    chunks = await retrieveChunks(message, RAG_TOP_K)
  } catch (err) {
    console.error('[prompt-preview] retrieval failed:', err.message)
    return res.status(502).json({ error: 'retrieval_failed' })
  }

  // Best similarity below the threshold is a genuine "not sure": return the same
  // fixed reply the live bot streams, flagged grounded:false, so the admin sees
  // the grounding boundary behave exactly as it would in production.
  const bestDistance = chunks.length ? Number(chunks[0].distance) : 2
  if (1 - bestDistance < RAG_MIN_SIM) {
    return res.json({ reply: notSureReply(lang), citations: [], grounded: false, usedSections: [] })
  }

  // Grounded path: build the retrieval prompt from the CANDIDATE system prompt
  // and the retrieved chunks, then one non-streaming Groq call with the candidate
  // tuning. Server still caps max_tokens so a candidate cannot run away.
  const citations = buildCitations(chunks)
  const payload = {
    model: (typeof body.model === 'string' && body.model.trim()) || 'openai/gpt-oss-20b',
    reasoning_effort: (typeof body.reasoning_effort === 'string' && body.reasoning_effort) || 'low',
    temperature: body.temperature != null ? Number(body.temperature) : 0.7,
    max_tokens: Math.min(body.max_tokens ? Number(body.max_tokens) : 700, PREVIEW_MAX_TOKENS),
    messages: [
      { role: 'system', content: buildRetrievalPrompt(body.system_prompt, chunks) },
      { role: 'user', content: message },
    ],
  }

  // Abort the Groq fetch if the admin closes the panel before it returns.
  const ac = new AbortController()
  req.on('close', () => ac.abort())

  let resp
  try {
    resp = await groqChatOnce(payload, ac.signal)
  } catch (err) {
    if (ac.signal.aborted) return // admin left before the preview came back
    if (err.code === 'NO_KEY') return res.status(500).json({ error: 'Missing GROQ_API_KEY on server' })
    console.error('[prompt-preview] groq call failed:', err.message)
    return res.status(502).json({ error: 'preview_failed' })
  }
  if (resp.status < 200 || resp.status >= 300) {
    return res.status(502).json({ error: 'preview_failed' })
  }

  let reply = ''
  try {
    const data = await resp.json()
    reply = (data?.choices?.[0]?.message?.content || '').trim()
  } catch (err) {
    console.error('[prompt-preview] parse failed:', err.message)
    return res.status(502).json({ error: 'preview_failed' })
  }
  if (!reply) return res.status(502).json({ error: 'preview_failed' })

  res.json({ reply, citations, grounded: true, usedSections: citations.map((c) => c.section) })
})
