import 'dotenv/config'
import { pool } from '../src/db.js'
import { retrieveChunks } from '../src/retrieve.js'

// RAG threshold tuning helper (P2-3, decision B). NOT part of the request path
// and NOT run in prod by the app. It embeds a batch of on-topic and off-topic
// questions, runs the same top-K search /api/chat uses, and prints the best
// similarity + top hit per query. Read the gap between the on-topic cluster and
// the off-topic cluster to pick RAG_MIN_SIM from real data, not a guess.
//
// Usage (needs DATABASE_URL set and portfolio_chunks populated via `npm run
// reindex`, pointed at a dev DB or the VPS DB you set in DATABASE_URL):
//   cd server && node scripts/rag-eval.js
// The first query loads the embedding model (~seconds, ~412MB RSS); the rest
// run fast. Add your own questions to the arrays below as the portfolio grows.

const ON_TOPIC = [
  'What projects has Alief built with BigQuery?',
  'Proyek apa saja yang pernah dibangun Alief?',
  'What is Alief experience with data engineering?',
  'Does Alief know Airflow and dbt?',
  'Where has Alief worked?',
  'What certifications does Alief have?',
]

const OFF_TOPIC = [
  "What is Alief's favorite color?",
  'How do I bake sourdough bread?',
  'What is the capital of France?',
  'Write me a poem about the ocean.',
]

const TOP_K = Number.parseInt(process.env.RAG_TOP_K, 10) || 5

async function run(label, queries) {
  console.log(`\n=== ${label} ===`)
  for (const q of queries) {
    const chunks = await retrieveChunks(q, TOP_K)
    const best = chunks[0] || null
    const bestSim = best ? 1 - Number(best.distance) : 0
    const hit = best ? `[${best.source_table}#${best.anchor || best.source_id}]` : '(no chunks)'
    console.log(`${bestSim.toFixed(4)}  ${hit.padEnd(28)} ${q}`)
  }
}

try {
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM portfolio_chunks')
  console.log(`portfolio_chunks rows: ${rows[0].n} | TOP_K=${TOP_K}`)
  if (rows[0].n === 0) {
    console.error('portfolio_chunks is empty. Run `npm run reindex` first.')
    process.exit(1)
  }
  console.log('\nbest_sim  top_hit                      query')
  await run('ON-TOPIC (expect high similarity)', ON_TOPIC)
  await run('OFF-TOPIC (expect low similarity)', OFF_TOPIC)
  console.log('\nPick RAG_MIN_SIM between the two clusters: above the off-topic')
  console.log('scores, below the on-topic ones.')
} catch (err) {
  console.error('rag-eval failed:', err.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
