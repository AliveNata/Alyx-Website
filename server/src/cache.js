import crypto from 'node:crypto'
import { query } from './db.js'

// Shared server-side answer cache (P2-6). A grounded portfolio reply costs one
// Groq call to compute; this layer stores it keyed by the normalized question so
// the same question from any later visitor (or a cleared-localStorage session) is
// served from Postgres with no Groq call and no token budget spent. It sits
// behind the client's per-viewer localStorage cache: it only does work when that
// missed. Only grounded portfolio answers are ever stored here - curhat, english,
// the not-sure reply and the legacy stuffing fallback never touch this module
// (chat.js enforces that at the call sites).

// TTL and size cap are env-tunable (see .env.example). created_at drives both:
// an entry older than TTL is a miss and gets swept; rows beyond the cap are
// trimmed oldest-first.
const TTL_DAYS = Number.parseInt(process.env.CACHE_TTL_DAYS, 10) || 14
const MAX_ROWS = Number.parseInt(process.env.CACHE_MAX_ROWS, 10) || 2000

// Normalize a query the same way the client's normKey does (src/components/
// ChatBot.jsx): lowercase, trim, collapse whitespace, strip ? ! . , so trivial
// wording differences ("your skills?" vs "your skills") map to one entry and the
// two cache layers agree on what "the same question" is. Near-duplicate wording
// (embedding similarity) is deliberately out of scope for P2-6.
function normalizeQuery(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[?!.,]/g, '')
}

// sha256 hex of mode|lang|normalizedQuery, optionally scoped by conversation
// history. Hashing keeps the primary key a fixed length regardless of how long
// the question is. mode is always 'portfolio' at the only call site; lang is the
// resolved reply language (replies differ per language, so it is part of the
// identity of a cached answer).
//
// history is the capped turns the LLM actually saw (PK-2). A context-dependent
// follow-up ("tell me more") means different things after different prior turns,
// so its cached answer must not replay across sessions: when history is present
// its hash is folded into the key, scoping the entry to that exact conversation.
// When history is empty the component is omitted entirely, so the basis is
// byte-identical to the pre-PK-2 format and a first-turn FAQ still shares ONE
// cache row across all sessions (the P2-6 cross-session hit is preserved).
export function cacheKey(mode, lang, text, history) {
  let basis = `${mode}|${lang || ''}|${normalizeQuery(text)}`
  const turns = Array.isArray(history) ? history : []
  if (turns.length) {
    const histBasis = turns.map((m) => `${m.role}:${m.content}`).join('\n')
    const histHash = crypto.createHash('sha256').update(histBasis).digest('hex')
    basis += `|${histHash}`
  }
  return crypto.createHash('sha256').update(basis).digest('hex')
}

// Return { reply, citations } for a live (non-expired) entry, or null on a miss.
// An entry past the TTL is treated as a miss (and will be removed by sweepCache),
// so a stale answer is never served even before the sweep runs. Parameterized:
// the key is bound, never concatenated.
export async function getCached(key) {
  const { rows } = await query(
    `SELECT reply, citations
       FROM chat_cache
      WHERE key = $1
        AND created_at > now() - make_interval(days => $2)`,
    [key, TTL_DAYS],
  )
  if (!rows[0]) return null
  return { reply: rows[0].reply, citations: rows[0].citations || [] }
}

// Count a hit. Best-effort and separate from getCached so a read stays a pure
// SELECT; the caller fires this without blocking the response.
export async function bumpHits(key) {
  await query('UPDATE chat_cache SET hits = hits + 1 WHERE key = $1', [key])
}

// Store (or refresh) a grounded answer. On conflict the content and created_at
// are refreshed (a fresh TTL window) while hits is left to accumulate. citations
// is serialized to jsonb; an empty array is valid (grounded reply that cited no
// allowlisted section).
export async function putCached(key, reply, citations, lang) {
  await query(
    `INSERT INTO chat_cache (key, reply, citations, lang, created_at, hits)
     VALUES ($1, $2, $3::jsonb, $4, now(), 0)
     ON CONFLICT (key) DO UPDATE SET
       reply = EXCLUDED.reply,
       citations = EXCLUDED.citations,
       lang = EXCLUDED.lang,
       created_at = now()`,
    [key, reply, JSON.stringify(Array.isArray(citations) ? citations : []), lang || null],
  )
}

// Drop every entry. Called at the end of a successful reindex so an admin content
// change never leaves stale grounded answers behind. DELETE (not TRUNCATE) so the
// non-superuser app role on the VPS can run it without owning the table.
export async function clearCache() {
  await query('DELETE FROM chat_cache')
}

// Bound the table: remove expired rows, then trim anything beyond the newest
// MAX_ROWS (oldest dropped first). Cheap and parameterized; the caller runs it
// best-effort after storing a new entry, so it only fires when the table grew.
export async function sweepCache() {
  await query(
    `DELETE FROM chat_cache WHERE created_at <= now() - make_interval(days => $1)`,
    [TTL_DAYS],
  )
  await query(
    `DELETE FROM chat_cache
      WHERE key IN (
        SELECT key FROM chat_cache
        ORDER BY created_at DESC
        OFFSET $1
      )`,
    [MAX_ROWS],
  )
}
