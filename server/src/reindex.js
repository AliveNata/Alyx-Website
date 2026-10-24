import 'dotenv/config'
import { Router } from 'express'
import { pathToFileURL } from 'node:url'
import { pool, query } from './db.js'
import { embed } from './embed.js'
import { clearCache } from './cache.js'
import { requireAuth } from './auth.js'

// Full "reindex all" for the portfolio_chunks vector store: read every CMS
// record, build its text + citation anchor, embed it, and upsert keyed on
// (source_table, source_id). Rows whose source record is gone get pruned.
// This is the one-shot for the first build and big edits; per-write incremental
// reindex (P2-5) is not here.

// Site section each record type deep-links to. Awards and certificates both
// render in the Recognition section, so they share its anchor.
const ANCHOR = {
  personal_info: '#about',
  skills: '#skills',
  projects: '#projects',
  experiences: '#experience',
  awards: '#recognition',
  certificates: '#recognition',
}

// JSONB columns come back from pg already parsed. Flatten an array of strings
// (or stringify non-string items) into one readable line; skip empty values.
function joinList(value) {
  if (!Array.isArray(value)) return ''
  return value
    .map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
    .filter(Boolean)
    .join(', ')
}

// Drop empty parts and join with '. ' so the embedded text has no blank gaps.
function sentence(parts) {
  return parts.map((p) => (p == null ? '' : String(p).trim())).filter(Boolean).join('. ')
}

// Read the CMS and return the chunks to embed: { source_table, source_id,
// anchor, content }. Skills collapse to one chunk per category (a "skill group"
// is one citation target); every other record is one chunk.
async function collectChunks() {
  const [personal, skillRows, projects, experiences, awards, certificates] = await Promise.all([
    query('SELECT * FROM personal_info WHERE id = 1'),
    query('SELECT category, name FROM skills ORDER BY category ASC, sort_order ASC, id ASC'),
    query('SELECT * FROM projects ORDER BY sort_order ASC, id ASC'),
    query('SELECT * FROM experiences ORDER BY sort_order ASC, id ASC'),
    query('SELECT * FROM awards ORDER BY sort_order ASC, id ASC'),
    query('SELECT * FROM certificates ORDER BY sort_order ASC, id ASC'),
  ])

  const chunks = []

  const p = personal.rows[0]
  if (p) {
    chunks.push({
      source_table: 'personal_info',
      source_id: '1',
      anchor: ANCHOR.personal_info,
      content: sentence([p.name, p.nickname, p.title, p.tagline, p.bio]),
    })
  }

  // Group skill names under their category.
  const byCategory = new Map()
  for (const s of skillRows.rows) {
    if (!byCategory.has(s.category)) byCategory.set(s.category, [])
    byCategory.get(s.category).push(s.name)
  }
  for (const [category, names] of byCategory) {
    chunks.push({
      source_table: 'skills',
      source_id: category,
      anchor: ANCHOR.skills,
      content: sentence([`Skills - ${category}`, names.join(', ')]),
    })
  }

  for (const r of projects.rows) {
    chunks.push({
      source_table: 'projects',
      source_id: String(r.id),
      anchor: ANCHOR.projects,
      content: sentence([r.title, r.category, r.description, joinList(r.tech)]),
    })
  }

  for (const r of experiences.rows) {
    const where = [r.role, r.company].filter(Boolean).join(' at ')
    chunks.push({
      source_table: 'experiences',
      source_id: String(r.id),
      anchor: ANCHOR.experiences,
      content: sentence([
        where,
        r.period,
        r.location,
        r.work_type,
        joinList(r.description),
        joinList(r.technologies),
        joinList(r.projects),
      ]),
    })
  }

  for (const r of awards.rows) {
    chunks.push({
      source_table: 'awards',
      source_id: String(r.id),
      anchor: ANCHOR.awards,
      content: sentence([r.title, r.description, joinList(r.metrics)]),
    })
  }

  for (const r of certificates.rows) {
    chunks.push({
      source_table: 'certificates',
      source_id: String(r.id),
      anchor: ANCHOR.certificates,
      content: sentence([r.title, r.issuer, r.date, r.description]),
    })
  }

  return chunks
}

// Embed every chunk and upsert it, then prune chunks whose source is gone.
// Returns a per-table count for the caller to log or return. Embeds run one at
// a time: the corpus is tiny and serial keeps the model's memory flat. The DB
// writes and the prune share one transaction, so a mid-run failure rolls back
// to the previous state instead of leaving a half-rebuilt store.
export async function reindexAll() {
  const chunks = await collectChunks()
  const client = await pool.connect()
  let summary
  try {
    await client.query('BEGIN')

    for (const c of chunks) {
      const vector = await embed(c.content, 'passage')
      await client.query(
        `INSERT INTO portfolio_chunks (source_table, source_id, anchor, content, embedding, updated_at)
         VALUES ($1, $2, $3, $4, $5::vector, now())
         ON CONFLICT (source_table, source_id)
         DO UPDATE SET anchor = EXCLUDED.anchor,
                       content = EXCLUDED.content,
                       embedding = EXCLUDED.embedding,
                       updated_at = now()`,
        [c.source_table, c.source_id, c.anchor, c.content, `[${vector.join(',')}]`],
      )
    }

    // Prune rows whose (source_table, source_id) is no longer produced above.
    // Skip it when there are no chunks: an empty unnest would match nothing and
    // delete the whole table, which is not what an empty read should do.
    let pruned = 0
    if (chunks.length > 0) {
      const tables = chunks.map((c) => c.source_table)
      const ids = chunks.map((c) => c.source_id)
      const result = await client.query(
        `DELETE FROM portfolio_chunks pc
         WHERE NOT EXISTS (
           SELECT 1 FROM unnest($1::text[], $2::text[]) AS k(source_table, source_id)
           WHERE k.source_table = pc.source_table AND k.source_id = pc.source_id
         )`,
        [tables, ids],
      )
      pruned = result.rowCount
    }

    await client.query('COMMIT')

    const byTable = {}
    for (const c of chunks) byTable[c.source_table] = (byTable[c.source_table] || 0) + 1
    summary = { total: chunks.length, byTable, pruned }
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }

  // Invalidate the shared answer cache (P2-6) after a successful commit: the
  // content these grounded replies cite just changed, so stale answers must go.
  // Best-effort - the reindex itself already committed, so a cache-clear hiccup
  // must not report a good reindex as failed; TTL expiry is the backstop. This
  // also gives reindex-on-write (P2-5) free invalidation later.
  try {
    await clearCache()
  } catch (e) {
    console.error('[reindex] cache clear failed (entries will expire via TTL):', e.message)
  }
  return summary
}

// Admin-only trigger for a full reindex. Mounted under /api/admin/reindex.
export const reindexRouter = Router()
reindexRouter.post('/', requireAuth, async (_req, res) => {
  const summary = await reindexAll()
  res.json({ ok: true, ...summary })
})

// CLI entry point: `npm run reindex`. Guarded so importing this module for the
// route does not kick off a reindex or close the pool.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  reindexAll()
    .then((summary) => {
      console.log('Reindex complete:', JSON.stringify(summary))
      return pool.end()
    })
    .catch((e) => {
      console.error('Reindex failed:', e.message)
      process.exit(1)
    })
}
