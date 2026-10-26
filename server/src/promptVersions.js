import { Router } from 'express'
import { query } from './db.js'
import { requireAuth } from './auth.js'

// Prompt version history (PK-1). A snapshot captures the portfolio-mode prompt
// plus the LLM tuning (model/reasoning_effort/temperature/max_tokens/greeting),
// so loading an old version back brings a coherent config, not just text. The
// snapshot runs on a settings save (chatbot.js), the history lists here, and the
// playground (promptPreview.js) tests a candidate before it is saved.

// The fields a snapshot tracks. A save only creates a version when one of these
// changed, so toggling a feature or editing a lead URL never spams the history.
const TRACKED = ['system_prompt', 'model', 'reasoning_effort', 'temperature', 'max_tokens', 'greeting']
const MAX_VERSIONS = 50 // keep the history bounded; older rows are pruned on insert

// Normalize a tracked field for comparison. temperature/max_tokens come back
// from pg as strings (NUMERIC/INT), and the just-saved config carries the same,
// so compare them as numbers; text fields compare as trimmed strings. A missing
// value normalizes to '' / NaN so a null never looks different from a blank.
function norm(field, value) {
  if (field === 'temperature' || field === 'max_tokens') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return String(value ?? '')
}

// Decide whether `candidate` differs from `latest` on any tracked field. No
// latest (empty history) always differs, so the first save seeds the history.
// Pure and exported for the unit test (promptVersions.test.js).
export function versionDiffers(latest, candidate) {
  if (!latest) return true
  return TRACKED.some((f) => norm(f, latest[f]) !== norm(f, candidate[f]))
}

// Snapshot the just-saved config (chatbot.js calls this after the PUT succeeds).
// Best-effort by contract: it swallows and logs its own errors so a snapshot
// failure can never fail the settings save. Inserts only when the config differs
// from the latest version (dedup), then prunes to the newest MAX_VERSIONS.
export async function snapshotPromptVersion(config) {
  if (!config) return
  try {
    const { rows } = await query(
      `SELECT ${TRACKED.join(', ')} FROM prompt_versions ORDER BY created_at DESC, id DESC LIMIT 1`,
    )
    if (!versionDiffers(rows[0] || null, config)) return

    await query(
      `INSERT INTO prompt_versions (system_prompt, model, reasoning_effort, temperature, max_tokens, greeting)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        config.system_prompt ?? '',
        config.model ?? '',
        config.reasoning_effort ?? '',
        config.temperature ?? null,
        config.max_tokens ?? null,
        config.greeting ?? '',
      ],
    )

    // Keep only the newest MAX_VERSIONS. created_at DESC, id DESC tie-breaks so
    // two rows in the same instant prune deterministically.
    await query(
      `DELETE FROM prompt_versions
        WHERE id NOT IN (
          SELECT id FROM prompt_versions ORDER BY created_at DESC, id DESC LIMIT $1
        )`,
      [MAX_VERSIONS],
    )
  } catch (err) {
    console.error('[prompt-versions] snapshot failed (save unaffected):', err.message)
  }
}

export const promptVersionsRouter = Router()

// GET /api/admin/prompt-versions - newest first. Config only (no PII), so the
// full system_prompt ships for the "view full" expand; the client derives the
// list preview from it. Bounded to MAX_VERSIONS, matching the prune above.
promptVersionsRouter.get('/', requireAuth, async (_req, res) => {
  const { rows } = await query(
    `SELECT id, created_at, model, reasoning_effort, temperature, max_tokens, greeting, system_prompt
       FROM prompt_versions
      ORDER BY created_at DESC, id DESC
      LIMIT $1`,
    [MAX_VERSIONS],
  )
  res.json({ rows })
})
